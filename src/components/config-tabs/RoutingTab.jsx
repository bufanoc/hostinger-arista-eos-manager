import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Router, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StaticRoutesSection from './StaticRoutesSection';
import BgpSection from './BgpSection';
import {
  getStaticRoutes,
  addStaticRoute,
  deleteStaticRoute,
  getBgpConfig,
  configureBgp,
  addBgpNeighbor,
  removeBgpNeighbor
} from '@/services/routingConfig';

const RoutingTab = ({ switchData }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('static');
  const [staticRoutes, setStaticRoutes] = useState([]);
  const [bgpConfig, setBgpConfig] = useState(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isLoadingBgp, setIsLoadingBgp] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data when component mounts or switch changes
  useEffect(() => {
    if (switchData?.id) {
      fetchStaticRoutes();
      fetchBgpConfig();
    }
  }, [switchData?.id]);

  // Fetch static routes from the switch
  const fetchStaticRoutes = async () => {
    if (!switchData?.id) return;

    setIsLoadingRoutes(true);
    setError(null);

    try {
      const routes = await getStaticRoutes(switchData.id);
      setStaticRoutes(routes);
    } catch (err) {
      console.error('Error fetching static routes:', err);
      setError(err.message || 'Failed to fetch static routes');
      toast({
        variant: 'destructive',
        title: 'Error Loading Routes',
        description: err.message || 'Failed to fetch static routes'
      });
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Fetch BGP configuration from the switch
  const fetchBgpConfig = async () => {
    if (!switchData?.id) return;

    setIsLoadingBgp(true);

    try {
      const config = await getBgpConfig(switchData.id);
      setBgpConfig(config);
    } catch (err) {
      console.error('Error fetching BGP config:', err);
      // Don't show toast for BGP not configured errors
      if (!err.message?.includes('not enabled')) {
        toast({
          variant: 'destructive',
          title: 'Error Loading BGP Configuration',
          description: err.message || 'Failed to fetch BGP configuration'
        });
      }
    } finally {
      setIsLoadingBgp(false);
    }
  };

  // Handle adding a static route
  const handleAddStaticRoute = async (prefix, nextHop, adminDistance) => {
    if (!switchData?.id) return;

    await addStaticRoute(switchData.id, prefix, nextHop, adminDistance);
    await fetchStaticRoutes(); // Refresh routes after adding
  };

  // Handle deleting a static route
  const handleDeleteStaticRoute = async (prefix, nextHop) => {
    if (!switchData?.id) return;

    await deleteStaticRoute(switchData.id, prefix, nextHop);
    await fetchStaticRoutes(); // Refresh routes after deleting
  };

  // Handle configuring BGP
  const handleConfigureBgp = async (asn, routerId) => {
    if (!switchData?.id) return;

    await configureBgp(switchData.id, asn, routerId);
    await fetchBgpConfig(); // Refresh BGP config after changes
  };

  // Handle adding a BGP neighbor
  const handleAddBgpNeighbor = async (ip, remoteAsn) => {
    if (!switchData?.id || !bgpConfig?.asn) return;

    await addBgpNeighbor(switchData.id, bgpConfig.asn, ip, remoteAsn);
    await fetchBgpConfig(); // Refresh BGP config after changes
  };

  // Handle removing a BGP neighbor
  const handleRemoveBgpNeighbor = async (neighborIp) => {
    if (!switchData?.id || !bgpConfig?.asn) return;

    await removeBgpNeighbor(switchData.id, bgpConfig.asn, neighborIp);
    await fetchBgpConfig(); // Refresh BGP config after changes
  };
  return (
    <Card className="bg-slate-800/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Router className="h-5 w-5 text-green-400" />
          <span>Routing Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!switchData?.id ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
            <p className="text-gray-400">Please select a switch to configure routing</p>
          </div>
        ) : (
          <Tabs defaultValue="static" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-900/50 w-full">
              <TabsTrigger value="static" className="flex-1">Static Routes</TabsTrigger>
              <TabsTrigger value="bgp" className="flex-1">BGP</TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="static">
                <StaticRoutesSection 
                  switchData={switchData}
                  staticRoutes={staticRoutes}
                  isLoading={isLoadingRoutes}
                  onRefresh={fetchStaticRoutes}
                  onAddRoute={handleAddStaticRoute}
                  onDeleteRoute={handleDeleteStaticRoute}
                />
              </TabsContent>
              <TabsContent value="bgp">
                <BgpSection 
                  switchData={switchData}
                  bgpConfig={bgpConfig}
                  isLoading={isLoadingBgp}
                  onRefresh={fetchBgpConfig}
                  onConfigureBgp={handleConfigureBgp}
                  onAddNeighbor={handleAddBgpNeighbor}
                  onRemoveNeighbor={handleRemoveBgpNeighbor}
                />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default RoutingTab;
