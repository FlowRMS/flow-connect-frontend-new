/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Trash2, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/flow-ai/ui/card';
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { PipelineRunner } from '@/components/flow-ai/workflows/PipelineRunner';
import { toast } from 'sonner';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import { workflowAPI, type Workflow } from '@/lib/flow-ai/workflow-api';
import { convertPseudoCodeToHTML } from '@/lib/flow-ai/pseudo-code-formatter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/flow-ai/ui/select';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useWorkflowTenant();
  const workflowId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowJson, setWorkflowJson] = useState<any>({ nodes: [], connections: {} });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [pseudoCode, setPseudoCode] = useState<string>('');
  const [status, setStatus] = useState('draft');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [activeTab, setActiveTab] = useState('view');

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      const data = await workflowAPI.getWorkflow(workflowId);
      setWorkflow(data);
      setName(data.name);
      setDescription(data.description || '');
      setWorkflowJson(data.workflow_json || { nodes: [], connections: {} });
      setGeneratedCode(data.generated_code || '');
      setPseudoCode(data.pseudo_code || '');
      setStatus(data.status);
      setIsPublic(!!data.is_public);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load workflow');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await workflowAPI.updateWorkflow(workflowId, {
        name,
        description,
        workflow_json: workflowJson,
        generated_code: generatedCode || undefined,
        status,
        is_public: isPublic,
      });
      toast.success('Workflow updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workflow');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowAPI.deleteWorkflow(workflowId);
      toast.success('Workflow deleted');
      router.push('/flow-ai/workflows');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete workflow');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/flow-ai/workflows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflows
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/flow-ai/workflows/${workflowId}/executions`}>
                <FileText className="w-4 h-4 mr-2" />
                Executions
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-8 flow-card max-h-[calc(100vh-6rem)] overflow-auto">
              <CardHeader>
                <CardTitle>Workflow Details</CardTitle>
                <CardDescription>Edit workflow settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={isPublic ? 'public' : 'private'}
                    onValueChange={(v) => setIsPublic(v === 'public')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (My Workflows)</SelectItem>
                      <SelectItem value="public">Public (Gallery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="view">View Workflow</TabsTrigger>
                <TabsTrigger value="pipeline">Pipeline Runner</TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="space-y-4">
                <Card className="flow-card">
                  <CardHeader>
                    <CardTitle>Workflow Plan</CardTitle>
                    <CardDescription>
                      The workflow plan generated by the AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {workflowJson && Object.keys(workflowJson).length > 0 ? (
                      <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                        {JSON.stringify(workflowJson, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No workflow plan available. Run the pipeline to generate one.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="flow-card">
                  <CardHeader>
                    <CardTitle>{isAdmin ? 'Generated Code' : 'Pseudo Code'}</CardTitle>
                    <CardDescription>
                      {isAdmin
                        ? 'View and edit the Python code used when this workflow executes.'
                        : 'View the pseudo code (read-only, non-editable) for this workflow.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAdmin ? (
                      <Textarea
                        value={generatedCode}
                        onChange={(e) => setGeneratedCode(e.target.value)}
                        rows={16}
                        className="font-mono text-xs"
                        placeholder="Generated Python code will appear here after the workflow is created or code is generated."
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          User Mode: Viewing pseudo code (read-only, non-editable)
                        </div>
                        {pseudoCode ? (
                          <div className="pseudo-code-container p-6 bg-card border rounded-lg overflow-auto max-h-[500px]">
                            <div className="pseudo-code-content">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: convertPseudoCodeToHTML(pseudoCode),
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">
                              Pseudo code not available. Run the workflow pipeline to
                              generate pseudo code, or switch to Admin mode to view actual
                              code.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pipeline">
                {workflow && (
                  <PipelineRunner
                    workflow={workflow}
                    onSave={(result) => {
                      // Update local state with generated code and workflow plan
                      const node2 = result.nodes?.node2;
                      const node3 = result.nodes?.node3;

                      if (node2?.workflow_plan) {
                        setWorkflowJson(node2.workflow_plan);
                      }

                      if (node3?.code) {
                        setGeneratedCode(node3.code);
                      }

                      if (node3?.pseudo_code) {
                        setPseudoCode(node3.pseudo_code);
                      }

                      toast.success('Workflow data updated. Click "Save" to persist changes.');
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
