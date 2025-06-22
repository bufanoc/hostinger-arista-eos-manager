/**
 * Interface Configuration Service
 * Handles retrieving and configuring Arista EOS switch interfaces
 */

import { executeCommands } from './connectionManager';

/**
 * Get detailed information about all interfaces on a switch
 * @param {string} switchId - ID of the switch
 * @returns {Promise} - Promise with interface information
 */
export const getInterfaceDetails = async (switchId) => {
  try {
    const commands = [
      'show interfaces',
      'show interfaces status',
      'show interfaces description',
      'show ip interface brief'
    ];
    
    const results = await executeCommands(switchId, commands);
    
    return processInterfaceData(results);
  } catch (error) {
    console.error('Error getting interface details:', error);
    throw error;
  }
};

/**
 * Process raw interface data into a standardized format
 * @param {Array} rawData - Raw data from the interface commands
 * @returns {Array} - Formatted interface data
 */
export const processInterfaceData = (rawData) => {
  if (!rawData || rawData.length < 3) {
    throw new Error('Incomplete interface data received');
  }
  
  const interfacesData = rawData[0].interfaces || {};
  const statusData = rawData[1].interfaceStatuses || {};
  const descriptionData = rawData[2].interfaceDescriptions || {};
  const ipData = rawData[3].interfaces || {};
  
  // Combine data from all sources
  const processedInterfaces = [];
  
  // Create a set of all interface names
  const interfaceNames = new Set([
    ...Object.keys(interfacesData),
    ...Object.keys(statusData),
    ...Object.keys(descriptionData),
    ...Object.keys(ipData)
  ]);
  
  // Process each interface
  interfaceNames.forEach(name => {
    // Skip interfaces that are likely not physical ports (CPU, etc.)
    if (name.startsWith('CPU') || name.startsWith('Loop')) {
      return;
    }
    
    const baseData = interfacesData[name] || {};
    const status = statusData[name] || {};
    const description = descriptionData[name] || {};
    const ipInfo = ipData[name] || {};
    
    const interfaceType = determineInterfaceType(name);
    
    // Create a standardized interface object
    const interfaceObj = {
      name,
      type: interfaceType,
      description: description.description || '',
      status: status.linkStatus === 'connected' ? 'up' : 'down',
      enabled: status.interfaceStatus !== 'disabled' && status.interfaceStatus !== 'notconnect',
      speed: status.bandwidth || baseData.bandwidth || 0,
      vlan: status.vlanInformation?.vlanId || null,
      mode: determineInterfaceMode(status),
      macAddress: baseData.physicalAddress || '',
      ipAddress: ipInfo.interfaceAddress?.ipAddr?.address || '',
      ipPrefixLength: ipInfo.interfaceAddress?.ipAddr?.maskLen || 0,
      mtu: baseData.mtu || 0,
      counters: {
        inputErrors: baseData.counters?.inputErrors || 0,
        outputErrors: baseData.counters?.outputErrors || 0,
        inputBytes: baseData.counters?.inOctets || 0,
        outputBytes: baseData.counters?.outOctets || 0,
        inputPackets: baseData.counters?.inUcastPkts || 0,
        outputPackets: baseData.counters?.outUcastPkts || 0
      }
    };
    
    processedInterfaces.push(interfaceObj);
  });
  
  return processedInterfaces.sort((a, b) => {
    // Sort Ethernet interfaces numerically
    if (a.name.startsWith('Ethernet') && b.name.startsWith('Ethernet')) {
      const numA = parseInt(a.name.replace('Ethernet', ''));
      const numB = parseInt(b.name.replace('Ethernet', ''));
      return numA - numB;
    }
    return a.name.localeCompare(b.name);
  });
};

/**
 * Update the description of an interface
 * @param {string} switchId - ID of the switch
 * @param {string} interfaceName - Name of the interface
 * @param {string} description - New description
 * @returns {Promise} - Promise with command result
 */
export const setInterfaceDescription = async (switchId, interfaceName, description) => {
  try {
    // Sanitize input to prevent command injection
    const sanitizedInterface = interfaceName.replace(/[^a-zA-Z0-9\/]/g, '');
    const sanitizedDescription = description.replace(/['"]/g, '');
    
    const commands = [
      'configure',
      `interface ${sanitizedInterface}`,
      `description ${sanitizedDescription}`,
      'end'
    ];
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error setting description for ${interfaceName}:`, error);
    throw error;
  }
};

/**
 * Update the admin status of an interface (enabled/disabled)
 * @param {string} switchId - ID of the switch
 * @param {string} interfaceName - Name of the interface
 * @param {boolean} enabled - Whether the interface should be enabled
 * @returns {Promise} - Promise with command result
 */
export const setInterfaceEnabled = async (switchId, interfaceName, enabled) => {
  try {
    const sanitizedInterface = interfaceName.replace(/[^a-zA-Z0-9\/]/g, '');
    
    const commands = [
      'configure',
      `interface ${sanitizedInterface}`,
      enabled ? 'no shutdown' : 'shutdown',
      'end'
    ];
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error ${enabled ? 'enabling' : 'disabling'} ${interfaceName}:`, error);
    throw error;
  }
};

/**
 * Set interface mode (access or trunk)
 * @param {string} switchId - ID of the switch
 * @param {string} interfaceName - Name of the interface
 * @param {string} mode - Mode (access, trunk, routed)
 * @param {number} vlan - VLAN ID (for access mode)
 * @returns {Promise} - Promise with command result
 */
export const setInterfaceMode = async (switchId, interfaceName, mode, vlan = null) => {
  try {
    const sanitizedInterface = interfaceName.replace(/[^a-zA-Z0-9\/]/g, '');
    
    const commands = [
      'configure',
      `interface ${sanitizedInterface}`
    ];
    
    if (mode === 'routed') {
      commands.push('no switchport');
    } else {
      commands.push('switchport');
      
      if (mode === 'access' && vlan) {
        commands.push('switchport mode access');
        commands.push(`switchport access vlan ${vlan}`);
      } else if (mode === 'trunk') {
        commands.push('switchport mode trunk');
      }
    }
    
    commands.push('end');
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error setting mode for ${interfaceName}:`, error);
    throw error;
  }
};

/**
 * Helper function to determine interface type based on name
 * @param {string} name - Interface name
 * @returns {string} - Interface type
 */
function determineInterfaceType(name) {
  if (name.startsWith('Ethernet')) return 'ethernet';
  if (name.startsWith('Management')) return 'management';
  if (name.startsWith('Port-Channel')) return 'port-channel';
  if (name.startsWith('Vlan')) return 'vlan';
  if (name.startsWith('Loopback')) return 'loopback';
  return 'other';
}

/**
 * Helper function to determine interface mode from status data
 * @param {Object} status - Interface status data
 * @returns {string} - Interface mode
 */
function determineInterfaceMode(status) {
  if (!status.vlanInformation) return 'routed';
  if (status.vlanInformation.interfaceMode === 'access') return 'access';
  if (status.vlanInformation.interfaceMode === 'trunk') return 'trunk';
  return 'unknown';
}
