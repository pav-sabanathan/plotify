import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform, PLATFORM_BORDER_COLORS } from '@/types/show';

interface FallbackPosterProps {
  name: string;
  platform: Platform;
  className?: string;
}

const EXCLUDED_WORDS = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'at', 'and', 'or', 'but']);

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  const significant = words.filter(w => !EXCLUDED_WORDS.has(w.toLowerCase()));
  const source = significant.length > 0 ? significant : words;
  if (source.length === 1) return source[0].charAt(0).toUpperCase();
  return source.map(w => w.charAt(0).toUpperCase()).join('.') + '.';
};

const FallbackPoster = ({ name, platform, className }: FallbackPosterProps) => {
  const initials = getInitials(name) || '?';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-surface-1 rounded-md border-2',
        PLATFORM_BORDER_COLORS[platform],
        className
      )}
    >
      <Tv className="h-5 w-5 text-muted-foreground mb-1" />
      <span className="text-xl font-bold text-foreground">{firstLetter}</span>
    </div>
  );
};

export default FallbackPoster;
