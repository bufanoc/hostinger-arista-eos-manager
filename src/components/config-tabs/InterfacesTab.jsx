import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Plus, Save, RefreshCw, Power, PowerOff, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getInterfaceDetails, setInterfaceDescription, setInterfaceEnabled, setInterfaceMode } from '@/services/interfaceConfig';
import { getConnection } from '@/services/connectionManager';

const InterfacesTab = ({ switchData }) => {
  const { toast } = useToast();
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editableInterfaces, setEditableInterfaces] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load interface details when the component mounts or switch changes
  useEffect(() => {
    loadInterfaceData();
  }, [switchData?.id]);

  // Load interface data from the switch
  const loadInterfaceData = async () => {
    if (!switchData?.id) {
      setError('No switch selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const interfaceDetails = await getInterfaceDetails(switchData.id);
      setInterfaces(interfaceDetails);

      // Initialize editable state for all interfaces
      const editableState = {};
      interfaceDetails.forEach(iface => {
        editableState[iface.name] = {
          description: iface.description,
          mode: iface.mode,
          enabled: iface.enabled,
          vlan: iface.vlan || '',
          isChanged: false
        };
      });

      setEditableInterfaces(editableState);
    } catch (err) {
      console.error('Failed to load interface details:', err);
      setError('Failed to load interface details. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh interface data
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await loadInterfaceData();
      toast({
        title: 'Interfaces Refreshed! ✅',
        description: `Interface data for ${switchData.hostname} has been updated.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: err.message || 'Failed to refresh interface data.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle description change
  const handleDescriptionChange = (interfaceName, value) => {
    setEditableInterfaces(prev => ({
      ...prev,
      [interfaceName]: {
        ...prev[interfaceName],
        description: value,
        isChanged: value !== interfaces.find(i => i.name === interfaceName)?.description
      }
    }));
  };

  // Handle mode change
  const handleModeChange = (interfaceName, value) => {
    setEditableInterfaces(prev => ({
      ...prev,
      [interfaceName]: {
        ...prev[interfaceName],
        mode: value,
        isChanged: true
      }
    }));
  };

  // Handle VLAN change
  const handleVlanChange = (interfaceName, value) => {
    const vlanValue = value.replace(/\D/g, ''); // Only allow numbers
    setEditableInterfaces(prev => ({
      ...prev,
      [interfaceName]: {
        ...prev[interfaceName],
        vlan: vlanValue,
        isChanged: true
      }
    }));
  };

  // Handle enable/disable toggle
  const handleEnableToggle = (interfaceName, currentState) => {
    setEditableInterfaces(prev => ({
      ...prev,
      [interfaceName]: {
        ...prev[interfaceName],
        enabled: !currentState,
        isChanged: true
      }
    }));
  };

  // Save changes to an interface
  const handleSaveInterface = async (interfaceName) => {
    if (!switchData?.id) return;

    const interfaceChanges = editableInterfaces[interfaceName];
    if (!interfaceChanges.isChanged) return;

    try {
      // Save description if changed
      const originalInterface = interfaces.find(i => i.name === interfaceName);
      if (interfaceChanges.description !== originalInterface.description) {
        await setInterfaceDescription(switchData.id, interfaceName, interfaceChanges.description);
      }

      // Save mode if changed
      if (interfaceChanges.mode !== originalInterface.mode) {
        await setInterfaceMode(switchData.id, interfaceName, interfaceChanges.mode, interfaceChanges.vlan || null);
      }

      // Save enabled state if changed
      if (interfaceChanges.enabled !== originalInterface.enabled) {
        await setInterfaceEnabled(switchData.id, interfaceName, interfaceChanges.enabled);
      }

      // Mark as no longer changed
      setEditableInterfaces(prev => ({
        ...prev,
        [interfaceName]: {
          ...prev[interfaceName],
          isChanged: false
        }
      }));

      toast({
        title: 'Interface Updated! ✅',
        description: `Configuration for ${interfaceName} has been saved.`
      });

      // Refresh to get the latest data
      await loadInterfaceData();
    } catch (err) {
      console.error(`Error saving ${interfaceName}:`, err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || `Failed to update ${interfaceName}.`
      });
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    if (status === 'up') return 'bg-green-500/20 text-green-400 border-green-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-400" />
            <span>Interface Configuration</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="border-blue-500/30 text-blue-400"
              disabled={isRefreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-36 rounded-lg bg-slate-700/30 animate-pulse border border-gray-700"></div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-8 text-center rounded-lg border border-red-500/20 bg-red-500/10">
            <HelpCircle className="mx-auto h-10 w-10 text-red-400 mb-3" />
            <p className="text-red-200">{error}</p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          // Interface list
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interfaces
              // Only show Ethernet interfaces
              .filter(iface => iface.type === 'ethernet')
              .map(iface => {
                const editable = editableInterfaces[iface.name] || {
                  description: iface.description,
                  mode: iface.mode,
                  enabled: iface.enabled,
                  vlan: iface.vlan || '',
                  isChanged: false
                };

                return (
                  <div 
                    key={iface.name} 
                    className={`p-4 rounded-lg bg-slate-700/50 border ${editable.isChanged ? 'border-yellow-500/50' : 'border-gray-600'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{iface.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(iface.status)}>
                          {iface.status === 'up' ? 'Up' : 'Down'}
                        </Badge>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className={editable.enabled ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}
                          title={editable.enabled ? 'Disable Interface' : 'Enable Interface'}
                          onClick={() => handleEnableToggle(iface.name, editable.enabled)}
                        >
                          {editable.enabled ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Description</label>
                        <Input 
                          placeholder="Interface description" 
                          className="mt-1 bg-slate-800 border-gray-600 text-white"
                          value={editable.description}
                          onChange={(e) => handleDescriptionChange(iface.name, e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">Mode</label>
                          <Select 
                            value={editable.mode || 'access'} 
                            onValueChange={(value) => handleModeChange(iface.name, value)}
                          >
                            <SelectTrigger className="mt-1 bg-slate-800 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="access">Access</SelectItem>
                              <SelectItem value="trunk">Trunk</SelectItem>
                              <SelectItem value="routed">Routed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {editable.mode === 'access' && (
                          <div>
                            <label className="text-xs text-gray-400">VLAN</label>
                            <Input
                              type="text"
                              placeholder="VLAN ID"
                              className="mt-1 bg-slate-800 border-gray-600 text-white"
                              value={editable.vlan}
                              onChange={(e) => handleVlanChange(iface.name, e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      {editable.isChanged && (
                        <div className="flex justify-end mt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveInterface(iface.name)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterfacesTab;
