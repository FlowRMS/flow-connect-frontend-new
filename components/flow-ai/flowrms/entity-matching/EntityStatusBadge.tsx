import { Badge } from '@/components/flow-ai/ui/badge';

interface EntityStatusBadgeProps {
  status: string;
}

export function EntityStatusBadge({ status }: EntityStatusBadgeProps) {
  switch (status) {
    case 'auto':
      return <Badge variant="secondary" className="bg-blue-50 text-blue-700">AUTO-SELECTED</Badge>;
    case 'confirmed':
      return <Badge variant="secondary" className="bg-green-50 text-green-700">CONFIRMED</Badge>;
    case 'needs-review':
      return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">NEEDS REVIEW</Badge>;
    case 'user-created':
      return <Badge variant="secondary" className="bg-purple-50 text-purple-700">USER CREATED</Badge>;
    case 'no-match':
      return <Badge variant="secondary" className="bg-red-50 text-red-700">NO MATCH FOUND</Badge>;
    default:
      return null;
  }
}









