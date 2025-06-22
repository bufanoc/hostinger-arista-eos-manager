import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layers, Plus, Trash2 } from 'lucide-react';

const VlansTab = ({ handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <span>VLAN Configuration</span>
          </CardTitle>
          <Button onClick={() => handleFeatureClick('Add VLAN')} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add VLAN
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 10, name: 'Management', description: 'Management VLAN' },
            { id: 20, name: 'Users', description: 'User VLAN' },
            { id: 30, name: 'Servers', description: 'Server VLAN' },
            { id: 40, name: 'Guest', description: 'Guest VLAN' }
          ].map((vlan) => (
            <div key={vlan.id} className="p-4 rounded-lg bg-slate-700/50 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">VLAN {vlan.id}</h4>
                <Button 
                  onClick={() => handleFeatureClick('Delete VLAN')}
                  variant="ghost" 
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400">Name</label>
                  <Input 
                    defaultValue={vlan.name}
                    className="mt-1 bg-slate-800 border-gray-600"
                    onClick={() => handleFeatureClick('VLAN Name')}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Description</label>
                  <Input 
                    defaultValue={vlan.description}
                    className="mt-1 bg-slate-800 border-gray-600"
                    onClick={() => handleFeatureClick('VLAN Description')}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VlansTab;
