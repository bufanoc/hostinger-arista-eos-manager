import React, { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAllSwitchData, refreshAllConnections, createConnection } from '@/services/connectionManager';

function App() {
  const { toast } = useToast();
  const [switches, setSwitches] = useState([]);
  const [selectedSwitch, setSelectedSwitch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Function to load switch data from the API
  const loadSwitchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Try to load any existing switch connections
      const existingSwitches = getAllSwitchData();
      
      if (existingSwitches.length > 0) {
        setSwitches(existingSwitches);
        setIsLoading(false);
      } else {
        // If there are no existing connections, automatically connect to the test switch
        toast({
          title: 'Connecting to Test Switch...',
          description: 'Attempting to connect to 192.168.88.153...',
        });
        
        try {
          const result = await createConnection('192.168.88.153', 'admin', 'Xm101ona', 'http');
          
          if (result.success) {
            setSwitches([result.switchData]);
            toast({
              title: 'Connection Successful! ✅',
              description: `Connected to ${result.switchData.hostname} (192.168.88.153)`,
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Connection Failed',
              description: result.error || 'Could not connect to test switch. Please add a switch manually.',
            });
            setSwitches([]);
          }
        } catch (error) {
          console.error('Error connecting to test switch:', error);
          toast({
            variant: 'destructive',
            title: 'Connection Error',
            description: error.message || 'An unexpected error occurred while connecting to the test switch.',
          });
          setSwitches([]);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading switch data:', error);
      setIsLoading(false);
      setSwitches([]);
      
      toast({
        variant: 'destructive',
        title: 'Data Loading Error',
        description: 'Failed to load switch data. Please try refreshing.',
      });
    }
  }, [toast]);

  // Load switch data when the component mounts
  useEffect(() => {
    loadSwitchData();
  }, [loadSwitchData]);
  

  const handleConfigureSwitch = (switchData) => {
    setSelectedSwitch(switchData);
  };

  const handleCloseConfig = () => {
    setSelectedSwitch(null);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    toast({
      title: "Refreshing Network Data",
      description: "Discovering and updating switch information...",
    });
    
    try {
      // Refresh all connections to get updated data
      const updatedSwitches = await refreshAllConnections();
      setSwitches(updatedSwitches);
      
      toast({
        title: "Network Refresh Complete! ✅",
        description: `Updated data for ${updatedSwitches.length} ${updatedSwitches.length === 1 ? 'switch' : 'switches'}.`,
      });
    } catch (error) {
      console.error('Error refreshing switch data:', error);
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh network data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  const handleAddSwitch = (newSwitchData) => {
    // The new switch data comes directly from the API now
    setSwitches(prevSwitches => [...prevSwitches, newSwitchData]);
    toast({
      title: 'Switch Added Successfully! ✅',
      description: `${newSwitchData.hostname} (${newSwitchData.ipAddress}) is now being monitored.`,
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
              ) : switches.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Switches Found</h3>
                  <p className="text-gray-400 text-center mb-4">No switches are currently connected. Click the "Add Switch" button to connect to an Arista switch.</p>
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Switch
                  </Button>
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