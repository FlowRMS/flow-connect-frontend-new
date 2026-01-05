import { Save, ArrowRight, LifeBuoy, Sparkles } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import { Label } from '@/components/flow-ai/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/flow-ai/ui/tooltip';

interface ActionPanelProps {
  onApprove: (saveToTemplate: boolean) => void;
  onSubmitToSupport: () => void;
  onSaveTemplate: () => void;
  onGoToQueue: () => void;
  isApproveDisabled?: boolean;
  isApproveLoading?: boolean;
  hideTemplateButton?: boolean;
  hideQueueButton?: boolean;
  saveToTemplate?: boolean;
  onSaveToTemplateChange?: (checked: boolean) => void;
  isCsv?: boolean; // If true, shows "Mapping" instead of "Matching"
}

export function ActionPanel({
  onApprove,
  onSubmitToSupport,
  onSaveTemplate,
  onGoToQueue,
  isApproveDisabled = false,
  isApproveLoading = false,
  hideTemplateButton = false,
  hideQueueButton = false,
  saveToTemplate = true,
  onSaveToTemplateChange,
  isCsv = false,
}: ActionPanelProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-4 mr-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="save-to-template"
              checked={saveToTemplate}
              onCheckedChange={(checked) => onSaveToTemplateChange?.(checked === true)}
            />
            <Label htmlFor="save-to-template" className="text-sm font-medium cursor-pointer">
              Save to template
            </Label>
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onSubmitToSupport}
              variant="outline"
              className="gap-2"
            >
              <LifeBuoy className="w-4 h-4" />
              Submit to Flow Support
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Click here if Flow isn&apos;t extracting data correctly and you can&apos;t get it to work. 
            The support team will review this and get it working for you
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => onApprove(saveToTemplate)}
              className="gap-2"
              disabled={isApproveDisabled || isApproveLoading}
            >
              <Sparkles className="w-4 h-4" />
              {isApproveLoading ? 'Processing...' : (isCsv ? 'Mapping' : 'Matching')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCsv
              ? 'Click here once all the extracted text looks good to continue to column mapping'
              : 'Click here once all the extracted text looks good to continue to entity matching'
            }
          </TooltipContent>
        </Tooltip>

        {!hideTemplateButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onSaveTemplate} variant="outline" className="gap-2">
                <Save className="w-4 h-4" />
                Add as Template
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save current field mapping as template</TooltipContent>
          </Tooltip>
        )}

        {!hideQueueButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onGoToQueue} variant="outline" className="gap-2">
                Go to Queue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View processing queue</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}









