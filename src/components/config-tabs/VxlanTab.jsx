import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Eye, Plus } from 'lucide-react';

const VxlanTab = ({ handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Globe className="h-5 w-5 text-cyan-400" />
          <span>VXLAN Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">VTEP Configuration</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Source Interface</label>
                <Select onValueChange={() => handleFeatureClick('VTEP Source Interface')}>
                  <SelectTrigger className="mt-1 bg-slate-800 border-gray-600">
                    <SelectValue placeholder="Select interface" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loopback0">Loopback0</SelectItem>
                    <SelectItem value="loopback1">Loopback1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400">UDP Port</label>
                <Input 
                  placeholder="4789" 
                  className="mt-1 bg-slate-800 border-gray-600"
                  onClick={() => handleFeatureClick('VXLAN UDP Port')}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">VNI Mappings</h4>
            <div className="space-y-3">
              {[
                { vni: 10010, vlan: 10 },
                { vni: 10020, vlan: 20 }
              ].map((mapping) => (
                <div key={mapping.vni} className="p-3 rounded-lg bg-slate-700/50 border border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-white">VNI {mapping.vni} → VLAN {mapping.vlan}</span>
                    <Button 
                      onClick={() => handleFeatureClick('Edit VNI Mapping')}
                      variant="ghost" 
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => handleFeatureClick('Add VNI Mapping')} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add VNI Mapping
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VxlanTab;
