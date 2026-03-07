import { useMemo, useRef, useState, useEffect } from 'react';
import { useShows } from '@/context/ShowsContext';
import { differenceInDays, isAfter, isToday, parseISO } from 'date-fns';
import { PLATFORM_BORDER_COLORS } from '@/types/show';
import PlatformBadge from './PlatformBadge';
import FallbackPoster from './FallbackPoster';
import { cn } from '@/lib/utils';

const isPlaceholder = (poster: string) => !poster || poster === '/placeholder.svg';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UpcomingEpisode {
  showId: string;
  showName: string;
  poster: string;
  platform: string;
  season: number;
  episode: number;
  episodeTitle?: string;
  airDate: string;
  isFullSeason: boolean;
  totalEpisodes: number;
}

const UpNextStrip = () => {
  const { shows } = useShows();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items: UpcomingEpisode[] = [];

    shows.filter(s => !s.paused).forEach(show => {
      if (show.releaseType === 'full-season') {
        const firstEp = show.episodes[0];
        if (firstEp && !isAfter(today, parseISO(firstEp.airDate))) {
          items.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: firstEp.season,
            episode: firstEp.episode,
            airDate: firstEp.airDate,
            isFullSeason: true,
            totalEpisodes: show.episodes.length,
          });
        }
      } else {
        const nextEp = show.episodes.find(ep => {
          const epDate = parseISO(ep.airDate);
          epDate.setHours(0, 0, 0, 0);
          return epDate >= today;
        });
        if (nextEp) {
          items.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: nextEp.season,
            episode: nextEp.episode,
            episodeTitle: nextEp.title,
            airDate: nextEp.airDate,
            isFullSeason: false,
            totalEpisodes: 1,
          });
        }
      }
    });

    return items
      .sort((a, b) => parseISO(a.airDate).getTime() - parseISO(b.airDate).getTime())
      .slice(0, 5);
  }, [shows]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [upcoming]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -270 : 270, behavior: 'smooth' });
  };

  const getDaysLabel = (dateStr: string) => {
    const days = differenceInDays(parseISO(dateStr), new Date());
    if (days < 0) return 'Aired';
    if (days === 0 || isToday(parseISO(dateStr))) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  if (upcoming.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground">
        No upcoming episodes. Add some shows to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="px-1 text-lg font-semibold tracking-tight">Up Next</h2>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background/90 to-transparent rounded-l-lg transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background/90 to-transparent rounded-r-lg transition-opacity"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {upcoming.map((item, i) => (
            <div
              key={`${item.showId}-${i}`}
              className={cn(
                'flex-shrink-0 w-[260px] rounded-lg bg-card border overflow-hidden animate-fade-in',
                PLATFORM_BORDER_COLORS[item.platform as keyof typeof PLATFORM_BORDER_COLORS],
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex gap-3 p-3">
                <img
                  src={item.poster}
                  alt={item.showName}
                  className="w-16 h-24 rounded-md object-cover flex-shrink-0"
                />
                <div className="flex flex-col justify-between min-w-0 flex-1">
                  <div>
                    <p className="font-semibold text-sm truncate">{item.showName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.isFullSeason
                        ? `S${item.season} — All Episodes`
                        : `S${item.season} E${item.episode}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <PlatformBadge platform={item.platform as any} />
                    <span className="text-xs font-medium text-foreground/80">
                      {getDaysLabel(item.airDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpNextStrip;
