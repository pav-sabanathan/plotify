import { useCustomServices } from '@/context/CustomServicesContext';
import { getPlatformLabel, getPlatformBgClass, getPlatformColor, getPlatformContrastClass } from '@/lib/platformUtils';
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
  const contrastClass = getPlatformContrastClass(platform, services);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        bgClass,
        contrastClass,
        className
      )}
      style={customColor ? { backgroundColor: customColor } : undefined}
    >
      {label}
    </span>
  );
};

export default PlatformBadge;
