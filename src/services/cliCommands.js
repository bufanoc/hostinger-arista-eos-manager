/**
 * CLI Command Service
 * Handles executing CLI commands on Arista EOS switches
 */

import { executeCommands } from './connectionManager';

/**
 * Execute CLI command(s) on a switch
 * @param {string} switchId - ID of the switch
 * @param {string|Array} commands - Command(s) to execute (string or array of strings)
 * @returns {Promise<Object>} - Promise with command result
 */
export const executeCli = async (switchId, commands) => {
  try {
    if (!switchId) {
      throw new Error('No switch ID provided');
    }
    
    if (!commands || (Array.isArray(commands) && commands.length === 0)) {
      throw new Error('No commands provided');
    }
    
    // If a single command is provided as string, convert to array
    const cmdArray = Array.isArray(commands) ? commands : [commands];
    
    // Execute the commands and return results
    return await executeCommands(switchId, cmdArray);
  } catch (error) {
    console.error('Error executing CLI commands:', error);
    throw error;
  }
};

/**
 * Execute a show command and format the output
 * @param {string} switchId - ID of the switch
 * @param {string} command - Show command to execute
 * @returns {Promise<Object>} - Promise with formatted command result
 */
export const executeShowCommand = async (switchId, command) => {
  try {
    if (!command.trim().toLowerCase().startsWith('show')) {
      throw new Error('Only show commands are allowed through this method.');
    }
    
    const result = await executeCommands(switchId, [command]);
    return result[0]; // Return just the command output object
  } catch (error) {
    console.error('Error executing show command:', error);
    throw error;
  }
};

/**
 * Execute a configuration command sequence
 * @param {string} switchId - ID of the switch
 * @param {Array} configCommands - Configuration commands to execute
 * @returns {Promise<Object>} - Promise with command result
 */
export const executeConfigCommands = async (switchId, configCommands) => {
  try {
    if (!Array.isArray(configCommands) || configCommands.length === 0) {
      throw new Error('Configuration commands must be provided as a non-empty array');
    }
    
    // Wrap commands in configure/end
    const cmdArray = [
      'configure',
      ...configCommands,
      'end'
    ];
    
    return await executeCommands(switchId, cmdArray);
  } catch (error) {
    console.error('Error executing configuration commands:', error);
    throw error;
  }
};
