import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Zap, Upload, Download } from 'lucide-react';

const CliTab = ({ switchData, handleFeatureClick }) => {
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-green-400" />
          <span>CLI Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="terminal-bg rounded-lg p-4 border border-gray-600">
          <div className="text-green-400 text-sm mb-2">
            {switchData.hostname}#
          </div>
          <Textarea
            placeholder="Enter EOS commands here..."
            className="bg-transparent border-none text-green-400 font-mono resize-none min-h-[300px] focus:ring-0"
            onClick={() => handleFeatureClick('CLI Commands')}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => handleFeatureClick('Execute Commands')} className="bg-green-600 hover:bg-green-700">
            <Zap className="h-4 w-4 mr-2" />
            Execute
          </Button>
          <Button onClick={() => handleFeatureClick('Load Config')} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Load Config
          </Button>
          <Button onClick={() => handleFeatureClick('Export Config')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CliTab;
