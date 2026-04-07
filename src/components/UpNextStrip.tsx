import { useMemo, useRef, useState, useEffect } from 'react';
import { useShows } from '@/context/ShowsContext';
import { useCustomServices } from '@/context/CustomServicesContext';
import { differenceInDays, isToday, parseISO, addDays, isBefore } from 'date-fns';
import { PLATFORM_BORDER_COLORS } from '@/types/show';
import { isBuiltInPlatform, getPlatformColor } from '@/lib/platformUtils';
import PlatformBadge from './PlatformBadge';
import FallbackPoster from './FallbackPoster';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { searchTvMazeShow, fetchAllEpisodes } from '@/hooks/useTvMazeEpisodes';

const isPlaceholder = (poster: string) => !poster || poster === '/placeholder.svg';

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

interface TvMazeCache {
  [showName: string]: { season: number; episode: number; airDate: string; title?: string }[];
}

const UpNextStrip = () => {
  const { shows } = useShows();
  const { services: customServices } = useCustomServices();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [tvMazeData, setTvMazeData] = useState<TvMazeCache>({});

  const activeShows = useMemo(() => shows.filter(s => !s.paused), [shows]);

  // Fetch TVMaze episodes — same logic as CalendarView
  useEffect(() => {
    if (activeShows.length === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      const cache: TvMazeCache = {};

      for (const show of activeShows) {
        if (cancelled) return;
        if (tvMazeData[show.name]) {
          cache[show.name] = tvMazeData[show.name];
          continue;
        }
        try {
          const tvMazeId = await searchTvMazeShow(show.name);
          if (cancelled) return;
          if (!tvMazeId) continue;
          const allEps = await fetchAllEpisodes(tvMazeId);
          if (cancelled) return;
          cache[show.name] = allEps
            .filter(ep => ep.airdate)
            .map(ep => ({
              season: ep.season,
              episode: ep.number,
              airDate: ep.airdate,
              title: ep.name || undefined,
            }));
        } catch {
          // skip
        }
      }

      if (!cancelled) {
        setTvMazeData(prev => ({ ...prev, ...cache }));
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [activeShows.map(s => s.id).join(',')]);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = addDays(today, 30);
    const items: UpcomingEpisode[] = [];

    activeShows.forEach(show => {
      // Use TVMaze data if available, fall back to stored episodes
      const tvEps = tvMazeData[show.name];
      const episodes = tvEps
        ? tvEps.map(ep => ({
            id: `s${ep.season}e${ep.episode}`,
            season: ep.season,
            episode: ep.episode,
            title: ep.title,
            airDate: ep.airDate,
          }))
        : show.episodes;

      if (show.releaseType === 'full-season') {
        // Group by season — find earliest episode per season within window
        const seasonMap = new Map<number, typeof episodes[0]>();
        episodes.forEach(ep => {
          if (!ep.airDate) return;
          if (!seasonMap.has(ep.season) || ep.airDate < seasonMap.get(ep.season)!.airDate) {
            seasonMap.set(ep.season, ep);
          }
        });
        seasonMap.forEach((ep) => {
          const epDate = parseISO(ep.airDate);
          if (epDate >= today && isBefore(epDate, cutoff)) {
            items.push({
              showId: show.id, showName: show.name, poster: show.poster,
              platform: show.platform, season: ep.season, episode: ep.episode,
              airDate: ep.airDate, isFullSeason: true,
              totalEpisodes: episodes.filter(e => e.season === ep.season).length,
            });
          }
        });
      } else {
        // Weekly: find next upcoming episode within 30 days
        const nextEp = episodes.find(ep => {
          if (!ep.airDate) return false;
          const epDate = parseISO(ep.airDate);
          epDate.setHours(0, 0, 0, 0);
          return epDate >= today && isBefore(epDate, cutoff);
        });
        if (nextEp) {
          items.push({
            showId: show.id, showName: show.name, poster: show.poster,
            platform: show.platform, season: nextEp.season, episode: nextEp.episode,
            episodeTitle: nextEp.title, airDate: nextEp.airDate, isFullSeason: false, totalEpisodes: 1,
          });
        }
      }
    });

    return items
      .sort((a, b) => parseISO(a.airDate).getTime() - parseISO(b.airDate).getTime())
      .slice(0, 5);
  }, [activeShows, tvMazeData]);

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
          <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background/90 to-transparent rounded-l-lg transition-opacity">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        {canScrollRight && (
          <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-2 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background/90 to-transparent rounded-r-lg transition-opacity">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {upcoming.map((item, i) => {
            const builtIn = isBuiltInPlatform(item.platform);
            const borderClass = builtIn ? PLATFORM_BORDER_COLORS[item.platform as keyof typeof PLATFORM_BORDER_COLORS] : undefined;
            const customColor = !builtIn ? getPlatformColor(item.platform, customServices) : null;

            return (
              <div
                key={`${item.showId}-${i}`}
                className={cn(
                  'flex-shrink-0 w-[260px] rounded-lg bg-card border overflow-hidden animate-fade-in',
                  borderClass,
                )}
                style={{
                  animationDelay: `${i * 60}ms`,
                  ...(customColor ? { borderColor: customColor } : {}),
                }}
              >
                <div className="flex gap-3 p-3">
                  {isPlaceholder(item.poster) ? (
                    <FallbackPoster name={item.showName} platform={item.platform} className="w-16 h-24 flex-shrink-0" customServices={customServices} />
                  ) : (
                    <img src={item.poster} alt={item.showName} className="w-16 h-24 rounded-md object-cover flex-shrink-0" />
                  )}
                  <div className="flex flex-col justify-between min-w-0 flex-1">
                    <div>
                      <p className="font-semibold text-sm truncate">{item.showName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.isFullSeason ? `S${item.season} — All Episodes` : `S${item.season} E${item.episode}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <PlatformBadge platform={item.platform} />
                      <span className="text-xs font-medium text-foreground/80">{getDaysLabel(item.airDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpNextStrip;
