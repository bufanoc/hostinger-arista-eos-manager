import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Eye, Plus } from 'lucide-react';

const SecurityTab = ({ handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Shield className="h-5 w-5 text-red-400" />
          <span>Security Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Access Control Lists</h4>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-700/50 border border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-white">MANAGEMENT-ACL</span>
                  <Button 
                    onClick={() => handleFeatureClick('Edit ACL')}
                    variant="ghost" 
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={() => handleFeatureClick('Add ACL')} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add ACL
            </Button>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Authentication</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">RADIUS Server</label>
                <Input 
                  placeholder="192.168.1.100" 
                  className="mt-1 bg-slate-800 border-gray-600"
                  onClick={() => handleFeatureClick('RADIUS Server')}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Shared Secret</label>
                <Input 
                  type="password"
                  placeholder="Enter shared secret" 
                  className="mt-1 bg-slate-800 border-gray-600"
                  onClick={() => handleFeatureClick('RADIUS Secret')}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityTab;
