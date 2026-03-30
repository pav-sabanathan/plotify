import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_BORDER_COLORS } from '@/types/show';
import { isBuiltInPlatform, getPlatformColor } from '@/lib/platformUtils';

interface FallbackPosterProps {
  name: string;
  platform: string;
  className?: string;
  customServices?: { id: string; name: string; color: string }[];
}

const EXCLUDED_WORDS = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'at', 'and', 'or', 'but']);

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  const significant = words.filter(w => !EXCLUDED_WORDS.has(w.toLowerCase()));
  const source = significant.length > 0 ? significant : words;
  if (source.length === 1) return source[0].charAt(0).toUpperCase();
  return source.map(w => w.charAt(0).toUpperCase()).join('.') + '.';
};

const FallbackPoster = ({ name, platform, className, customServices = [] }: FallbackPosterProps) => {
  const initials = getInitials(name) || '?';
  const builtIn = isBuiltInPlatform(platform);
  const borderClass = builtIn ? PLATFORM_BORDER_COLORS[platform] : undefined;
  const customColor = !builtIn ? getPlatformColor(platform, customServices) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-surface-1 rounded-md border-2',
        borderClass,
        className
      )}
      style={customColor ? { borderColor: customColor } : undefined}
    >
      <Tv className="h-5 w-5 text-muted-foreground mb-1" />
      <span className={cn('font-bold text-foreground', initials.length > 4 ? 'text-sm' : initials.length > 2 ? 'text-base' : 'text-xl')}>{initials}</span>
    </div>
  );
};

export default FallbackPoster;
