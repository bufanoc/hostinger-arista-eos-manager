import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Router, 
  Wifi, 
  Activity, 
  Settings, 
  Network,
  Zap,
  HardDrive,
  Thermometer
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const SwitchCard = ({ switchData, onConfigure }) => {
  const { toast } = useToast();

  const handleQuickAction = (action) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="switch-card h-full border-green-500/20 hover:border-green-500/40 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Router className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">{switchData.hostname}</CardTitle>
                <p className="text-sm text-gray-400">{switchData.model}</p>
              </div>
            </div>
            <Badge 
              variant={switchData.status === 'online' ? 'default' : 'destructive'}
              className={`${switchData.status === 'online' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''} status-indicator`}
            >
              {switchData.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Network className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">IP Address</span>
              </div>
              <p className="text-white font-mono text-sm">{switchData.ipAddress}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-purple-400" />
                <span className="text-gray-300">Uptime</span>
              </div>
              <p className="text-white text-sm">{switchData.uptime}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">CPU</p>
              <p className="text-sm font-semibold text-white">{switchData.cpuUsage}%</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <HardDrive className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Memory</p>
              <p className="text-sm font-semibold text-white">{switchData.memoryUsage}%</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-slate-800/50">
              <Thermometer className="h-5 w-5 text-red-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400">Temp</p>
              <p className="text-sm font-semibold text-white">{switchData.temperature}°C</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-400">Active Interfaces: {switchData.activeInterfaces}/{switchData.totalInterfaces}</p>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(switchData.activeInterfaces / switchData.totalInterfaces) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={() => onConfigure(switchData)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            <Button 
              onClick={() => handleQuickAction('monitor')}
              variant="outline" 
              size="sm"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <Activity className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => handleQuickAction('wireless')}
              variant="outline" 
              size="sm"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <Wifi className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SwitchCard;