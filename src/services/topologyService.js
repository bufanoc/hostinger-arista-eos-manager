/**
 * Network Topology Service
 * Handles fetching network topology data from Arista EOS switches
 */

import { executeCommands } from './connectionManager';

/**
 * Fetch LLDP (Link Layer Discovery Protocol) neighbors information from a switch
 * @param {string} switchId - ID of the switch to query 
 * @returns {Promise<Array>} - Promise resolving to LLDP neighbors
 */
export const getLldpNeighbors = async (switchId) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    // Get LLDP neighbors data from the switch
    const result = await executeCommands(switchId, ['show lldp neighbors detail']);
    
    if (result && result[0] && result[0].output) {
      const neighbors = parseLldpNeighbors(result[0].output);
      return neighbors;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching LLDP neighbors:', error);
    throw error;
  }
};

/**
 * Parse LLDP neighbors from command output
 * @param {string} output - Output from 'show lldp neighbors detail' command
 * @returns {Array} - Array of neighbor objects
 */
const parseLldpNeighbors = (output) => {
  const neighbors = [];
  
  // Split the output into neighbor sections
  const neighborSections = output.split('Port : ').slice(1);
  
  for (const section of neighborSections) {
    try {
      // Extract port
      const portMatch = section.match(/^([^\s]+)/);
      if (!portMatch) continue;
      
      const port = portMatch[1];
      
      // Extract remote device info
      const chassisIdMatch = section.match(/Chassis id : ([^\s]+)/);
      const portIdMatch = section.match(/Port id : ([^\r\n]+)/);
      const systemNameMatch = section.match(/System Name : "([^"]+)"/);
      const systemDescMatch = section.match(/System Description : "([^"]+)"/);
      const portDescMatch = section.match(/Port Description : "([^"]+)"/);
      
      const neighbor = {
        localPort: port,
        remoteChassisId: chassisIdMatch ? chassisIdMatch[1] : 'Unknown',
        remotePort: portIdMatch ? portIdMatch[1].trim() : 'Unknown',
        remoteDeviceName: systemNameMatch ? systemNameMatch[1] : 'Unknown',
        remoteDescription: systemDescMatch ? systemDescMatch[1] : '',
        remotePortDescription: portDescMatch ? portDescMatch[1] : '',
        linkType: 'physical',
      };
      
      neighbors.push(neighbor);
    } catch (err) {
      console.warn('Error parsing LLDP neighbor section:', err);
    }
  }
  
  return neighbors;
};

/**
 * Fetch interface status information from a switch
 * @param {string} switchId - ID of the switch to query 
 * @returns {Promise<Object>} - Promise resolving to interface status info
 */
export const getInterfaceStatus = async (switchId) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    // Get interface status data from the switch
    const result = await executeCommands(switchId, ['show interfaces status']);
    
    if (result && result[0] && result[0].output) {
      const interfaces = parseInterfaceStatus(result[0].output);
      return interfaces;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching interface status:', error);
    throw error;
  }
};

/**
 * Parse interface status from command output
 * @param {string} output - Output from 'show interfaces status' command
 * @returns {Object} - Object mapping interface names to their status
 */
const parseInterfaceStatus = (output) => {
  const interfaces = {};
  const lines = output.trim().split('\n');
  
  // Skip header lines
  let dataStarted = false;
  
  for (const line of lines) {
    // Skip header lines and empty lines
    if (!dataStarted) {
      if (line.includes('Port') && line.includes('Status') && line.includes('Vlan')) {
        dataStarted = true;
      }
      continue;
    }
    
    if (line.trim() === '') continue;
    
    // Extract interface name and status
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3) {
      const interfaceName = parts[0];
      const status = parts[1].toLowerCase(); // connected, notconnect, disabled, etc.
      
      interfaces[interfaceName] = {
        status: status,
        vlan: parts[2] !== 'routed' ? parts[2] : 'N/A',
        duplex: parts.length > 3 ? parts[3] : 'unknown',
        speed: parts.length > 4 ? parts[4] : 'unknown',
        type: parts.length > 5 ? parts.slice(5).join(' ') : ''
      };
    }
  }
  
  return interfaces;
};

/**
 * Build a network topology model from one or more switches
 * @param {Array} switches - Array of switch objects with id property
 * @returns {Promise<Object>} - Promise resolving to network topology model
 */
export const buildNetworkTopology = async (switches) => {
  try {
    if (!switches || !Array.isArray(switches) || switches.length === 0) {
      return { nodes: [], links: [] };
    }
    
    const topology = {
      nodes: [],
      links: []
    };
    
    // Set to track already processed devices by ID to avoid duplicates
    const processedNodeIds = new Set();
    
    // Process each switch
    for (const switchData of switches) {
      // Skip if no id or already processed
      if (!switchData.id || processedNodeIds.has(switchData.id)) continue;
      
      // Add the switch to nodes
      const switchNode = {
        id: switchData.id,
        name: switchData.hostname || `Switch-${switchData.id}`,
        type: 'switch',
        status: 'online',
        model: switchData.model || '',
        ipAddress: switchData.ipAddress || '',
        // We'll calculate position later
        x: 0,
        y: 0
      };
      
      topology.nodes.push(switchNode);
      processedNodeIds.add(switchData.id);
      
      try {
        // Get LLDP neighbors for this switch
        const neighbors = await getLldpNeighbors(switchData.id);
        // Get interface status
        const interfaces = await getInterfaceStatus(switchData.id);
        
        // Process neighbors to add nodes and links
        for (const neighbor of neighbors) {
          // Create a unique ID for the neighbor based on chassis ID
          const neighborId = `device-${neighbor.remoteChassisId.replace(/:/g, '')}`;
          
          // Check if we already added this device
          if (!processedNodeIds.has(neighborId)) {
            // Determine node type based on description or system name
            let nodeType = 'unknown';
            const description = (neighbor.remoteDescription || '').toLowerCase();
            
            if (description.includes('switch') || description.includes('arista')) {
              nodeType = 'switch';
            } else if (description.includes('router') || description.includes('gateway')) {
              nodeType = 'router';
            } else if (description.includes('server') || description.includes('host')) {
              nodeType = 'server';
            } else if (description.includes('ap') || description.includes('access point')) {
              nodeType = 'wireless';
            }
            
            // Add the neighbor as a new node
            const neighborNode = {
              id: neighborId,
              name: neighbor.remoteDeviceName || `Device-${neighborId.substring(7, 13)}`,
              type: nodeType, 
              status: 'discovered',
              // Will position later
              x: 0,
              y: 0
            };
            
            topology.nodes.push(neighborNode);
            processedNodeIds.add(neighborId);
          }
          
          // Create a link between the switch and the neighbor
          const linkId = `link-${switchData.id}-${neighborId}-${neighbor.localPort}`;
          const linkStatus = interfaces[neighbor.localPort]?.status === 'connected' ? 'up' : 'down';
          
          topology.links.push({
            id: linkId,
            source: switchData.id,
            target: neighborId,
            sourcePort: neighbor.localPort,
            targetPort: neighbor.remotePort,
            status: linkStatus
          });
        }
      } catch (error) {
        console.error(`Error processing switch ${switchData.id}:`, error);
        // Continue with the next switch
      }
    }
    
    // Position nodes in a force-directed layout
    positionNodes(topology.nodes);
    
    return topology;
  } catch (error) {
    console.error('Error building network topology:', error);
    throw error;
  }
};

/**
 * Position nodes in a simple force-directed layout
 * @param {Array} nodes - Array of node objects to position
 */
const positionNodes = (nodes) => {
  if (!nodes || nodes.length === 0) return;
  
  // If only one node, center it
  if (nodes.length === 1) {
    nodes[0].x = 50;
    nodes[0].y = 50;
    return;
  }
  
  // For multiple nodes, arrange switches at top, then other devices below
  const switches = nodes.filter(node => node.type === 'switch');
  const otherDevices = nodes.filter(node => node.type !== 'switch');
  
  // Position switches in a row at the top
  const switchSpacing = 100 / (switches.length + 1);
  switches.forEach((node, index) => {
    node.x = switchSpacing * (index + 1);
    node.y = 25;
  });
  
  // Position other devices below
  const deviceSpacing = 100 / (otherDevices.length + 1);
  otherDevices.forEach((node, index) => {
    node.x = deviceSpacing * (index + 1);
    node.y = 75;
  });
};
