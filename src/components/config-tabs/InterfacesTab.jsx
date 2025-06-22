import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Network, Plus } from 'lucide-react';

const InterfacesTab = ({ handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-400" />
            <span>Interface Configuration</span>
          </CardTitle>
          <Button onClick={() => handleFeatureClick('Add Interface')} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Interface
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Ethernet1', 'Ethernet2', 'Ethernet3', 'Ethernet4'].map((interfaceName, index) => (
            <div key={interfaceName} className="p-4 rounded-lg bg-slate-700/50 border border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{interfaceName}</h4>
                <Badge variant={index % 2 === 0 ? 'default' : 'secondary'}>
                  {index % 2 === 0 ? 'Up' : 'Down'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-400">Description</label>
                  <Input 
                    placeholder="Interface description" 
                    className="mt-1 bg-slate-800 border-gray-600"
                    onClick={() => handleFeatureClick('Interface Description')}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Mode</label>
                  <Select onValueChange={() => handleFeatureClick('Interface Mode')}>
                    <SelectTrigger className="mt-1 bg-slate-800 border-gray-600">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="access">Access</SelectItem>
                      <SelectItem value="trunk">Trunk</SelectItem>
                      <SelectItem value="routed">Routed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InterfacesTab;
