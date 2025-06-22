/**
 * Arista EOS API Service
 * Handles communication with Arista switches via eAPI
 */

/**
 * Creates an authenticated API connection to an Arista switch
 * @param {string} ipAddress - IP address of the switch
 * @param {string} username - Username for authentication
 * @param {string} password - Password for authentication
 * @param {string} protocol - Protocol to use (http or https)
 * @returns {Object} - Connection object with auth headers and methods
 */
export const connectToSwitch = async (ipAddress, username, password, protocol = 'http') => {
  const baseUrl = `${protocol}://${ipAddress}/command-api`;
  
  // Create headers for authentication
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Test the connection with a simple command
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'runCmds',
        params: {
          version: 1,
          cmds: ['show version'],
          format: 'json',
        },
        id: 'EOS-API-1',
        auth: { username, password }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`API Error: ${data.error.message}`);
    }
    
    // Return the connection with useful methods
    return {
      baseUrl,
      headers,
      auth: { username, password },
      
      /**
       * Execute commands on the switch
       * @param {Array} commands - Array of EOS commands to execute
       * @returns {Promise} - Promise that resolves with command results
       */
      runCommands: async (commands) => {
        try {
          const cmdResponse = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'runCmds',
              params: {
                version: 1,
                cmds: commands,
                format: 'json',
              },
              id: 'EOS-API-CMD',
              auth: { username, password }
            })
          });
          
          if (!cmdResponse.ok) {
            throw new Error(`HTTP error! status: ${cmdResponse.status}`);
          }
          
          const cmdData = await cmdResponse.json();
          
          if (cmdData.error) {
            throw new Error(`API Error: ${cmdData.error.message}`);
          }
          
          return cmdData.result;
        } catch (error) {
          console.error("Error executing commands:", error);
          throw error;
        }
      },
      
      /**
       * Get detailed information about the switch
       * @returns {Promise} - Promise that resolves with switch information
       */
      getSwitchInfo: async () => {
        try {
          const info = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'runCmds',
              params: {
                version: 1,
                cmds: [
                  'show version',
                  'show hostname',
                  'show interfaces status',
                  'show ip interface brief',
                  'show system environment temperature',
                  'show system environment cooling',
                  'show processes top once',
                ],
                format: 'json',
              },
              id: 'EOS-API-INFO',
              auth: { username, password }
            })
          });
          
          if (!info.ok) {
            throw new Error(`HTTP error! status: ${info.status}`);
          }
          
          const infoData = await info.json();
          
          if (infoData.error) {
            throw new Error(`API Error: ${infoData.error.message}`);
          }
          
          return infoData.result;
        } catch (error) {
          console.error("Error getting switch information:", error);
          throw error;
        }
      }
    };
  } catch (error) {
    console.error("Connection error:", error);
    throw error;
  }
};

/**
 * Process raw switch data into a standardized format
 * @param {Object} rawData - Raw data from the switch API
 * @returns {Object} - Formatted switch data
 */
export const processSwitchData = (rawData) => {
  if (!rawData || rawData.length < 4) {
    throw new Error('Incomplete data received from switch');
  }
  
  // Extract data from version command (first command)
  const versionData = rawData[0];
  
  // Extract data from hostname command (second command)
  const hostnameData = rawData[1];
  
  // Extract data from interfaces status (third command)
  const interfacesData = rawData[2];
  
  // Extract data from ip interface (fourth command)
  const ipInterfaceData = rawData[3];
  
  // Extract temperature data (fifth command)
  const temperatureData = rawData[4];
  
  // Extract CPU usage from top processes (seventh command)
  const processesData = rawData[6];
  
  // Count active interfaces
  const activeInterfaces = Object.values(interfacesData.interfaceStatuses || {}).filter(
    intf => intf.linkStatus === 'connected'
  ).length;
  
  // Count total interfaces
  const totalInterfaces = Object.keys(interfacesData.interfaceStatuses || {}).length;
  
  // Calculate CPU usage from processes data
  const cpuUsage = processesData?.processes?.reduce((total, process) => {
    return total + (process.cpuPct || 0);
  }, 0) || 0;
  
  // Calculate memory usage
  const memoryTotal = processesData?.memTotal || 1;
  const memoryFree = processesData?.memFree || 0;
  const memoryUsage = Math.round(((memoryTotal - memoryFree) / memoryTotal) * 100);
  
  // Get average temperature
  let avgTemp = 0;
  let tempCount = 0;
  
  if (temperatureData.sensors) {
    Object.values(temperatureData.sensors).forEach(sensor => {
      if (sensor.temperature && !isNaN(sensor.temperature)) {
        avgTemp += sensor.temperature;
        tempCount++;
      }
    });
  }
  
  const temperature = tempCount > 0 ? Math.round(avgTemp / tempCount) : 0;
  
  // Find management IP
  const managementIp = ipInterfaceData.interfaces.Management1?.interfaceAddress?.ipAddr?.address || '';
  
  // Format uptime
  const uptime = formatUptime(versionData.uptime);
  
  return {
    id: versionData.serialNumber || Math.random().toString(36).substring(7),
    hostname: hostnameData.hostname || 'Unknown',
    model: versionData.modelName || 'Unknown',
    ipAddress: managementIp,
    status: 'online', // We assume online since we got data
    uptime,
    cpuUsage: Math.min(Math.round(cpuUsage), 100), // Cap at 100%
    memoryUsage,
    temperature,
    activeInterfaces,
    totalInterfaces,
    version: versionData.version || 'Unknown',
    serialNumber: versionData.serialNumber || 'Unknown',
    systemMacAddress: versionData.systemMacAddress || 'Unknown',
    interfaces: interfacesData.interfaceStatuses || {}
  };
};

/**
 * Format uptime in seconds to a human-readable string
 * @param {number} uptimeSeconds - Uptime in seconds
 * @returns {string} - Formatted uptime string
 */
export const formatUptime = (uptimeSeconds) => {
  if (!uptimeSeconds && uptimeSeconds !== 0) return 'Unknown';
  
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
};
