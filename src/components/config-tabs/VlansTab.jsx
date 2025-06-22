import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2, RefreshCw, Save, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getVlans, createVlan, deleteVlan, renameVlan } from '@/services/vlanConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

const VlansTab = ({ switchData }) => {
  const { toast } = useToast();
  const [vlans, setVlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [editableVlans, setEditableVlans] = useState({});
  const [newVlan, setNewVlan] = useState({ id: '', name: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // Load VLAN details when the component mounts or switch changes
  useEffect(() => {
    loadVlanData();
  }, [switchData?.id]);

  // Load VLAN data from the switch
  const loadVlanData = async () => {
    if (!switchData?.id) {
      setError('No switch selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const vlanList = await getVlans(switchData.id);
      setVlans(vlanList);

      // Initialize editable state for all vlans
      const editableState = {};
      vlanList.forEach(vlan => {
        editableState[vlan.id] = {
          name: vlan.name,
          isChanged: false
        };
      });

      setEditableVlans(editableState);
    } catch (err) {
      console.error('Failed to load VLAN details:', err);
      setError('Failed to load VLAN details. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh VLAN data
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await loadVlanData();
      toast({
        title: 'VLANs Refreshed! ✅',
        description: `VLAN data for ${switchData.hostname} has been updated.`
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: err.message || 'Failed to refresh VLAN data.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle VLAN name change
  const handleNameChange = (vlanId, value) => {
    setEditableVlans(prev => ({
      ...prev,
      [vlanId]: {
        ...prev[vlanId],
        name: value,
        isChanged: value !== vlans.find(v => v.id === vlanId)?.name
      }
    }));
  };

  // Save changes to a VLAN
  const handleSaveVlan = async (vlanId) => {
    if (!switchData?.id) return;

    const vlanChanges = editableVlans[vlanId];
    if (!vlanChanges.isChanged) return;

    try {
      await renameVlan(switchData.id, vlanId, vlanChanges.name);

      // Mark as no longer changed
      setEditableVlans(prev => ({
        ...prev,
        [vlanId]: {
          ...prev[vlanId],
          isChanged: false
        }
      }));

      toast({
        title: 'VLAN Updated! ✅',
        description: `VLAN ${vlanId} has been renamed to ${vlanChanges.name}.`
      });

      // Refresh to get the latest data
      await loadVlanData();
    } catch (err) {
      console.error(`Error saving VLAN ${vlanId}:`, err);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: err.message || `Failed to update VLAN ${vlanId}.`
      });
    }
  };

  // Delete a VLAN
  const handleDeleteVlan = async (vlanId) => {
    if (!switchData?.id) return;

    try {
      await deleteVlan(switchData.id, vlanId);

      toast({
        title: 'VLAN Deleted! ✅',
        description: `VLAN ${vlanId} has been removed.`
      });

      // Refresh to get the latest data
      await loadVlanData();
    } catch (err) {
      console.error(`Error deleting VLAN ${vlanId}:`, err);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: err.message || `Failed to delete VLAN ${vlanId}.`
      });
    }
  };

  // Create a new VLAN
  const handleCreateVlan = async () => {
    if (!switchData?.id) return;

    // Validate input
    if (!newVlan.id || isNaN(parseInt(newVlan.id)) || parseInt(newVlan.id) < 1 || parseInt(newVlan.id) > 4094) {
      toast({
        variant: 'destructive',
        title: 'Invalid VLAN ID',
        description: 'VLAN ID must be a number between 1 and 4094.'
      });
      return;
    }

    try {
      await createVlan(switchData.id, parseInt(newVlan.id), newVlan.name);

      toast({
        title: 'VLAN Created! ✅',
        description: `VLAN ${newVlan.id}${newVlan.name ? ` (${newVlan.name})` : ''} has been created.`
      });

      // Reset the form
      setNewVlan({ id: '', name: '' });
      setIsAddDialogOpen(false);

      // Refresh to get the latest data
      await loadVlanData();
    } catch (err) {
      console.error('Error creating VLAN:', err);
      toast({
        variant: 'destructive',
        title: 'Create Failed',
        description: err.message || 'Failed to create new VLAN.'
      });
    }
  };

  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <span>VLAN Configuration</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="border-purple-500/30 text-purple-400"
              disabled={isRefreshing || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add VLAN
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create New VLAN</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">VLAN ID (1-4094)</label>
                    <Input 
                      type="number"
                      min="1"
                      max="4094"
                      placeholder="Enter VLAN ID"
                      className="bg-slate-700 border-gray-600 text-white"
                      value={newVlan.id}
                      onChange={(e) => setNewVlan({ ...newVlan, id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-2">VLAN Name (Optional)</label>
                    <Input 
                      placeholder="Enter VLAN name"
                      className="bg-slate-700 border-gray-600 text-white"
                      value={newVlan.name}
                      onChange={(e) => setNewVlan({ ...newVlan, name: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleCreateVlan}
                    disabled={!newVlan.id}
                  >
                    Create VLAN
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-lg bg-slate-700/30 animate-pulse border border-gray-700"></div>
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
        ) : vlans.length === 0 ? (
          // No VLANs state
          <div className="p-8 text-center rounded-lg border border-gray-700/30 bg-gray-800/20">
            <p className="text-gray-400 mb-4">No VLANs configured on this switch.</p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add VLAN
            </Button>
          </div>
        ) : (
          // VLAN list
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vlans.map((vlan) => {
              const editable = editableVlans[vlan.id] || {
                name: vlan.name,
                isChanged: false
              };

              return (
                <div 
                  key={vlan.id} 
                  className={`p-4 rounded-lg bg-slate-700/50 border ${editable.isChanged ? 'border-yellow-500/50' : 'border-gray-600'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">VLAN {vlan.id}</h4>
                    <Button 
                      onClick={() => handleDeleteVlan(vlan.id)}
                      variant="ghost" 
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <label className="text-xs text-gray-400">Name</label>
                        <Input 
                          value={editable.name}
                          onChange={(e) => handleNameChange(vlan.id, e.target.value)}
                          className="mt-1 bg-slate-800 border-gray-600 text-white"
                          placeholder="VLAN name"
                        />
                      </div>
                      
                      {editable.isChanged && (
                        <div className="flex items-end">
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveVlan(vlan.id)}
                            className="bg-green-600 hover:bg-green-700 text-white h-10"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {vlan.interfaces?.length || 0} interface{vlan.interfaces?.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-400">
                        Status: <span className="text-green-400">Active</span>
                      </span>
                    </div>
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

export default VlansTab;
