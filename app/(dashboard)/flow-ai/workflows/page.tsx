/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from '@/components/ui/HeaderIconAnimations';
import { iconMap } from '@/components/Sidebar';
import type { RefObject } from 'react';
import {
  Plus,
  Loader2,
  BarChart3,
  Clock,
  FileText,
  Globe,
  Lock,
  Workflow as WorkflowIcon,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { workflowAPI, type Workflow } from '@/lib/flow-ai/workflow-api';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Active
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="secondary">
          Draft
        </Badge>
      );
    case 'paused':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          Paused
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="capitalize">
          {status}
        </Badge>
      );
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const router = useRouter();

  return (
    <Card
      className="flow-card cursor-pointer hover-lift"
      onClick={() => router.push(`/flow-ai/workflows/${workflow.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {workflow.name}
            </CardTitle>
            {workflow.description && (
              <CardDescription className="text-sm line-clamp-2">
                {workflow.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {workflow.is_public ? (
              <Globe className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
            {getStatusBadge(workflow.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(workflow.created_at)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/flow-ai/workflows/${workflow.id}/executions`);
            }}
          >
            <FileText className="w-3 h-3 mr-1" />
            Executions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myWorkflows, setMyWorkflows] = useState<Workflow[]>([]);
  const [publicWorkflows, setPublicWorkflows] = useState<Workflow[]>([]);
  const [activeTab, setActiveTab] = useState('my');

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

  const isReceivingAnimation = floatingIcon?.itemId === 'flow-ai-workflows';

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const gallery = await workflowAPI.getWorkflowGallery();
      setMyWorkflows(gallery.my_workflows || []);
      setPublicWorkflows(gallery.public_workflows || []);
    } catch (error: any) {
      console.error('Failed to fetch workflows:', error);
      toast.error(error.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6 overflow-visible">
        {/* Hero Section */}
        <div className="flex items-center justify-between overflow-visible">
          <div className="flex items-start gap-4 overflow-visible">
            {/* Morphing Icon Target - Workflow Flow Animation */}
            <HeaderIconAnimation
              isReceivingAnimation={isReceivingAnimation}
              animationStyle="workflow-flow"
              headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
            >
              {iconMap['flow-ai-workflows']}
            </HeaderIconAnimation>
            <div className="overflow-hidden">
              <motion.h1
                className="text-3xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.1, ease: morphEase }}
              >
                Flow Workflows
              </motion.h1>
              <motion.p
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.3, delay: 0.2, ease: morphEase }}
              >
                Create and manage AI-powered data processing workflows
              </motion.p>
            </div>
          </div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, delay: 0.25, ease: morphEase }}
          >
            <Button variant="outline" asChild>
              <Link href="/flow-ai/workflows/reporting">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reporting
              </Link>
            </Button>
            <Button asChild>
              <Link href="/flow-ai/workflows/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Workflows Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="my" className="gap-2">
              <Lock className="w-4 h-4" />
              My Workflows ({myWorkflows.length})
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2">
              <Globe className="w-4 h-4" />
              Public Workflows ({publicWorkflows.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading workflows...</p>
            </div>
          ) : (
            <>
              <TabsContent value="my">
                {myWorkflows.length === 0 ? (
                  <Card className="flow-card">
                    <CardContent className="py-12 text-center">
                      <div className="p-4 bg-muted rounded-full inline-flex mb-4">
                        <WorkflowIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first workflow to start automating data processing tasks.
                      </p>
                      <Button asChild>
                        <Link href="/flow-ai/workflows/create">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Workflow
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {myWorkflows.map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="public">
                {publicWorkflows.length === 0 ? (
                  <Card className="flow-card">
                    <CardContent className="py-12 text-center">
                      <div className="p-4 bg-muted rounded-full inline-flex mb-4">
                        <Globe className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No public workflows</h3>
                      <p className="text-muted-foreground">
                        Public workflows from your organization will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {publicWorkflows.map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}









