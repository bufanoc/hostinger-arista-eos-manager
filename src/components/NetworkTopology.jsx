import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const devices = [
    { id: 1, name: 'Core-SW-01', type: 'switch', x: 50, y: 30, status: 'online', connections: [2, 3] },
    { id: 2, name: 'Access-SW-01', type: 'switch', x: 20, y: 60, status: 'online', connections: [4, 5] },
    { id: 3, name: 'Access-SW-02', type: 'switch', x: 80, y: 60, status: 'online', connections: [6, 7] },
    { id: 4, name: 'Server-01', type: 'server', x: 10, y: 85, status: 'online', connections: [] },
    { id: 5, name: 'AP-01', type: 'wireless', x: 30, y: 85, status: 'online', connections: [] },
    { id: 6, name: 'Workstation-01', type: 'workstation', x: 70, y: 85, status: 'online', connections: [] },
    { id: 7, name: 'Server-02', type: 'server', x: 90, y: 85, status: 'warning', connections: [] }
  ];

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

  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    toast({
      title: `${device.name} Selected`,
      description: `Device type: ${device.type} • Status: ${device.status}`,
    });
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
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
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full">
            {devices.map(device => 
              device.connections.map(connId => {
                const connectedDevice = devices.find(d => d.id === connId);
                if (!connectedDevice) return null;
                
                return (
                  <motion.line
                    key={`${device.id}-${connId}`}
                    x1={`${device.x}%`}
                    y1={`${device.y}%`}
                    x2={`${connectedDevice.x}%`}
                    y2={`${connectedDevice.y}%`}
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                );
              })
            )}
          </svg>

          {/* Devices */}
          {devices.map(device => {
            const Icon = getDeviceIcon(device.type);
            const colorClass = getDeviceColor(device.type, device.status);
            
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
                  selectedDevice?.id === device.id 
                    ? 'border-green-400 shadow-lg shadow-green-400/20' 
                    : 'border-gray-600'
                } hover:border-green-400/50 transition-all duration-200`}>
                  <Icon className={`h-6 w-6 ${colorClass}`} />
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

          {/* Traffic Animation */}
          {devices.slice(0, 3).map(device => 
            device.connections.map(connId => {
              const connectedDevice = devices.find(d => d.id === connId);
              if (!connectedDevice) return null;
              
              return (
                <motion.div
                  key={`traffic-${device.id}-${connId}`}
                  className="absolute w-2 h-2 bg-green-400 rounded-full"
                  initial={{ 
                    left: `${device.x}%`, 
                    top: `${device.y}%`,
                    opacity: 0
                  }}
                  animate={{ 
                    left: `${connectedDevice.x}%`, 
                    top: `${connectedDevice.y}%`,
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: Math.random() * 2,
                    ease: "linear"
                  }}
                />
              );
            })
          )}
        </div>

        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-lg bg-slate-700/50 border border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-semibold">{selectedDevice.name}</h4>
                <p className="text-sm text-gray-400 capitalize">{selectedDevice.type} • {selectedDevice.status}</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => handleFeatureClick('Monitor Device')} size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Monitor
                </Button>
                <Button onClick={() => handleFeatureClick('Configure Device')} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkTopology;