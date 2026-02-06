import { type LucideIcon } from 'lucide-react';

export interface ValidationRuleCardProps {
  name: string;
  description: string;
  triggers?: string[];
  icon: LucideIcon;
  iconClassName?: string;
  triggerHeader?: string;
  triggerTip?: string;
}

export function ValidationRuleCard({
  name,
  description,
  triggers,
  icon: Icon,
  iconClassName = 'text-green-600',
  triggerHeader,
  triggerTip,
}: ValidationRuleCardProps) {
  const hasTriggers = triggers && triggers.length > 0;

  return (
    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClassName}`} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {hasTriggers && (
          <div className="mt-3 p-3 bg-muted rounded">
            <p className="text-xs font-medium mb-1">{triggerHeader || 'What triggers this error:'}</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {triggers.map((trigger, index) => (
                <li key={index}>{trigger}</li>
              ))}
            </ul>
            {triggerTip && (
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Tip:</span> {triggerTip}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
