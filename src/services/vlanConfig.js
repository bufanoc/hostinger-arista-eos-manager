/**
 * VLAN Configuration Service
 * Handles retrieving and configuring Arista EOS VLANs
 */

import { executeCommands } from './connectionManager';

/**
 * Get all VLANs configured on a switch
 * @param {string} switchId - ID of the switch
 * @returns {Promise<Array>} - Promise resolving to an array of VLAN objects
 */
export const getVlans = async (switchId) => {
  try {
    const commands = ['show vlan'];
    const results = await executeCommands(switchId, commands);
    
    if (!results || !results[0] || !results[0].vlans) {
      throw new Error('Invalid VLAN data received');
    }
    
    return processVlanData(results[0].vlans);
  } catch (error) {
    console.error('Error getting VLANs:', error);
    throw error;
  }
};

/**
 * Process raw VLAN data into a standardized format
 * @param {Object} rawData - Raw VLAN data from the API
 * @returns {Array} - Array of formatted VLAN objects
 */
export const processVlanData = (rawData) => {
  if (!rawData) {
    return [];
  }
  
  return Object.entries(rawData).map(([vlanId, vlanInfo]) => {
    return {
      id: parseInt(vlanId),
      name: vlanInfo.name || '',
      status: vlanInfo.status || 'active',
      interfaces: vlanInfo.interfaces ? Object.keys(vlanInfo.interfaces) : [],
      dynamic: vlanInfo.dynamic || false
    };
  }).sort((a, b) => a.id - b.id); // Sort by VLAN ID
};

/**
 * Create a new VLAN
 * @param {string} switchId - ID of the switch
 * @param {number} vlanId - VLAN ID (1-4094)
 * @param {string} vlanName - VLAN name
 * @returns {Promise} - Promise with command result
 */
export const createVlan = async (switchId, vlanId, vlanName) => {
  // Validate inputs
  if (!vlanId || isNaN(parseInt(vlanId)) || parseInt(vlanId) < 1 || parseInt(vlanId) > 4094) {
    throw new Error('Invalid VLAN ID. Must be between 1-4094.');
  }
  
  try {
    // Sanitize inputs to prevent command injection
    const sanitizedVlanId = parseInt(vlanId);
    const sanitizedName = vlanName.replace(/['"]/g, '');
    
    const commands = [
      'configure',
      `vlan ${sanitizedVlanId}`,
      sanitizedName ? `name ${sanitizedName}` : '',
      'end'
    ].filter(Boolean); // Remove empty commands
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error creating VLAN ${vlanId}:`, error);
    throw error;
  }
};

/**
 * Delete a VLAN
 * @param {string} switchId - ID of the switch
 * @param {number} vlanId - VLAN ID to delete
 * @returns {Promise} - Promise with command result
 */
export const deleteVlan = async (switchId, vlanId) => {
  // Validate input
  if (!vlanId || isNaN(parseInt(vlanId))) {
    throw new Error('Invalid VLAN ID');
  }
  
  try {
    const sanitizedVlanId = parseInt(vlanId);
    const commands = [
      'configure',
      `no vlan ${sanitizedVlanId}`,
      'end'
    ];
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error deleting VLAN ${vlanId}:`, error);
    throw error;
  }
};

/**
 * Rename a VLAN
 * @param {string} switchId - ID of the switch
 * @param {number} vlanId - VLAN ID
 * @param {string} newName - New VLAN name
 * @returns {Promise} - Promise with command result
 */
export const renameVlan = async (switchId, vlanId, newName) => {
  try {
    const sanitizedVlanId = parseInt(vlanId);
    const sanitizedName = newName.replace(/['"]/g, '');
    
    const commands = [
      'configure',
      `vlan ${sanitizedVlanId}`,
      `name ${sanitizedName}`,
      'end'
    ];
    
    return await executeCommands(switchId, commands);
  } catch (error) {
    console.error(`Error renaming VLAN ${vlanId}:`, error);
    throw error;
  }
};
