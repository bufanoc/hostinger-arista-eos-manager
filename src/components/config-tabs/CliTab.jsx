import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Terminal, Zap, Upload, Download, RefreshCw, Copy, Check, AlertOctagon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { executeCli, executeShowCommand } from '@/services/cliCommands';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const CliTab = ({ switchData }) => {
  const { toast } = useToast();
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('command');
  const [configMode, setConfigMode] = useState(false);
  const [configBuffer, setConfigBuffer] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [lastResults, setLastResults] = useState(null);
  
  const outputRef = useRef(null);
  
  // Scroll to bottom of output when new commands are executed
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commandHistory]);
  // Execute the entered command
  const executeCommand = async () => {
    if (!switchData?.id || !command.trim()) return;
    
    setIsExecuting(true);
    
    try {
      let result;
      
      if (configMode) {
        // In config mode, add commands to buffer
        if (command.trim().toLowerCase() === 'end') {
          // Execute the config commands and exit config mode
          const configCommands = ['configure', ...configBuffer.split('\n').filter(Boolean), 'end'];
          result = await executeCli(switchData.id, configCommands);
          setConfigMode(false);
          setConfigBuffer('');
          
          // Add the buffer to history
          const configEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            command: 'configure terminal\n' + configBuffer + '\nend',
            output: result,
            success: true,
            type: 'config'
          };
          
          setCommandHistory(prev => [...prev, configEntry]);
          setLastResults(result);
        } else {
          // Add to config buffer
          setConfigBuffer(prev => prev + (prev ? '\n' : '') + command.trim());
          
          // Add to history for visibility but don't execute yet
          const entry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            command: command.trim(),
            output: null,
            success: true,
            type: 'config-buffer'
          };
          
          setCommandHistory(prev => [...prev, entry]);
        }
      } else if (command.trim().toLowerCase() === 'configure terminal' || command.trim().toLowerCase() === 'configure') {
        // Enter configuration mode
        setConfigMode(true);
        
        const entry = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          command: 'configure terminal',
          output: { output: 'Entering configuration mode...\n(config)#' },
          success: true,
          type: 'info'
        };
        
        setCommandHistory(prev => [...prev, entry]);
      } else {
        // Execute a single command
        result = await executeCli(switchData.id, [command.trim()]);
        
        const entry = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          command: command.trim(),
          output: result[0],
          success: true,
          type: 'command'
        };
        
        setCommandHistory(prev => [...prev, entry]);
        setLastResults(result[0]);
      }
      
      // Clear command input on success
      setCommand('');
      
    } catch (error) {
      console.error('Error executing command:', error);
      
      // Add error to command history
      const errorEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        command: command.trim(),
        output: { output: `Error: ${error.message || 'Command execution failed'}` },
        success: false,
        type: 'error'
      };
      
      setCommandHistory(prev => [...prev, errorEntry]);
      
      toast({
        variant: 'destructive',
        title: 'Command Execution Failed',
        description: error.message || 'An error occurred while executing the command.'
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Handle copy output to clipboard
  const copyToClipboard = async () => {
    if (!lastResults) return;
    
    try {
      let textToCopy = '';
      
      // Format the output based on what's available
      if (typeof lastResults.output === 'string') {
        textToCopy = lastResults.output;
      } else if (typeof lastResults === 'object') {
        textToCopy = JSON.stringify(lastResults, null, 2);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      
      toast({
        title: 'Copied to Clipboard',
        description: 'Command output has been copied to clipboard.'
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy output to clipboard.'
      });
    }
  };
  
  // Render the output based on the command type
  const renderOutput = (entry) => {
    if (!entry.output) {
      if (entry.type === 'config-buffer') {
        return (
          <div className="text-yellow-300 font-mono text-sm">
            <span>(config)# {entry.command}</span>
          </div>
        );
      }
      return null;
    }
    
    // For string output
    if (typeof entry.output.output === 'string') {
      return (
        <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap">
          {entry.output.output}
        </pre>
      );
    }
    
    // For structured data
    return (
      <pre className="text-green-300 font-mono text-sm whitespace-pre-wrap">
        {JSON.stringify(entry.output, null, 2)}
      </pre>
    );
  };
  
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-green-400" />
            <span>CLI Configuration</span>
            {configMode && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                Config Mode
              </Badge>
            )}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-green-400 border-green-500/30"
            onClick={copyToClipboard}
            disabled={!lastResults}
          >
            {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {isCopied ? 'Copied' : 'Copy Output'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/50">
            <TabsTrigger value="command">CLI Command</TabsTrigger>
            <TabsTrigger value="output">Output History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="command" className="mt-4">
            <div className="terminal-bg rounded-lg p-4 border border-gray-600 bg-black/40">
              <div className="text-green-400 text-sm mb-2">
                {configMode ? `${switchData?.hostname || 'switch'}(config)#` : `${switchData?.hostname || 'switch'}#`}
              </div>
              <Textarea
                placeholder={configMode ? "Enter configuration commands (type 'end' when finished)" : "Enter EOS commands here..."}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    executeCommand();
                  }
                }}
                className="bg-transparent border-none text-green-400 font-mono resize-none min-h-[200px] focus:ring-0"
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={executeCommand} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isExecuting || !command.trim()}
              >
                {isExecuting ? 
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : 
                  <Zap className="h-4 w-4 mr-2" />
                }
                Execute
              </Button>
              
              {configMode && (
                <Button 
                  onClick={() => {
                    setCommand('end');
                    executeCommand();
                  }} 
                  variant="outline"
                  className="text-yellow-400 border-yellow-500/30"
                >
                  Exit Config Mode
                </Button>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="output" className="mt-4">
            <ScrollArea className="h-[350px] rounded-lg border border-gray-600 bg-black/40 p-4">
              <div ref={outputRef} className="space-y-4">
                {commandHistory.length > 0 ? (
                  commandHistory.map(entry => (
                    <div key={entry.id} className="border-b border-gray-700 pb-3 mb-3 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-blue-400 font-mono text-xs">[{entry.timestamp}]</span>
                          <span className={`ml-2 font-bold ${entry.success ? 'text-green-400' : 'text-red-400'}`}>
                            {configMode && entry.type === 'config-buffer' ? '(config)# ' : ''}
                            {entry.command}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${entry.success ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}
                        >
                          {entry.type === 'error' ? 'Error' : 
                           entry.type === 'config' ? 'Config' : 
                           entry.type === 'info' ? 'Info' : 'Command'}
                        </Badge>
                      </div>
                      <div className="pl-2 border-l-2 border-gray-700">
                        {renderOutput(entry)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                    <AlertOctagon className="h-12 w-12 mb-2 text-gray-600" />
                    <p>No commands executed yet</p>
                    <p className="text-sm">Switch to the CLI Command tab and run a command</p>
                  </div>  
                )}
              </div>
            </ScrollArea>
            
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => setCommandHistory([])} 
                variant="outline" 
                className="text-red-400 border-red-500/30"
                disabled={commandHistory.length === 0}
              >
                Clear History
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CliTab;
