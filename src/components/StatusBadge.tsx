import { TrackedShow, ShowStatus } from '@/types/show';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ShowStatus;
}

const STATUS_STYLES: Record<ShowStatus, string> = {
  ongoing: 'bg-emerald-500/20 text-emerald-400',
  ended: 'bg-muted text-muted-foreground',
  upcoming: 'bg-amber-500/20 text-amber-400',
};

const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status])}>
    {status}
  </span>
);

export default StatusBadge;
