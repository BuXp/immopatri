import { Badge } from '../ui/badge';

// Color-coded compliance level (DAT Sprint 3): rouge = expired / critical,
// orange = upcoming expiry.
export default function AlerteBadge({ niveau }) {
  if (niveau === 'rouge') {
    return <Badge variant="destructive">Rouge</Badge>;
  }
  return (
    <Badge className="bg-orange-500 text-white hover:bg-orange-500/80">
      Orange
    </Badge>
  );
}
