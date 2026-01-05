'use client';

import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/flow-ai/ui/dialog';
import { Button } from '@/components/flow-ai/ui/button';
import { Label } from '@/components/flow-ai/ui/label';
import { Switch } from '@/components/flow-ai/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';

const SAVE_TEMPLATE_DEFAULT_KEY = 'flowai_save_template_default';

export function AdminSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [saveTemplateDefault, setSaveTemplateDefault] = useState(true);

  // Load setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_TEMPLATE_DEFAULT_KEY);
    if (saved !== null) {
      setSaveTemplateDefault(saved === 'true');
    } else {
      // Set default to true if not in localStorage
      localStorage.setItem(SAVE_TEMPLATE_DEFAULT_KEY, 'true');
    }
  }, []);

  // Save setting to localStorage when changed
  const handleToggle = (checked: boolean) => {
    setSaveTemplateDefault(checked);
    localStorage.setItem(SAVE_TEMPLATE_DEFAULT_KEY, checked.toString());
    // Dispatch a custom event so other components can react to the change
    window.dispatchEvent(new StorageEvent('storage', {
      key: SAVE_TEMPLATE_DEFAULT_KEY,
      newValue: checked.toString(),
      oldValue: (!checked).toString(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden md:flex">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Settings
          </DialogTitle>
          <DialogDescription>
            Configure default behaviors and preferences for the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Template Settings</CardTitle>
              <CardDescription className="text-sm">
                Configure default behavior for template saving
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="save-template-default" className="text-sm font-medium">
                    Save Template by Default
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, the &quot;Save as Template&quot; checkbox will be checked by default when approving documents.
                  </p>
                </div>
                <Switch
                  id="save-template-default"
                  checked={saveTemplateDefault}
                  onCheckedChange={handleToggle}
                />
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
            <p className="font-medium mb-1">Note:</p>
            <p>This setting is stored locally in your browser. Changes will only affect your own experience.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}









