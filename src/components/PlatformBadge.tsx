import { Platform, PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/show';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

const PlatformBadge = ({ platform, className }: PlatformBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground',
      PLATFORM_COLORS[platform],
      platform === 'apple' && 'text-primary-foreground',
      className
    )}
  >
    {PLATFORM_LABELS[platform]}
  </span>
);

export default PlatformBadge;
