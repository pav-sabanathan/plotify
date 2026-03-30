import { Platform, PLATFORM_LABELS } from '@/types/show';
import { useCustomServices } from '@/context/CustomServicesContext';
import { isBuiltInPlatform, getPlatformLabel, getPlatformBgClass, getPlatformColor } from '@/lib/platformUtils';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

const PlatformBadge = ({ platform, className }: PlatformBadgeProps) => {
  const { services } = useCustomServices();
  const label = getPlatformLabel(platform, services);
  const bgClass = getPlatformBgClass(platform);
  const customColor = getPlatformColor(platform, services);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground',
        bgClass,
        platform === 'apple' && 'text-primary-foreground',
        className
      )}
      style={customColor ? { backgroundColor: customColor } : undefined}
    >
      {label}
    </span>
  );
};

export default PlatformBadge;
