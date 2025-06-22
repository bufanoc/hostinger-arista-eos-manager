import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';

const StaticRoutesSection = ({ switchData, staticRoutes, isLoading, onRefresh, onAddRoute, onDeleteRoute }) => {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoute, setNewRoute] = useState({ prefix: '', nextHop: '', adminDistance: '1' });
  const [deleteConfirmRoute, setDeleteConfirmRoute] = useState(null);
  
  // Handle input changes for new route
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoute(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission to add a new route
  const handleAddRoute = async (e) => {
    e.preventDefault();
    
    try {
      await onAddRoute(newRoute.prefix, newRoute.nextHop, parseInt(newRoute.adminDistance));
      
      // Reset form and close dialog
      setNewRoute({ prefix: '', nextHop: '', adminDistance: '1' });
      setShowAddDialog(false);
      
      toast({
        title: 'Static Route Added',
        description: `Added route to ${newRoute.prefix} via ${newRoute.nextHop}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Route',
        description: error.message || 'An error occurred while adding the route',
      });
    }
  };
  
  // Handle route deletion
  const handleDeleteRoute = async () => {
    if (!deleteConfirmRoute) return;
    
    try {
      await onDeleteRoute(deleteConfirmRoute.prefix, deleteConfirmRoute.nextHop);
      setDeleteConfirmRoute(null);
      
      toast({
        title: 'Static Route Deleted',
        description: `Removed route to ${deleteConfirmRoute.prefix}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Delete Route',
        description: error.message || 'An error occurred while deleting the route',
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-white">Static Routes</h4>
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
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-green-400 border-green-500/30">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Static Route</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddRoute} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Network Prefix</Label>
                    <Input
                      id="prefix"
                      name="prefix"
                      placeholder="e.g. 192.168.10.0/24"
                      value={newRoute.prefix}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextHop">Next Hop</Label>
                    <Input
                      id="nextHop"
                      name="nextHop"
                      placeholder="e.g. 192.168.1.1"
                      value={newRoute.nextHop}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminDistance">Admin Distance</Label>
                    <Input
                      id="adminDistance"
                      name="adminDistance"
                      type="number"
                      min="1"
                      max="255"
                      placeholder="1"
                      value={newRoute.adminDistance}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Static Route</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Show loading or error states */}
      {isLoading && (
        <div className="flex justify-center p-4 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading routes...</span>
        </div>
      )}
      
      {!isLoading && staticRoutes?.length === 0 && (
        <div className="p-4 rounded-lg bg-slate-800/50 border border-gray-700 flex flex-col items-center justify-center text-center text-gray-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>No static routes configured</p>
          <p className="text-sm">Click 'Add Route' to create your first static route</p>
        </div>
      )}
      
      {/* Static routes list */}
      {!isLoading && staticRoutes?.length > 0 && (
        <div className="space-y-2">
          {staticRoutes.map(route => (
            <div 
              key={`${route.prefix}-${route.nextHop}`}
              className="p-3 rounded-lg bg-slate-700/50 border border-gray-600 flex justify-between items-center"
            >
              <div className="space-y-1">
                <span className="text-white font-mono">
                  {route.prefix} <span className="text-gray-400">via</span> {route.nextHop}
                </span>
                {route.adminDistance !== 1 && (
                  <p className="text-xs text-gray-400">
                    Administrative distance: {route.adminDistance}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={() => setDeleteConfirmRoute(route)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      {deleteConfirmRoute && (
        <Dialog open={!!deleteConfirmRoute} onOpenChange={() => setDeleteConfirmRoute(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p>Are you sure you want to delete this static route?</p>
              <p className="font-mono mt-2 p-2 bg-slate-800 rounded-md">
                {deleteConfirmRoute.prefix} via {deleteConfirmRoute.nextHop}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmRoute(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteRoute}>
                Delete Route
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StaticRoutesSection;
