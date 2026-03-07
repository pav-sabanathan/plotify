import { Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Platform, PLATFORM_BORDER_COLORS } from '@/types/show';

interface FallbackPosterProps {
  name: string;
  platform: Platform;
  className?: string;
}

const FallbackPoster = ({ name, platform, className }: FallbackPosterProps) => {
  const firstLetter = name.trim().charAt(0).toUpperCase() || '?';

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
