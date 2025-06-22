import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SwitchCard from '@/components/SwitchCard';
import ConfigurationPanel from '@/components/ConfigurationPanel';
import NetworkTopology from '@/components/NetworkTopology';
import AddSwitchModal from '@/components/AddSwitchModal';
import { 
  Router, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Network,
  Activity,
  Settings,
  Zap,
  Globe,
  Shield,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function App() {
  const { toast } = useToast();
  const [switches, setSwitches] = useState([]);
  const [selectedSwitch, setSelectedSwitch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const mockSwitches = [
      {
        id: 1,
        hostname: 'core-sw-01',
        model: 'Arista DCS-7280SR-48C6',
        ipAddress: '192.168.1.10',
        status: 'online',
        uptime: '45d 12h 30m',
        cpuUsage: 15,
        memoryUsage: 32,
        temperature: 42,
        activeInterfaces: 24,
        totalInterfaces: 48,
        version: '4.28.3M'
      },
      {
        id: 2,
        hostname: 'access-sw-01',
        model: 'Arista DCS-7050SX-64',
        ipAddress: '192.168.1.11',
        status: 'online',
        uptime: '23d 8h 15m',
        cpuUsage: 8,
        memoryUsage: 28,
        temperature: 38,
        activeInterfaces: 32,
        totalInterfaces: 64,
        version: '4.28.3M'
      },
      {
        id: 3,
        hostname: 'access-sw-02',
        model: 'Arista DCS-7050SX-64',
        ipAddress: '192.168.1.12',
        status: 'online',
        uptime: '67d 4h 22m',
        cpuUsage: 12,
        memoryUsage: 35,
        temperature: 41,
        activeInterfaces: 28,
        totalInterfaces: 64,
        version: '4.28.3M'
      },
      {
        id: 4,
        hostname: 'spine-sw-01',
        model: 'Arista DCS-7320X-32C',
        ipAddress: '192.168.1.13',
        status: 'warning',
        uptime: '12d 16h 45m',
        cpuUsage: 45,
        memoryUsage: 68,
        temperature: 55,
        activeInterfaces: 16,
        totalInterfaces: 32,
        version: '4.27.2F'
      }
    ];

    setTimeout(() => {
      setSwitches(mockSwitches);
      setIsLoading(false);
    }, 1500);
  }, []);

  const handleConfigureSwitch = (switchData) => {
    setSelectedSwitch(switchData);
  };

  const handleCloseConfig = () => {
    setSelectedSwitch(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    toast({
      title: "Refreshing Network Data",
      description: "Discovering and updating switch information...",
    });
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Network Refresh Complete! ✅",
        description: "All switch data has been updated successfully.",
      });
    }, 2000);
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  const handleAddSwitch = (newSwitchData) => {
    const newSwitch = {
      id: switches.length + 1,
      hostname: `new-switch-${switches.length + 1}`,
      model: 'Arista DCS-7050SX-64',
      ipAddress: newSwitchData.ipAddress,
      status: 'online',
      uptime: '1m',
      cpuUsage: Math.floor(Math.random() * 10) + 5,
      memoryUsage: Math.floor(Math.random() * 20) + 20,
      temperature: Math.floor(Math.random() * 10) + 35,
      activeInterfaces: Math.floor(Math.random() * 40) + 8,
      totalInterfaces: 48,
      version: '4.28.3M'
    };

    setSwitches(prevSwitches => [...prevSwitches, newSwitch]);
    toast({
      title: 'Switch Added Successfully! ✅',
      description: `${newSwitch.hostname} (${newSwitch.ipAddress}) is now being monitored.`,
    });
  };

  const filteredSwitches = switches.filter(sw => 
    sw.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sw.ipAddress.includes(searchTerm) ||
    sw.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalSwitches: switches.length,
    onlineSwitches: switches.filter(sw => sw.status === 'online').length,
    avgCpuUsage: switches.length > 0 ? Math.round(switches.reduce((acc, sw) => acc + sw.cpuUsage, 0) / switches.length) : 0,
    avgMemoryUsage: switches.length > 0 ? Math.round(switches.reduce((acc, sw) => acc + sw.memoryUsage, 0) / switches.length) : 0
  };

  return (
    <div className="min-h-screen gradient-bg network-pattern">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
                <Router className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Arista EOS Manager</h1>
                <p className="text-gray-400">Comprehensive switch configuration and management platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Switch
              </Button>
              <Button onClick={handleRefresh} variant="outline" className="border-blue-500/30 text-blue-400">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="switch-card border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Network className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalSwitches}</p>
                      <p className="text-sm text-gray-400">Total Switches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="switch-card border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.onlineSwitches}</p>
                      <p className="text-sm text-gray-400">Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="switch-card border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-8 w-8 text-yellow-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.avgCpuUsage}%</p>
                      <p className="text-sm text-gray-400">Avg CPU</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="switch-card border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.avgMemoryUsage}%</p>
                      <p className="text-sm text-gray-400">Avg Memory</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search switches by hostname, IP, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-gray-600 text-white"
              />
            </div>
            <Button onClick={() => handleFeatureClick('Filter Options')} variant="outline" className="border-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5 text-green-400" />
                <span>Switch Management</span>
              </h2>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="h-64 rounded-lg bg-slate-800/30 border border-gray-700 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {filteredSwitches.map((switchData, index) => (
                      <motion.div
                        key={switchData.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <SwitchCard
                          switchData={switchData}
                          onConfigure={handleConfigureSwitch}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <NetworkTopology />
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {selectedSwitch && (
            <ConfigurationPanel
              switchData={selectedSwitch}
              onClose={handleCloseConfig}
            />
          )}
        </AnimatePresence>
        
        <AddSwitchModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddSwitch={handleAddSwitch}
        />
      </div>

      <Toaster />
    </div>
  );
}

export default App;