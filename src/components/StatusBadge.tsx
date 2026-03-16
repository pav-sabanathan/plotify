import { cn } from '@/lib/utils';

type DisplayStatus = 'ongoing' | 'ended' | 'upcoming' | 'full-season' | 'season-complete';

interface StatusBadgeProps {
  status: DisplayStatus;
}

const STATUS_STYLES: Record<DisplayStatus, string> = {
  ongoing: 'bg-emerald-500/20 text-emerald-400',
  ended: 'bg-muted text-muted-foreground',
  upcoming: 'bg-amber-500/20 text-amber-400',
  'full-season': 'bg-amber-600/20 text-amber-300',
  'season-complete': 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<DisplayStatus, string> = {
  ongoing: 'Ongoing',
  ended: 'Ended',
  upcoming: 'Upcoming',
  'full-season': 'All Episodes Available',
};

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status])}>
    {STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
