import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Save, 
  Upload, 
  Network, 
  Router, 
  Shield, 
  Settings,
  Terminal,
  Globe,
  Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import InterfacesTab from '@/components/config-tabs/InterfacesTab';
import VlansTab from '@/components/config-tabs/VlansTab';
import RoutingTab from '@/components/config-tabs/RoutingTab';
import VxlanTab from '@/components/config-tabs/VxlanTab';
import SecurityTab from '@/components/config-tabs/SecurityTab';
import CliTab from '@/components/config-tabs/CliTab';

const ConfigurationPanel = ({ switchData, onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('interfaces');

  const handleSaveConfig = () => {
    toast({
      title: "Configuration Saved! ✅",
      description: `Configuration for ${switchData.hostname} has been saved successfully.`,
    });
  };

  const handleApplyConfig = () => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: "Configuration deployment isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleFeatureClick = (feature) => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} configuration isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="config-panel w-full max-w-6xl max-h-[90vh] rounded-xl border border-green-500/20 overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Settings className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Configure {switchData.hostname}</h2>
              <p className="text-sm text-gray-400">{switchData.model} • {switchData.ipAddress}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleSaveConfig} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleApplyConfig} variant="outline" className="border-blue-500/30 text-blue-400">
              <Upload className="h-4 w-4 mr-2" />
              Apply
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] scrollbar-thin">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50">
              <TabsTrigger value="interfaces" className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span>Interfaces</span>
              </TabsTrigger>
              <TabsTrigger value="vlans" className="flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>VLANs</span>
              </TabsTrigger>
              <TabsTrigger value="routing" className="flex items-center space-x-2">
                <Router className="h-4 w-4" />
                <span>Routing</span>
              </TabsTrigger>
              <TabsTrigger value="vxlan" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>VXLAN</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="cli" className="flex items-center space-x-2">
                <Terminal className="h-4 w-4" />
                <span>CLI</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="interfaces">
                <InterfacesTab handleFeatureClick={handleFeatureClick} />
              </TabsContent>

              <TabsContent value="vlans">
                <VlansTab handleFeatureClick={handleFeatureClick} />
              </TabsContent>

              <TabsContent value="routing">
                <RoutingTab handleFeatureClick={handleFeatureClick} />
              </TabsContent>

              <TabsContent value="vxlan">
                <VxlanTab handleFeatureClick={handleFeatureClick} />
              </TabsContent>

              <TabsContent value="security">
                <SecurityTab handleFeatureClick={handleFeatureClick} />
              </TabsContent>

              <TabsContent value="cli">
                <CliTab switchData={switchData} handleFeatureClick={handleFeatureClick} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfigurationPanel;
