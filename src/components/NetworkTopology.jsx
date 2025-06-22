import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { buildNetworkTopology } from '@/services/topologyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Router, 
  Monitor, 
  Smartphone, 
  Server, 
  Wifi,
  Network,
  Zap,
  Eye,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const NetworkTopology = () => {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'switch': return Router;
      case 'server': return Server;
      case 'wireless': return Wifi;
      case 'workstation': return Monitor;
      default: return Network;
    }
  };

  const getDeviceColor = (type, status) => {
    if (status === 'warning') return 'text-yellow-400';
    if (status === 'offline') return 'text-red-400';
    
    switch (type) {
      case 'switch': return 'text-green-400';
      case 'server': return 'text-blue-400';
      case 'wireless': return 'text-purple-400';
      case 'workstation': return 'text-cyan-400';
      default: return 'text-gray-400';
    }
  };

  // Fetch network topology data when switches change
  useEffect(() => {
    fetchTopology();
  }, []);

  // Fetch topology data
  const fetchTopology = useCallback(async (isAutoDiscover = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get all switches from localStorage
      const storedSwitches = localStorage.getItem('switches');
      let switches = [];
      
      if (storedSwitches) {
        switches = JSON.parse(storedSwitches);
      }
      
      // If we have switches, build the topology
      if (switches.length > 0) {
        const data = await buildNetworkTopology(switches);
        setTopology(data);
        
        if (isAutoDiscover) {
          toast({
            title: 'Auto-discovery Complete',
            description: `Found ${data.nodes.length} devices and ${data.links.length} connections`,
          });
        }
      } else {
        setTopology({ nodes: [], links: [] });
        setError('No switches configured. Add a switch connection to view topology.');
      }
    } catch (err) {
      console.error('Error fetching network topology:', err);
      setError(err.message || 'Failed to fetch network topology');
      toast({
        variant: 'destructive',
        title: 'Error Loading Topology',
        description: err.message || 'Failed to fetch network topology'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    toast({
      title: `${device.name} Selected`,
      description: `Device type: ${device.type} • Status: ${device.status}`,
    });
  };

  const handleFeatureClick = (feature) => {
    switch (feature) {
      case 'Auto-discover':
        fetchTopology(true); // Fetch with auto-discovery flag set to true
        break;
      default:
        toast({
          title: "🚧 Feature Coming Soon!",
          description: `${feature} isn't implemented yet, but it's in development!`,
        });
    }
  };

  return (
    <Card className="network-topology border-gray-700 bg-slate-800/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-400" />
            <span>Network Topology</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button onClick={() => handleFeatureClick('Auto-discover')} size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Auto-discover
            </Button>
            <Button onClick={() => handleFeatureClick('Topology Settings')} size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-slate-900/50 rounded-lg border border-gray-600 overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-400"></div>
                <p className="text-white">Loading network topology...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">Topology Unavailable</p>
                <p className="text-gray-400">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full">
                {topology.links.map(link => {
                  const sourceNode = topology.nodes.find(n => n.id === link.source);
                  const targetNode = topology.nodes.find(n => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  // Calculate line positions based on node positions
                  const x1 = `${sourceNode.x}%`;
                  const y1 = `${sourceNode.y}%`;
                  const x2 = `${targetNode.x}%`;
                  const y2 = `${targetNode.y}%`;
                  
                  // Determine line color based on link status
                  const lineColor = link.status === 'up' ? '#22c55e' : '#94a3b8';
                  
                  return (
                    <line 
                      key={link.id}
                      x1={x1} 
                      y1={y1} 
                      x2={x2} 
                      y2={y2} 
                      stroke={lineColor} 
                      strokeOpacity="0.6"
                      strokeWidth="2"
                      strokeDasharray={link.status !== 'up' ? '4 2' : ''}
                    />
                  );
                })}
              </svg>

              {/* Devices */}
              {topology.nodes.map(device => {
                const DeviceIcon = getDeviceIcon(device.type);
                const iconColor = getDeviceColor(device.type, device.status);
                const isSelected = selectedDevice && selectedDevice.id === device.id;
                
                return (
                  <motion.div
                    key={device.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ left: `${device.x}%`, top: `${device.y}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: device.id * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => handleDeviceClick(device)}
                  >
                    <div className={`p-3 rounded-full bg-slate-800 border-2 ${
                      isSelected 
                        ? 'border-green-400 shadow-lg shadow-green-400/20' 
                        : 'border-gray-600'
                    } hover:border-green-400/50 transition-all duration-200`}>
                      <DeviceIcon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2">
                      <div className="text-xs text-white font-medium text-center whitespace-nowrap">
                        {device.name}
                      </div>
                      <div className="flex justify-center mt-1">
                        <Badge 
                          variant={device.status === 'online' ? 'default' : device.status === 'warning' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>

        {selectedDevice && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-800 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-700 rounded-md">
                  {React.createElement(getDeviceIcon(selectedDevice.type), { 
                    className: `h-5 w-5 ${getDeviceColor(selectedDevice.type, selectedDevice.status)}` 
                  })}
                </div>
                <div>
                  <h4 className="text-white font-medium">{selectedDevice.name}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <p className="text-gray-400 text-sm">Type: {selectedDevice.type}</p>
                    {selectedDevice.ipAddress && (
                      <p className="text-gray-400 text-sm">IP: {selectedDevice.ipAddress}</p>
                    )}
                    {selectedDevice.model && (
                      <p className="text-gray-400 text-sm">Model: {selectedDevice.model}</p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Badge variant={selectedDevice.status === 'online' ? 'outline' : 'secondary'} className="capitalize">
                  <Zap className="h-3 w-3 mr-1" />
                  {selectedDevice.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkTopology;