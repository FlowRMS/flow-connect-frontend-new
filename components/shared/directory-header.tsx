import { Globe } from 'lucide-react';

interface DirectoryHeaderProps {
  title: string;
  description: string;
}

export function DirectoryHeader({ title, description }: DirectoryHeaderProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
