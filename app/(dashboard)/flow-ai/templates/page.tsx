'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
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

  // Navigation morph hooks
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === 'flow-ai-templates';

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
      <div className="border-b bg-card/50 px-6 py-4 overflow-visible">
        <div className="flex items-center justify-between overflow-visible">
          <div className="flex items-center gap-3 overflow-visible">
            {/* Morphing Icon Target - Template Stack Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="template-stack"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['flow-ai-templates']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-xl font-bold"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Templates
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                Manage document processing templates
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            <Badge variant="outline" className="border-primary/20 bg-primary/5">
              {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
            </Badge>
            <AdminSettingsDialog />
          </motion.div>
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








