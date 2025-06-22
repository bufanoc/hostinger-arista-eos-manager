/**
 * Routing Configuration Service
 * Handles fetching and configuring routing information on Arista EOS switches
 */

import { executeCommands } from './connectionManager';

/**
 * Fetch static routes from the switch
 * @param {string} switchId - ID of the switch to fetch routes from
 * @returns {Promise<Array>} - Promise resolving to array of static routes
 */
export const getStaticRoutes = async (switchId) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    // Get the static routes from the switch
    const result = await executeCommands(switchId, ['show ip route static']);
    
    // Process the result to extract static routes
    if (result && result[0] && result[0].output) {
      const output = result[0].output;
      
      // Parse the output and extract the static routes
      const routes = parseStaticRoutes(output);
      return routes;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching static routes:', error);
    throw error;
  }
};

/**
 * Parse the static routes output from show ip route command
 * @param {string} output - Output from 'show ip route static' command
 * @returns {Array} - Array of parsed static route objects
 */
const parseStaticRoutes = (output) => {
  const routes = [];
  const routeRegex = /^S\s+(\d+\.\d+\.\d+\.\d+\/\d+)(?:\s+\[(\d+)\/(\d+)\])?\s+(?:via\s+)?(\d+\.\d+\.\d+\.\d+)/gm;
  
  // Find all matches in the output
  let match;
  while ((match = routeRegex.exec(output)) !== null) {
    routes.push({
      id: `static-${routes.length + 1}`,
      prefix: match[1],
      nextHop: match[4],
      adminDistance: match[2] ? parseInt(match[2]) : 1,
      metric: match[3] ? parseInt(match[3]) : 0,
      type: 'static'
    });
  }
  
  return routes;
};

/**
 * Add a new static route
 * @param {string} switchId - ID of the switch
 * @param {string} prefix - Network prefix with mask (e.g. 10.0.0.0/24)
 * @param {string} nextHop - Next hop IP address
 * @param {number} [adminDistance=1] - Administrative distance
 * @returns {Promise<Object>} - Promise resolving to command result
 */
export const addStaticRoute = async (switchId, prefix, nextHop, adminDistance = 1) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    if (!prefix || !nextHop) {
      throw new Error('Prefix and next hop are required');
    }
    
    // Validate prefix format
    if (!isValidPrefix(prefix)) {
      throw new Error('Invalid prefix format. Expected format: x.x.x.x/y');
    }
    
    // Validate IP address format
    if (!isValidIpAddress(nextHop)) {
      throw new Error('Invalid next hop IP address');
    }
    
    const command = `ip route ${prefix} ${nextHop} ${adminDistance !== 1 ? adminDistance : ''}`.trim();
    const result = await executeCommands(switchId, ['configure', command, 'end']);
    
    return result;
  } catch (error) {
    console.error('Error adding static route:', error);
    throw error;
  }
};

/**
 * Delete a static route
 * @param {string} switchId - ID of the switch
 * @param {string} prefix - Network prefix with mask
 * @param {string} nextHop - Next hop IP address
 * @returns {Promise<Object>} - Promise resolving to command result
 */
export const deleteStaticRoute = async (switchId, prefix, nextHop) => {
  try {
    if (!switchId || !prefix || !nextHop) {
      throw new Error('Switch ID, prefix and next hop are required');
    }
    
    const command = `no ip route ${prefix} ${nextHop}`;
    const result = await executeCommands(switchId, ['configure', command, 'end']);
    
    return result;
  } catch (error) {
    console.error('Error deleting static route:', error);
    throw error;
  }
};

/**
 * Fetch BGP configuration from the switch
 * @param {string} switchId - ID of the switch
 * @returns {Promise<Object>} - Promise resolving to BGP configuration
 */
export const getBgpConfig = async (switchId) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    // Get the BGP configuration summary from the switch
    const result = await executeCommands(switchId, ['show ip bgp summary']);
    
    if (result && result[0] && result[0].output) {
      const output = result[0].output;
      
      // Parse the BGP configuration
      const bgpConfig = parseBgpSummary(output);
      
      // If there's a valid AS number, get the BGP neighbors
      if (bgpConfig.asn) {
        const neighborsResult = await executeCommands(switchId, ['show ip bgp neighbors']);
        if (neighborsResult && neighborsResult[0] && neighborsResult[0].output) {
          bgpConfig.neighbors = parseBgpNeighbors(neighborsResult[0].output);
        }
      }
      
      return bgpConfig;
    }
    
    return { enabled: false, asn: null, routerId: null, neighbors: [] };
  } catch (error) {
    console.error('Error fetching BGP configuration:', error);
    // If BGP is not configured, return default structure
    if (error.message && error.message.includes('not enabled')) {
      return { enabled: false, asn: null, routerId: null, neighbors: [] };
    }
    throw error;
  }
};

/**
 * Parse BGP summary output
 * @param {string} output - Output from 'show ip bgp summary' command
 * @returns {Object} - Parsed BGP configuration
 */
const parseBgpSummary = (output) => {
  const bgpConfig = {
    enabled: false,
    asn: null,
    routerId: null,
    neighbors: []
  };
  
  // Check if BGP is enabled
  if (output.includes('BGP not active')) {
    return bgpConfig;
  }
  
  // Extract BGP router ID and ASN
  const routerIdRegex = /BGP router identifier (\d+\.\d+\.\d+\.\d+), local AS number (\d+)/;
  const routerIdMatch = output.match(routerIdRegex);
  
  if (routerIdMatch) {
    bgpConfig.enabled = true;
    bgpConfig.routerId = routerIdMatch[1];
    bgpConfig.asn = parseInt(routerIdMatch[2]);
  }
  
  // Extract BGP neighbors from summary
  const neighborRegex = /^(\d+\.\d+\.\d+\.\d+)\s+\d+\s+(\d+)\s+/gm;
  let match;
  while ((match = neighborRegex.exec(output)) !== null) {
    bgpConfig.neighbors.push({
      ip: match[1],
      remoteAsn: parseInt(match[2])
    });
  }
  
  return bgpConfig;
};

/**
 * Parse BGP neighbors output for detailed information
 * @param {string} output - Output from 'show ip bgp neighbors' command
 * @returns {Array} - Array of neighbor objects with detailed information
 */
const parseBgpNeighbors = (output) => {
  const neighbors = [];
  
  // Split the output by neighbor sections
  const sections = output.split(/BGP neighbor is /g).slice(1);
  
  for (const section of sections) {
    // Extract neighbor IP
    const ipMatch = section.match(/^(\d+\.\d+\.\d+\.\d+)/);
    if (!ipMatch) continue;
    
    const neighbor = {
      ip: ipMatch[1],
      remoteAsn: null,
      state: 'Idle',
      uptime: 'never',
      prefixesReceived: 0,
      prefixesSent: 0
    };
    
    // Extract remote AS
    const remoteAsMatch = section.match(/Remote AS (\d+)/);
    if (remoteAsMatch) {
      neighbor.remoteAsn = parseInt(remoteAsMatch[1]);
    }
    
    // Extract BGP state
    const stateMatch = section.match(/BGP state = (\w+)/);
    if (stateMatch) {
      neighbor.state = stateMatch[1];
    }
    
    // Extract uptime
    const uptimeMatch = section.match(/Uptime: ([\d:]+)/);
    if (uptimeMatch) {
      neighbor.uptime = uptimeMatch[1];
    }
    
    // Extract prefixes
    const prefixesMatch = section.match(/(\d+) accepted prefixes/);
    if (prefixesMatch) {
      neighbor.prefixesReceived = parseInt(prefixesMatch[1]);
    }
    
    neighbors.push(neighbor);
  }
  
  return neighbors;
};

/**
 * Configure BGP on the switch
 * @param {string} switchId - ID of the switch
 * @param {number} asn - Autonomous System Number
 * @param {string} routerId - Router ID (IP address format)
 * @returns {Promise<Object>} - Promise resolving to command result
 */
export const configureBgp = async (switchId, asn, routerId) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    if (!asn || asn < 1 || asn > 4294967295) {
      throw new Error('Invalid ASN. Must be between 1 and 4294967295');
    }
    
    if (routerId && !isValidIpAddress(routerId)) {
      throw new Error('Invalid router ID format. Must be a valid IP address');
    }
    
    const commands = [
      'configure',
      `router bgp ${asn}`
    ];
    
    if (routerId) {
      commands.push(`router-id ${routerId}`);
    }
    
    commands.push('end');
    
    const result = await executeCommands(switchId, commands);
    return result;
  } catch (error) {
    console.error('Error configuring BGP:', error);
    throw error;
  }
};

/**
 * Add a BGP neighbor
 * @param {string} switchId - ID of the switch
 * @param {number} asn - Local ASN
 * @param {string} neighborIp - Neighbor IP address
 * @param {number} remoteAsn - Remote AS number
 * @returns {Promise<Object>} - Promise resolving to command result
 */
export const addBgpNeighbor = async (switchId, asn, neighborIp, remoteAsn) => {
  try {
    if (!switchId || !asn || !neighborIp || !remoteAsn) {
      throw new Error('Switch ID, ASN, neighbor IP, and remote ASN are required');
    }
    
    if (!isValidIpAddress(neighborIp)) {
      throw new Error('Invalid neighbor IP address');
    }
    
    const commands = [
      'configure',
      `router bgp ${asn}`,
      `neighbor ${neighborIp} remote-as ${remoteAsn}`,
      'end'
    ];
    
    const result = await executeCommands(switchId, commands);
    return result;
  } catch (error) {
    console.error('Error adding BGP neighbor:', error);
    throw error;
  }
};

/**
 * Remove a BGP neighbor
 * @param {string} switchId - ID of the switch
 * @param {number} asn - Local ASN
 * @param {string} neighborIp - Neighbor IP address to remove
 * @returns {Promise<Object>} - Promise resolving to command result
 */
export const removeBgpNeighbor = async (switchId, asn, neighborIp) => {
  try {
    if (!switchId || !asn || !neighborIp) {
      throw new Error('Switch ID, ASN, and neighbor IP are required');
    }
    
    const commands = [
      'configure',
      `router bgp ${asn}`,
      `no neighbor ${neighborIp}`,
      'end'
    ];
    
    const result = await executeCommands(switchId, commands);
    return result;
  } catch (error) {
    console.error('Error removing BGP neighbor:', error);
    throw error;
  }
};

/**
 * Check if a string is a valid IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IP address
 */
const isValidIpAddress = (ip) => {
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

/**
 * Check if a string is a valid network prefix (CIDR notation)
 * @param {string} prefix - Network prefix to validate
 * @returns {boolean} - True if valid prefix
 */
const isValidPrefix = (prefix) => {
  const parts = prefix.split('/');
  
  if (parts.length !== 2) return false;
  
  const ip = parts[0];
  const mask = parseInt(parts[1]);
  
  if (!isValidIpAddress(ip)) return false;
  if (isNaN(mask) || mask < 0 || mask > 32) return false;
  
  return true;
};
