'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Plus,
  Pencil,
  Trash2,
  Settings2,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Target,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import { Switch } from '@/components/flow-ai/ui/switch';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Badge } from '@/components/flow-ai/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/flow-ai/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/flow-ai/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/flow-ai/cn';
import {
  Q_GET_ORGANIZATION_INSTRUCTIONS,
  Q_GET_MY_CUSTOM_INSTRUCTIONS,
  M_CREATE_CUSTOM_INSTRUCTION,
  M_UPDATE_CUSTOM_INSTRUCTION,
  M_DELETE_CUSTOM_INSTRUCTION,
  M_TOGGLE_CUSTOM_INSTRUCTION,
  M_SET_INSTRUCTION_DEFAULT,
} from '@/lib/flow-ai/gql';
import type {
  CustomInstruction,
  CreateCustomInstructionInput,
  UpdateCustomInstructionInput,
  InstructionLevel,
  CustomInstructionScope,
} from '@/components/flow-ai/types/chat';

interface CustomInstructionsSettingsProps {
  isAdmin?: boolean;
}

export function CustomInstructionsSettings({ isAdmin = false }: CustomInstructionsSettingsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<CustomInstruction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAdvancedScope, setShowAdvancedScope] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    instruction: string;
    level: InstructionLevel;
    isDefault: boolean;
    scope: CustomInstructionScope;
  }>({
    name: '',
    instruction: '',
    level: 'USER',
    isDefault: false,
    scope: {},
  });

  // Queries
  const { data: orgInstructionsData, loading: orgLoading, refetch: refetchOrg } = useQuery<{
    organizationInstructions: CustomInstruction[];
  }>(Q_GET_ORGANIZATION_INSTRUCTIONS, {
    skip: !isAdmin,
  });

  const { data: myInstructionsData, loading: myLoading, refetch: refetchMy } = useQuery<{
    myCustomInstructions: CustomInstruction[];
  }>(Q_GET_MY_CUSTOM_INSTRUCTIONS);

  // Mutations
  const [createInstruction, { loading: creating }] = useMutation(M_CREATE_CUSTOM_INSTRUCTION);
  const [updateInstruction, { loading: updating }] = useMutation(M_UPDATE_CUSTOM_INSTRUCTION);
  const [deleteInstruction, { loading: deleting }] = useMutation(M_DELETE_CUSTOM_INSTRUCTION);
  const [toggleInstruction] = useMutation(M_TOGGLE_CUSTOM_INSTRUCTION);
  const [setDefault] = useMutation(M_SET_INSTRUCTION_DEFAULT);

  const orgInstructions = orgInstructionsData?.organizationInstructions || [];
  const myInstructions = myInstructionsData?.myCustomInstructions || [];

  const resetForm = () => {
    setFormData({
      name: '',
      instruction: '',
      level: 'USER',
      isDefault: false,
      scope: {},
    });
    setShowAdvancedScope(false);
  };

  const openCreateDialog = () => {
    resetForm();
    // Admin creates org-level, users create user-level
    setFormData((prev) => ({ ...prev, level: isAdmin ? 'ORGANIZATION' : 'USER' }));
    setEditingInstruction(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (instruction: CustomInstruction) => {
    setFormData({
      name: instruction.name,
      instruction: instruction.instruction,
      level: instruction.level,
      isDefault: instruction.isDefault,
      scope: instruction.scope || {},
    });
    setShowAdvancedScope(
      !!(instruction.scope?.objects?.length ||
        instruction.scope?.keywords?.length)
    );
    setEditingInstruction(instruction);
    setIsCreateDialogOpen(true);
  };

  const cleanScope = (scope: CustomInstructionScope): CustomInstructionScope => {
    const { __typename, ...rest } = scope as CustomInstructionScope & { __typename?: string };
    return rest;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.instruction.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingInstruction) {
        const input: UpdateCustomInstructionInput = {
          id: editingInstruction.id,
          name: formData.name,
          instruction: formData.instruction,
          scope: cleanScope(formData.scope),
          isDefault: formData.isDefault,
        };
        await updateInstruction({ variables: { input } });
        toast.success('Instruction updated successfully');
      } else {
        const input: CreateCustomInstructionInput = {
          name: formData.name,
          instruction: formData.instruction,
          level: formData.level,
          scope: cleanScope(formData.scope),
          isDefault: formData.isDefault,
        };
        await createInstruction({ variables: { input } });
        toast.success('Instruction created successfully');
      }

      setIsCreateDialogOpen(false);
      resetForm();
      refetchOrg();
      refetchMy();
    } catch (error) {
      console.error('Failed to save instruction:', error);
      toast.error('Failed to save instruction');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInstruction({ variables: { instructionId: id } });
      toast.success('Instruction deleted');
      setDeleteConfirmId(null);
      refetchOrg();
      refetchMy();
    } catch (error) {
      console.error('Failed to delete instruction:', error);
      toast.error('Failed to delete instruction');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleInstruction({ variables: { instructionId: id, isActive } });
      refetchOrg();
      refetchMy();
    } catch (error) {
      console.error('Failed to toggle instruction:', error);
      toast.error('Failed to toggle instruction');
    }
  };

  const handleSetDefault = async (id: string, isDefault: boolean) => {
    try {
      await setDefault({ variables: { instructionId: id, isDefault } });
      refetchOrg();
      refetchMy();
    } catch (error) {
      console.error('Failed to update default setting:', error);
      toast.error('Failed to update default setting');
    }
  };

  const updateScopeField = (field: keyof CustomInstructionScope, value: string) => {
    const values = value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v);
    setFormData((prev) => ({
      ...prev,
      scope: {
        ...prev.scope,
        [field]: values.length > 0 ? values : undefined,
      },
    }));
  };

  const renderInstructionCard = (instruction: CustomInstruction, isOrgLevel: boolean) => (
    <Card key={instruction.id} className={cn('relative', !instruction.isActive && 'opacity-60')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base truncate">{instruction.name}</CardTitle>
              {isOrgLevel && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  Org
                </Badge>
              )}
              {instruction.isDefault && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Switch
              checked={instruction.isActive}
              onCheckedChange={(checked) => handleToggle(instruction.id, checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {instruction.instruction}
        </p>

        {/* Scope badges */}
        {(instruction.scope?.objects?.length ||
          instruction.scope?.keywords?.length) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {instruction.scope?.objects?.map((obj) => (
              <Badge key={obj} variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {obj}
              </Badge>
            ))}
            {instruction.scope?.keywords?.map((kw) => (
              <Badge key={kw} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {kw}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isOrgLevel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetDefault(instruction.id, !instruction.isDefault)}
              className="text-xs"
            >
              {instruction.isDefault ? 'Remove Default' : 'Set as Default'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(instruction)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmId(instruction.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const isLoading = orgLoading || myLoading;

  return (
    <div className="space-y-6">
      {/* Organization Instructions (Admin only) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Organization Instructions</h3>
            </div>
            <Button onClick={() => openCreateDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Org Instruction
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            These instructions apply to all users in your organization and cannot be disabled by
            individual users.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orgInstructions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No organization-level instructions yet.
                </p>
                <Button
                  variant="link"
                  onClick={() => openCreateDialog()}
                  className="mt-2"
                >
                  Create your first one
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orgInstructions.map((inst) => renderInstructionCard(inst, true))}
            </div>
          )}
        </div>
      )}

      {/* User Instructions (Non-admin only) */}
      {!isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">My Instructions</h3>
            </div>
          <Button onClick={() => openCreateDialog()} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Instruction
          </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Personal instructions that you can toggle on or off. Default instructions are
            automatically applied to all your chats.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : myInstructions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Settings2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No personal instructions yet.
                </p>
              <Button variant="link" onClick={() => openCreateDialog()} className="mt-2">
                Create your first one
              </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myInstructions.map((inst) => renderInstructionCard(inst, false))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              {editingInstruction ? 'Edit Instruction' : 'Create Custom Instruction'}
            </DialogTitle>
            <DialogDescription>
              {editingInstruction
                ? 'Update your custom instruction settings.'
                : 'Create a new instruction that FlowChat will follow.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Formal Tone, Marge Persona"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instruction">Instruction *</Label>
              <Textarea
                id="instruction"
                placeholder="Describe how FlowChat should behave..."
                value={formData.instruction}
                onChange={(e) => setFormData((prev) => ({ ...prev, instruction: e.target.value }))}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Write in natural language. Example: &quot;Always respond in a formal, professional
                tone. Use business terminology and avoid casual language.&quot;
              </p>
            </div>


            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="default">Enable by Default</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically apply this instruction to all chats
                </p>
              </div>
              <Switch
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked }))
                }
              />
            </div>

            {/* Advanced Scope Settings */}
            <Collapsible open={showAdvancedScope} onOpenChange={setShowAdvancedScope}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-1 h-auto">
                  <span className="text-sm font-medium">Advanced Scope Settings</span>
                  {showAdvancedScope ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <p className="text-xs text-muted-foreground">
                  Optionally restrict when this instruction fires. Leave empty to apply always.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="objects" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Objects (comma-separated)
                  </Label>
                  <Input
                    id="objects"
                    placeholder="contacts, quotes, commissions"
                    value={formData.scope.objects?.join(', ') || ''}
                    onChange={(e) => updateScopeField('objects', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only fire when queries involve these entity types
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Keywords (comma-separated)
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="brass, elbow, fitting"
                    value={formData.scope.keywords?.join(', ') || ''}
                    onChange={(e) => updateScopeField('keywords', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only fire when the query contains these keywords
                  </p>
                </div>

              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={creating || updating}>
              {creating || updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingInstruction ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Instruction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this instruction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
