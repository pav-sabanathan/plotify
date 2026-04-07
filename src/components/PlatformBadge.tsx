import { useCustomServices } from '@/context/CustomServicesContext';
import { getPlatformLabel, getPlatformBgClass, getPlatformColor, getPlatformContrastClass } from '@/lib/platformUtils';
import { getPlatformLogo } from '@/lib/platformLogos';
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

  // Try to resolve a logo: first by platform key, then by display name
  const logo = getPlatformLogo(platform) ?? getPlatformLogo(label);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        bgClass,
        contrastClass,
        className
      )}
      style={customColor ? { backgroundColor: customColor } : undefined}
      title={label}
    >
      {logo ? (
        <img
          src={logo.src}
          alt={label}
          className="h-5 w-auto max-w-[80px]"
          style={logo.needsInvert ? { filter: 'brightness(0) invert(1)' } : undefined}
        />
      ) : (
        label
      )}
    </span>
  );
};

export default PlatformBadge;
