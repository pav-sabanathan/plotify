import { useEffect, useRef } from 'react';
import { useShows } from '@/context/ShowsContext';
import { PLATFORM_LABELS, PLATFORM_COLORS, PLATFORM_BORDER_COLORS } from '@/types/show';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import FallbackPoster from './FallbackPoster';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isBefore } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const isPlaceholder = (poster: string) => !poster || poster === '/placeholder.svg';

const getDisplayStatus = (show: any) => {
  if (show.releaseType === 'full-season' && show.status !== 'ended') return 'full-season' as const;
  return show.status;
};

const ShowDetailPanel = () => {
  const { shows, detailTarget, closeDetail, watchedEpisodes, toggleWatched, markAllWatched } = useShows();
  const isMobile = useIsMobile();
  const episodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const listRef = useRef<HTMLDivElement>(null);

  const show = detailTarget ? shows.find(s => s.id === detailTarget.showId) : null;

  useEffect(() => {
    if (detailTarget?.highlightEpisodeId) {
      // Small delay to let render complete
      setTimeout(() => {
        const el = episodeRefs.current[detailTarget.highlightEpisodeId!];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('animate-episode-highlight');
          setTimeout(() => el.classList.remove('animate-episode-highlight'), 1500);
        }
      }, 100);
    }
  }, [detailTarget]);

  if (!detailTarget || !show) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const watched = watchedEpisodes[show.id] || [];
  const airedEpisodes = show.episodes.filter(ep => new Date(ep.airDate + 'T00:00:00') <= today);
  const watchedCount = watched.length;
  const totalEps = show.episodes.length;
  const progress = totalEps > 0 ? (watchedCount / totalEps) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={closeDetail}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 bg-card border overflow-y-auto',
          isMobile
            ? 'mt-auto w-full max-h-[85vh] rounded-t-2xl border-t animate-slide-up'
            : 'ml-auto h-full w-full max-w-md border-l animate-slide-left'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-base font-semibold truncate">{show.name}</h2>
          <button onClick={closeDetail} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Show info */}
          <div className="flex gap-4">
            <div className="w-20 h-[120px] flex-shrink-0 rounded-lg overflow-hidden">
              {isPlaceholder(show.poster) ? (
                <FallbackPoster name={show.name} platform={show.platform} className="w-full h-full" />
              ) : (
                <img src={show.poster} alt={show.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">{show.name}</h3>
              <div className="flex flex-wrap gap-1.5">
                <PlatformBadge platform={show.platform} />
                <StatusBadge status={getDisplayStatus(show)} />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{watchedCount} of {totalEps} watched</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', PLATFORM_COLORS[show.platform])}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mark all button */}
          <button
            onClick={() => markAllWatched(show.id)}
            className="w-full rounded-lg bg-secondary hover:bg-accent text-secondary-foreground py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark All Aired as Watched
          </button>

          {/* Episode list */}
          <div ref={listRef} className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Season {show.episodes[0]?.season ?? 1} Episodes
            </h4>
            {show.episodes.map(ep => {
              const airDate = new Date(ep.airDate + 'T00:00:00');
              const aired = airDate <= today;
              const isWatched = watched.includes(ep.id);
              return (
                <div
                  key={ep.id}
                  ref={el => { episodeRefs.current[ep.id] = el; }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                    aired ? 'bg-surface-1' : 'bg-surface-0',
                    !aired && 'opacity-40'
                  )}
                >
                  <button
                    disabled={!aired}
                    onClick={() => toggleWatched(show.id, ep.id)}
                    className={cn(
                      'flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all',
                      isWatched
                        ? cn(PLATFORM_COLORS[show.platform], 'border-transparent')
                        : 'border-muted-foreground/30 hover:border-muted-foreground/60',
                      !aired && 'cursor-not-allowed'
                    )}
                  >
                    {isWatched && (
                      <svg className="h-3 w-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', isWatched && 'line-through text-muted-foreground')}>
                      E{ep.episode}{ep.title ? ` — ${ep.title}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(airDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  {!aired && (
                    <span className="text-[10px] text-muted-foreground font-medium">UPCOMING</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetailPanel;
