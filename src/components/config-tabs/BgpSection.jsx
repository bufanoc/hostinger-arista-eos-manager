import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, RefreshCw, Trash2, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const BgpSection = ({ switchData, bgpConfig, isLoading, onRefresh, onConfigureBgp, onAddNeighbor, onRemoveNeighbor }) => {
  const { toast } = useToast();
  const [showConfigureDialog, setShowConfigureDialog] = useState(false);
  const [showNeighborDialog, setShowNeighborDialog] = useState(false);
  const [bgpSettings, setBgpSettings] = useState({
    asn: bgpConfig?.asn || '',
    routerId: bgpConfig?.routerId || ''
  });
  const [neighborSettings, setNeighborSettings] = useState({
    ip: '',
    remoteAsn: ''
  });
  const [deleteConfirmNeighbor, setDeleteConfirmNeighbor] = useState(null);
  
  // Update local state when bgpConfig changes
  React.useEffect(() => {
    if (bgpConfig) {
      setBgpSettings({
        asn: bgpConfig.asn || '',
        routerId: bgpConfig.routerId || ''
      });
    }
  }, [bgpConfig]);
  
  // Handle input changes for BGP settings
  const handleBgpInputChange = (e) => {
    const { name, value } = e.target;
    setBgpSettings(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle input changes for neighbor settings
  const handleNeighborInputChange = (e) => {
    const { name, value } = e.target;
    setNeighborSettings(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle BGP configuration submission
  const handleConfigureBgp = async (e) => {
    e.preventDefault();
    
    try {
      await onConfigureBgp(
        parseInt(bgpSettings.asn), 
        bgpSettings.routerId || null
      );
      
      setShowConfigureDialog(false);
      
      toast({
        title: 'BGP Configured',
        description: `BGP AS ${bgpSettings.asn} has been configured.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'BGP Configuration Failed',
        description: error.message || 'An error occurred while configuring BGP',
      });
    }
  };
  
  // Handle adding a BGP neighbor
  const handleAddNeighbor = async (e) => {
    e.preventDefault();
    
    if (!bgpConfig?.asn) {
      toast({
        variant: 'destructive',
        title: 'BGP Not Configured',
        description: 'Configure BGP with an AS number first before adding neighbors',
      });
      return;
    }
    
    try {
      await onAddNeighbor(
        parseInt(neighborSettings.ip), 
        parseInt(neighborSettings.remoteAsn)
      );
      
      // Reset form and close dialog
      setNeighborSettings({ ip: '', remoteAsn: '' });
      setShowNeighborDialog(false);
      
      toast({
        title: 'BGP Neighbor Added',
        description: `Added neighbor ${neighborSettings.ip} with AS ${neighborSettings.remoteAsn}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add BGP Neighbor',
        description: error.message || 'An error occurred while adding the BGP neighbor',
      });
    }
  };
  
  // Handle neighbor deletion
  const handleRemoveNeighbor = async () => {
    if (!deleteConfirmNeighbor || !bgpConfig?.asn) return;
    
    try {
      await onRemoveNeighbor(deleteConfirmNeighbor.ip);
      
      setDeleteConfirmNeighbor(null);
      
      toast({
        title: 'BGP Neighbor Removed',
        description: `Removed BGP neighbor ${deleteConfirmNeighbor.ip}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Remove BGP Neighbor',
        description: error.message || 'An error occurred while removing the BGP neighbor',
      });
    }
  };
  
  // Helper to get neighbor state styling
  const getNeighborStateStyle = (state) => {
    switch (state?.toLowerCase()) {
      case 'established':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'active':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h4 className="text-lg font-semibold text-white">BGP Configuration</h4>
          {bgpConfig?.enabled && (
            <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
              AS {bgpConfig.asn}
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Dialog open={showConfigureDialog} onOpenChange={setShowConfigureDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-blue-400 border-blue-500/30">
                {bgpConfig?.enabled ? 'Update BGP' : 'Configure BGP'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{bgpConfig?.enabled ? 'Update BGP Configuration' : 'Configure BGP'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleConfigureBgp} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asn">Autonomous System Number (ASN)</Label>
                    <Input
                      id="asn"
                      name="asn"
                      type="number"
                      min="1"
                      max="4294967295"
                      placeholder="e.g. 65000"
                      value={bgpSettings.asn}
                      onChange={handleBgpInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routerId">Router ID (optional)</Label>
                    <Input
                      id="routerId"
                      name="routerId"
                      placeholder="e.g. 192.168.1.1"
                      value={bgpSettings.routerId}
                      onChange={handleBgpInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowConfigureDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{bgpConfig?.enabled ? 'Update' : 'Configure'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Show loading state */}
      {isLoading && (
        <div className="flex justify-center p-4 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading BGP configuration...</span>
        </div>
      )}
      
      {/* BGP not configured notice */}
      {!isLoading && !bgpConfig?.enabled && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-gray-700 flex flex-col items-center justify-center text-center text-gray-400">
          <Info className="h-8 w-8 mb-2" />
          <p>BGP is not configured on this device</p>
          <p className="text-sm">Click 'Configure BGP' to set up BGP routing</p>
        </div>
      )}
      
      {/* BGP Configuration Summary */}
      {!isLoading && bgpConfig?.enabled && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-700/50 border border-gray-600">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">AS Number</p>
                <p className="text-white font-mono">{bgpConfig.asn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Router ID</p>
                <p className="text-white font-mono">{bgpConfig.routerId || 'Auto-assigned'}</p>
              </div>
            </div>
          </div>
          
          {/* BGP Neighbors Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="text-md font-semibold text-white">BGP Neighbors</h5>
              <Dialog open={showNeighborDialog} onOpenChange={setShowNeighborDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-400 border-green-500/30"
                    disabled={!bgpConfig?.enabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Neighbor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add BGP Neighbor</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddNeighbor} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborIp">Neighbor IP Address</Label>
                        <Input
                          id="neighborIp"
                          name="ip"
                          placeholder="e.g. 192.168.1.2"
                          value={neighborSettings.ip}
                          onChange={handleNeighborInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="remoteAsn">Remote AS Number</Label>
                        <Input
                          id="remoteAsn"
                          name="remoteAsn"
                          type="number"
                          min="1"
                          max="4294967295"
                          placeholder="e.g. 65001"
                          value={neighborSettings.remoteAsn}
                          onChange={handleNeighborInputChange}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowNeighborDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Neighbor</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* No neighbors message */}
            {bgpConfig?.neighbors?.length === 0 && (
              <div className="p-4 rounded-lg bg-slate-800/50 border border-gray-700 flex flex-col items-center justify-center text-center text-gray-400">
                <AlertCircle className="h-6 w-6 mb-2" />
                <p>No BGP neighbors configured</p>
                <p className="text-xs">Click 'Add Neighbor' to establish BGP peering</p>
              </div>
            )}

            {/* Neighbors list */}
            {bgpConfig?.neighbors?.length > 0 && bgpConfig.neighbors.map(neighbor => (
              <div 
                key={neighbor.ip}
                className="p-3 rounded-lg bg-slate-700/50 border border-gray-600 flex justify-between items-center"
              >
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="text-white font-mono mr-2">
                      {neighbor.ip}
                    </span>
                    <Badge className={getNeighborStateStyle(neighbor.state)}>
                      {neighbor.state || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">
                    <span>AS: {neighbor.remoteAsn}</span>
                    {neighbor.uptime && neighbor.uptime !== 'never' && (
                      <span className="ml-3">Uptime: {neighbor.uptime}</span>
                    )}
                    {neighbor.prefixesReceived > 0 && (
                      <span className="ml-3">Prefixes: {neighbor.prefixesReceived}</span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => setDeleteConfirmNeighbor(neighbor)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {deleteConfirmNeighbor && (
        <Dialog open={!!deleteConfirmNeighbor} onOpenChange={() => setDeleteConfirmNeighbor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to remove this BGP neighbor?</p>
              <p className="font-mono mt-2 p-2 bg-slate-800 rounded-md">
                {deleteConfirmNeighbor.ip} (AS {deleteConfirmNeighbor.remoteAsn})
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmNeighbor(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveNeighbor}>
                Remove Neighbor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BgpSection;
