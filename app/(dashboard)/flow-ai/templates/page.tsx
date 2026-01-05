'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { FileStack, Loader2 } from 'lucide-react';
import { Badge } from '@/components/flow-ai/ui/badge';
import { TemplatesGallery } from '@/components/flow-ai/flowrms/TemplatesGallery';
import { ClusterModal } from '@/components/flow-ai/flowrms/ClusterModal';
import { AdminSettingsDialog } from '@/components/flow-ai/flowrms/AdminSettingsDialog';
import { useApolloClient } from '@apollo/client/react';
import { Q_GET_CLUSTERS } from '@/lib/flow-ai/gql';
import { toast } from 'sonner';

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
    <div className="min-h-full bg-background flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileStack className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Templates</h1>
              <p className="text-sm text-muted-foreground">Manage document processing templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 bg-primary/5">
              {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
            </Badge>
            <AdminSettingsDialog />
          </div>
        </div>
      </div>

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








