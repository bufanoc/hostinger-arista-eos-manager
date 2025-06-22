import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Router, Eye, Plus } from 'lucide-react';

const RoutingTab = ({ handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Router className="h-5 w-5 text-green-400" />
          <span>Routing Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Static Routes</h4>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-700/50 border border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono">0.0.0.0/0 via 192.168.1.1</span>
                  <Button 
                    onClick={() => handleFeatureClick('Edit Route')}
                    variant="ghost" 
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => handleFeatureClick('Add Static Route')} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Static Route
            </Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">BGP Configuration</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">AS Number</label>
                <Input 
                  placeholder="65001" 
                  className="mt-1 bg-slate-800 border-gray-600"
                  onClick={() => handleFeatureClick('BGP AS Number')}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Router ID</label>
                <Input 
                  placeholder="1.1.1.1" 
                  className="mt-1 bg-slate-800 border-gray-600"
                  onClick={() => handleFeatureClick('BGP Router ID')}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoutingTab;
