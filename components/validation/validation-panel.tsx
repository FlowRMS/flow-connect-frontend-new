'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck as TruckIcon,
  Info,
  Settings,
  Scissors,
  Plus,
  Trash2,
  HelpCircle,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { ValidationRuleCard } from './validation-rule-card';
import { ValidationRuleSection } from './validation-rule-section';
import {
  type ValidationRule,
  getValidationRules,
  groupValidationRulesByType,
  getPrefixPatterns,
  createPrefixPattern,
  deletePrefixPattern,
} from '@/lib/graphql/validation-rules';
import { toast } from 'sonner';

export type PrefixPattern = { id: string; pattern: string; description?: string };

export interface ValidationPanelProps {
  role?: 'distributor' | 'manufacturer' | 'rep';
  title?: string;
  showCustomization?: boolean;
  initialPrefixRemovalEnabled?: boolean;
  onAddPrefixPattern?: (pattern: PrefixPattern) => void;
  onRemovePrefixPattern?: (id: string) => void;
  onTest?: () => Promise<void> | void;
  onSave?: () => Promise<void> | void;
  className?: string;
  showWarnings?: boolean;
  showAI?: boolean;
}

/**
 * Maps warning rule names to their corresponding icons.
 * Maintains the exact icon assignments from the original implementation.
 */
const WARNING_ICON_MAP: Record<string, LucideIcon> = {
  'Catalog/Part number format check': AlertTriangle,
  'Lot order detection': Package,
  'Ship-from location comparison': TruckIcon,
  'Include, but flag': Info,
};

/**
 * Returns the appropriate icon for a warning rule.
 */
function getWarningIcon(ruleName: string): LucideIcon {
  return WARNING_ICON_MAP[ruleName] || AlertTriangle;
}

export default function ValidationPanel({
  role = 'distributor',
  title = 'Validation Rules',
  showCustomization = true,
  initialPrefixRemovalEnabled = true,
  onAddPrefixPattern,
  onRemovePrefixPattern,
  onTest,
  onSave,
  className,
  showWarnings = true,
  showAI = true,
}: ValidationPanelProps) {
  const [prefixRemovalEnabled, setPrefixRemovalEnabled] = useState<boolean>(initialPrefixRemovalEnabled);
  const [prefixPatterns, setPrefixPatterns] = useState<PrefixPattern[]>([]);
  const [isLoadingPrefixPatterns, setIsLoadingPrefixPatterns] = useState(true);
  const [newPattern, setNewPattern] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | undefined>();

  // Fetch access token on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchToken() {
      try {
        const res = await fetch('/api/auth/token');
        if (res.ok) {
          const body = await res.json();
          if (!cancelled) {
            setAccessToken(body?.accessToken);
          }
        }
      } catch (e) {
        console.error('Failed to fetch access token:', e);
      }
    }

    fetchToken();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch validation rules and prefix patterns when access token is available
  useEffect(() => {
    if (accessToken === undefined) return;

    let cancelled = false;
    setIsLoadingRules(true);
    setRulesError(null);
    setIsLoadingPrefixPatterns(true);

    // Fetch validation rules
    getValidationRules(accessToken)
      .then((rules) => {
        if (!cancelled) {
          setValidationRules(rules);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch validation rules:', error);
          setRulesError('Failed to load validation rules');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRules(false);
        }
      });

    // Fetch prefix patterns
    getPrefixPatterns(accessToken)
      .then((patterns) => {
        if (!cancelled) {
          // Map backend response (name) to internal format (pattern)
          setPrefixPatterns(
            patterns.map((p) => ({
              id: p.id,
              pattern: p.name,
              description: p.description,
            }))
          );
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to fetch prefix patterns:', error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingPrefixPatterns(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const groupedRules = useMemo(() => groupValidationRulesByType(validationRules), [validationRules]);

  const addPrefixPattern = useCallback(async () => {
    if (!newPattern.trim()) return;

    const tempId = Date.now().toString();
    const optimisticPattern: PrefixPattern = {
      id: tempId,
      pattern: newPattern.trim(),
      description: newDescription.trim() || undefined,
    };

    // Local optimistic update
    setPrefixPatterns((prev) => [...prev, optimisticPattern]);
    setNewPattern('');
    setNewDescription('');

    try {
      if (onAddPrefixPattern) {
        await onAddPrefixPattern(optimisticPattern);
      } else {
        const result = await createPrefixPattern(
          {
            name: optimisticPattern.pattern,
            description: optimisticPattern.description || null,
          },
          accessToken
        );
        // Replace optimistic pattern with server response
        setPrefixPatterns((prev) =>
          prev.map((p) =>
            p.id === tempId
              ? { id: result.id, pattern: result.name, description: result.description }
              : p
          )
        );
      }
      toast.success('Prefix pattern added');
    } catch (e) {
      console.error('Failed to add prefix pattern', e);
      // Revert optimistic update on error
      setPrefixPatterns((prev) => prev.filter((p) => p.id !== tempId));
      toast.error('Failed to add prefix pattern');
    }
  }, [newPattern, newDescription, onAddPrefixPattern, accessToken]);

  const removePrefixPattern = useCallback(
    async (id: string) => {
      // Optimistically remove
      const previous = prefixPatterns;
      setPrefixPatterns((prev) => prev.filter((p) => p.id !== id));

      try {
        if (onRemovePrefixPattern) {
          await onRemovePrefixPattern(id);
        } else {
          const success = await deletePrefixPattern(id, accessToken);
          if (!success) {
            throw new Error('Delete not acknowledged by server');
          }
        }
        toast.success('Prefix pattern removed');
      } catch (e) {
        console.error('Failed to remove prefix pattern', e);
        // Revert
        setPrefixPatterns(previous);
        toast.error('Failed to remove prefix pattern');
      }
    },
    [prefixPatterns, onRemovePrefixPattern, accessToken]
  );

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    try {
      if (onTest) {
        await onTest();
      } else {
        const { testValidationRulesGql } = await import('@/lib/gqlClientSdk');
        await testValidationRulesGql();
      }
    } finally {
      setIsTesting(false);
    }
  }, [onTest]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        const { saveValidationSettingsGql } = await import('@/lib/gqlClientSdk');
        await saveValidationSettingsGql({ prefixRemovalEnabled, prefixPatterns });
      }
    } finally {
      setIsSaving(false);
    }
  }, [onSave, prefixRemovalEnabled, prefixPatterns]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">How your data is validated before being sent to manufacturers</p>
      </div>

      {showCustomization && (
        <Card id="customization">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  Customization Options
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Configure how FlowConnect processes your data before sending
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Scissors className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      {role === 'distributor' ? (
                        <Label className="font-medium">Manufacturer Part Number Prefix Removal</Label>
                      ) : role === 'manufacturer' ? (
                        <Label className="font-medium">Distributor Prefix Removal</Label>
                      ) : null}

                      <Link href="#part-numbers" className="text-muted-foreground hover:text-primary">
                        <HelpCircle className="w-4 h-4" />
                      </Link>
                    </div>

                    {role === 'distributor' ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        If your ERP system adds prefixes to manufacturer part numbers, FlowConnect can automatically
                        remove them before sending data to manufacturers. This ensures part numbers match the
                        manufacturer's original format per NEMRA guidelines.
                      </p>
                    ) : role === 'manufacturer' ? (
                      <p className="text-sm text-muted-foreground mt-1">
                        Distributors often add their own prefixes to your part numbers in their ERP systems.
                        FlowConnect can automatically remove known prefixes from incoming data so part numbers match
                        your original catalog format per NEMRA guidelines.
                      </p>
                    ) : null}
                  </div>
                </div>
                <Switch checked={prefixRemovalEnabled} onCheckedChange={setPrefixRemovalEnabled} />
              </div>

              {prefixRemovalEnabled && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium mb-2">Your Prefix Patterns</p>
                    {role === 'distributor' ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        Add the prefixes your system adds to part numbers. FlowConnect will strip these before sending
                        to manufacturers.
                      </p>
                    ) : role === 'manufacturer' ? (
                      <p className="text-xs text-muted-foreground mb-3">
                        Add prefixes that distributors commonly add to your part numbers. FlowConnect will strip these
                        from incoming data.
                      </p>
                    ) : null}
                    <div className="space-y-2 mb-4">
                      {isLoadingPrefixPatterns ? (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Loading prefix patterns...</span>
                        </div>
                      ) : (
                        prefixPatterns.map((prefix) => (
                          <div key={prefix.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <code className="px-2 py-1 bg-background rounded border text-sm font-mono">
                                {prefix.pattern}
                              </code>
                              <span className="text-sm text-muted-foreground">{prefix.description}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrefixPattern(prefix.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                      {!isLoadingPrefixPatterns && prefixPatterns.length === 0 && (
                        <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                          No prefix patterns configured. Add one below.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-[2] min-w-0">
                        <Input
                          placeholder="Prefix pattern (e.g., ABC-, DIST_ )"
                          value={newPattern}
                          onChange={(e) => setNewPattern(e.target.value)}
                          className="w-full font-mono"
                        />
                      </div>
                      <div className="flex-[2] min-w-0">
                        <Input
                          placeholder="Description (optional)"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-none">
                        <Button onClick={addPrefixPattern} disabled={!newPattern.trim()}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-xs font-medium mb-2">Example:</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Your part number:</span>
                      <code className="px-1.5 py-0.5 bg-background rounded border font-mono">PSC-FT-VAL-2024</code>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">Sent to manufacturer:</span>
                      <code className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded border border-green-200 font-mono">
                        FT-VAL-2024
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Validation</CardTitle>
          <div className="text-sm text-muted-foreground">
            All uploads are automatically validated against the NEMRA POS standard
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <p className="font-medium">NEMRA POS Standard Validation</p>
            </div>
            {role === 'distributor' ? (
              <p className="text-sm text-muted-foreground">
                Because you're sending POS data to NEMRA manufacturers, all uploads are automatically validated against
                the NEMRA POS standard. These validation rules ensure data quality and compatibility across all
                recipients.
              </p>
            ) : role === 'manufacturer' ? (
              <p className="text-sm text-muted-foreground">
                All POS data received from distributors is automatically validated against the NEMRA POS standard
                before being delivered to you. These validation rules ensure data quality and consistency across all
                your distributor sources.
              </p>
            ) : null}
          </div>

          {isLoadingRules && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading validation rules...</span>
            </div>
          )}

          {rulesError && !isLoadingRules && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">{rulesError}</p>
              </div>
            </div>
          )}

          {!isLoadingRules && !rulesError && groupedRules.standard.length > 0 && (
            <ValidationRuleSection title="Standard Validation" badgeText="Required">
              {groupedRules.standard.map((rule) => (
                <ValidationRuleCard
                  key={rule.name}
                  name={rule.name}
                  description={rule.description}
                  triggers={rule.triggers}
                  icon={CheckCircle}
                  iconClassName="text-green-600"
                  triggerHeader="What triggers this error:"
                />
              ))}
            </ValidationRuleSection>
          )}

          {!isLoadingRules && !rulesError && showWarnings && groupedRules.warning.length > 0 && (
            <ValidationRuleSection
              title="Validation Warnings"
              badgeText="Non-blocking"
              footerTip="If your ERP system tracks order types, map them to the Order Type field in the Field Mapping page."
            >
              {groupedRules.warning.map((rule) => (
                <ValidationRuleCard
                  key={rule.name}
                  name={rule.name}
                  description={rule.description}
                  triggers={rule.triggers}
                  icon={getWarningIcon(rule.name)}
                  iconClassName="text-amber-600"
                  triggerHeader="What triggers this warning:"
                  triggerTip={
                    rule.name === 'Catalog/Part number format check'
                      ? 'When available, include the UPC number as a cross-reference to help manufacturers identify products.'
                      : undefined
                  }
                />
              ))}
            </ValidationRuleSection>
          )}

          {!isLoadingRules && !rulesError && showAI && groupedRules.ai.length > 0 && (
            <ValidationRuleSection title="AI-Powered Validation" badgeText="Enhanced">
              {groupedRules.ai.map((rule) => (
                <ValidationRuleCard
                  key={rule.name}
                  name={rule.name}
                  description={rule.description}
                  triggers={rule.triggers}
                  icon={CheckCircle}
                  iconClassName="text-blue-600"
                />
              ))}
            </ValidationRuleSection>
          )}

          <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
            {role === 'distributor' ? (
              <p className="text-sm text-muted-foreground">
                Validation results are shown after each upload. Errors must be resolved before data can be sent.
                Warnings are informational and won't block submission.
              </p>
            ) : role === 'manufacturer' ? (
              <p className="text-sm text-muted-foreground">
                Validation is performed automatically when distributors submit data. Records with errors are held for
                correction before delivery. Warnings are informational and included in your data with appropriate
                flags.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
