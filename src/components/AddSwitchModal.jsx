import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Wifi, User, Key, Server, Globe } from 'lucide-react';
import { createConnection } from '@/services/connectionManager';

const AddSwitchModal = ({ isOpen, onClose, onAddSwitch }) => {
  const { toast } = useToast();
  const [ipAddress, setIpAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [protocol, setProtocol] = useState('http');

  const handleConnect = async () => {
    if (!ipAddress || !username || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all fields to connect to the switch.',
      });
      return;
    }

    setIsConnecting(true);
    toast({
      title: 'Connecting to Switch...',
      description: `Attempting to connect to ${ipAddress} via eAPI.`,
    });

    try {
      // Attempt to create a real connection to the switch
      const result = await createConnection(ipAddress, username, password, protocol);
      
      if (result.success) {
        toast({
          title: 'Connection Successful! ✅',
          description: `Connected to ${result.switchData.hostname} (${ipAddress})`,
        });
        
        // Pass the retrieved switch data back to the parent component
        onAddSwitch(result.switchData);
        onClose();
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: result.error || `Could not connect to ${ipAddress}. Please check credentials and network connectivity.`,
        });
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: error.message || 'An unexpected error occurred while connecting to the switch.',
      });
    } finally {
      setIsConnecting(false);
      setIpAddress('');
      setUsername('');
      setPassword('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-green-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="text-green-400" />
            <span>Add New Arista Switch</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the connection details for the switch. eAPI must be enabled on port 80 (HTTP) or 443 (HTTPS).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ipAddress" className="text-right text-gray-300">
              <Wifi className="inline-block h-4 w-4 mr-1" />
              IP Address
            </Label>
            <Input
              id="ipAddress"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="e.g., 192.168.1.10"
              className="col-span-3 bg-slate-800 border-gray-600"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right text-gray-300">
              <User className="inline-block h-4 w-4 mr-1" />
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., admin"
              className="col-span-3 bg-slate-800 border-gray-600"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right text-gray-300">
              <Key className="inline-block h-4 w-4 mr-1" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3 bg-slate-800 border-gray-600"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="protocol" className="text-right text-gray-300">
              <Globe className="inline-block h-4 w-4 mr-1" />
              Protocol
            </Label>
            <div className="col-span-3 flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="http"
                  name="protocol"
                  value="http"
                  checked={protocol === 'http'}
                  onChange={() => setProtocol('http')}
                  className="mr-2"
                />
                <label htmlFor="http" className="text-gray-300">HTTP</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="https"
                  name="protocol"
                  value="https"
                  checked={protocol === 'https'}
                  onChange={() => setProtocol('https')}
                  className="mr-2"
                />
                <label htmlFor="https" className="text-gray-300">HTTPS</label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting} className="bg-green-600 hover:bg-green-700">
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSwitchModal;