/**
 * Connection Manager Service
 * Manages connections to Arista switches and stores connection details
 */

import { connectToSwitch, processSwitchData } from './aristaAPI';

// Store connections in memory for now
const connections = new Map();

/**
 * Create a new connection to a switch
 * @param {string} ipAddress - IP address of the switch
 * @param {string} username - Username for authentication
 * @param {string} password - Password for authentication
 * @param {string} protocol - Protocol to use (http or https)
 * @returns {Promise} - Promise with connection result
 */
export const createConnection = async (ipAddress, username, password, protocol = 'http') => {
  try {
    // Connect to the switch
    const connection = await connectToSwitch(ipAddress, username, password, protocol);
    
    // Get detailed info for the switch
    const switchInfo = await connection.getSwitchInfo();
    
    // Process the switch data into our standard format
    const processedData = processSwitchData(switchInfo);
    
    // Store the connection for reuse
    connections.set(processedData.id, {
      connection,
      switchData: processedData,
      credentials: { ipAddress, username, password, protocol }
    });
    
    return {
      success: true,
      switchData: processedData
    };
  } catch (error) {
    console.error('Failed to create connection:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to switch'
    };
  }
};

/**
 * Get a connection by switch ID
 * @param {string} switchId - ID of the switch
 * @returns {Object|null} - Connection object or null if not found
 */
export const getConnection = (switchId) => {
  return connections.get(switchId) || null;
};

/**
 * Get all stored switch data
 * @returns {Array} - Array of switch data objects
 */
export const getAllSwitchData = () => {
  return Array.from(connections.values()).map(conn => conn.switchData);
};

/**
 * Refresh switch data for a specific connection
 * @param {string} switchId - ID of the switch
 * @returns {Promise} - Promise with updated switch data
 */
export const refreshSwitchData = async (switchId) => {
  const conn = connections.get(switchId);
  
  if (!conn) {
    throw new Error(`No connection found for switch ID: ${switchId}`);
  }
  
  try {
    const switchInfo = await conn.connection.getSwitchInfo();
    const processedData = processSwitchData(switchInfo);
    
    // Update the stored data
    connections.set(switchId, {
      ...conn,
      switchData: processedData
    });
    
    return processedData;
  } catch (error) {
    console.error('Failed to refresh switch data:', error);
    throw error;
  }
};

/**
 * Remove a connection
 * @param {string} switchId - ID of the switch
 * @returns {boolean} - True if removed, false if not found
 */
export const removeConnection = (switchId) => {
  return connections.delete(switchId);
};

/**
 * Execute commands on a switch
 * @param {string} switchId - ID of the switch
 * @param {Array} commands - Array of commands to execute
 * @returns {Promise} - Promise with command results
 */
export const executeCommands = async (switchId, commands) => {
  const conn = connections.get(switchId);
  
  if (!conn) {
    throw new Error(`No connection found for switch ID: ${switchId}`);
  }
  
  try {
    return await conn.connection.runCommands(commands);
  } catch (error) {
    console.error('Failed to execute commands:', error);
    throw error;
  }
};

/**
 * Refresh all connections
 * @returns {Promise} - Promise with all updated switch data
 */
export const refreshAllConnections = async () => {
  const refreshPromises = Array.from(connections.keys()).map(id => refreshSwitchData(id));
  
  try {
    await Promise.all(refreshPromises);
    return getAllSwitchData();
  } catch (error) {
    console.error('Failed to refresh all connections:', error);
    throw error;
  }
};
