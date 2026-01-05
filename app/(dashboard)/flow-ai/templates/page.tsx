'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import NextImage from 'next/image';
import { FileStack, ScanText, Loader2, ArrowLeft, Bot, Workflow, Upload, ListTodo } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { TemplatesGallery } from '@/components/flow-ai/flowrms/TemplatesGallery';
import { ClusterModal } from '@/components/flow-ai/flowrms/ClusterModal';
import { AdminSettingsDialog } from '@/components/flow-ai/flowrms/AdminSettingsDialog';
import { navigateToNewUpload } from '@/lib/flow-ai/navigation-utils';
import { useApolloClient } from '@apollo/client/react';
import { Q_GET_CLUSTERS } from '@/lib/flow-ai/gql';
import { toast } from 'sonner';
import Link from 'next/link';

interface Cluster {
  id: string;
  additionalInstructions: string[];
  clusterMetadata: string | null;
  clusterName: string | null;
  createdAt: string;
  documentCount: number;
}

function TemplatesPageContent() {
  const searchParams = useSearchParams();

  const apolloClient = useApolloClient();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Capture realm from URL and set tenant
  useEffect(() => {
    const urlRealm = searchParams.get('realm');

    if (urlRealm) {
      // Set realm cookie via API call
      fetch(`/set-tenant?realm=${urlRealm}`, { method: 'GET' })
        .then(() => console.log('💾 Set tenant realm from URL:', urlRealm))
        .catch((err) => console.error('❌ Failed to set tenant realm:', err));
    }
  }, [searchParams]);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: Q_GET_CLUSTERS,
        fetchPolicy: 'network-only',
      });
      setClusters((data as { clusters: Cluster[] }).clusters || []);
    } catch (error) {
      toast.error('Failed to load clusters', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [apolloClient]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const handlePreviewCluster = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCluster(null);
  };

  const handleUpdateCluster = () => {
    // Refresh clusters after update
    fetchClusters();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Navigation */}
      <header className="border-b bg-gradient-to-r from-card via-card to-primary/5 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/flow-ai" className="flex items-center gap-3 group">
                <NextImage src="/flow-logo.png" alt="FlowAI Logo" width={32} height={32} className="w-8 h-8" />
                <h1 className="text-2xl font-bold">FlowAI</h1>
              </Link>
              
              <nav className="hidden md:flex items-center gap-2 ml-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={navigateToNewUpload}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/flow-ai" className="text-muted-foreground hover:text-foreground">
                    <ScanText className="w-4 h-4 mr-2" />
                    FlowScan
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/flow-ai/templates" className="text-foreground">
                    <FileStack className="w-4 h-4 mr-2" />
                    Templates
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/flow-ai/ai-chat" className="text-muted-foreground hover:text-foreground">
                    <Bot className="w-4 h-4 mr-2" />
                    FlowChat
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/flow-ai/workflows" className="text-muted-foreground hover:text-foreground">
                    <Workflow className="w-4 h-4 mr-2" />
                    Workflows
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/flow-ai/queue" className="text-muted-foreground hover:text-foreground">
                    <ListTodo className="w-4 h-4 mr-2" />
                    Queue
                  </Link>
                </Button>
                <AdminSettingsDialog />
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/5">
                {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  window.location.href = process.env.NEXT_PUBLIC_FLOWRMS_APP_URL || 'https://development.app.flowrms.com/';
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to FlowRMS
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading clusters...</p>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <TemplatesGallery clusters={clusters} onPreviewCluster={handlePreviewCluster} />
          </div>
        )}
      </main>

      {/* Cluster Modal */}
      <ClusterModal
        cluster={selectedCluster}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdateCluster}
      />
    </div>
  );
}

export default function FlowRmsTemplatesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <TemplatesPageContent />
    </Suspense>
  );
}








