import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoDataAvailableStateProps {
  /**
   * Title text to display
   * @default "No Field Data Available"
   */
  title?: string;
  /**
   * Description text to display
   * @default "Field mapping configuration could not be loaded from the backend. Please ensure the backend service is running and try refreshing the page."
   */
  description?: string;
  /**
   * Button text
   * @default "Refresh Page"
   */
  buttonText?: string;
  /**
   * Handler for the refresh action
   * @default window.location.reload()
   */
  onRefresh?: () => void;
}

/**
 * Empty state component displayed when field mapping data cannot be loaded from the backend.
 */
export function NoDataAvailableState({
  title = 'No Field Data Available',
  description = 'Field mapping configuration could not be loaded from the backend. Please ensure the backend service is running and try refreshing the page.',
  buttonText = 'Refresh Page',
  onRefresh,
}: NoDataAvailableStateProps) {
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/30">
      <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {description}
      </p>
      <Button variant="outline" className="mt-4" onClick={handleRefresh}>
        {buttonText}
      </Button>
    </div>
  );
}
