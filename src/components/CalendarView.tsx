import { useMemo, useState, useEffect } from 'react';
import { useShows } from '@/context/ShowsContext';
import { useCustomServices } from '@/context/CustomServicesContext';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, parseISO, isSameDay, addWeeks,
  subWeeks, addMonths, subMonths, isBefore, subDays
} from 'date-fns';
import { PLATFORM_COLORS } from '@/types/show';
import { isBuiltInPlatform, getPlatformColor, getPlatformContrastClass } from '@/lib/platformUtils';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { searchTvMazeShow, fetchAllEpisodes } from '@/hooks/useTvMazeEpisodes';

type CalendarMode = 'week' | 'month';

interface CalendarEvent {
  showId: string;
  showName: string;
  poster: string;
  platform: string;
  season: number;
  episode: number;
  episodeId: string;
  episodeTitle?: string;
  airDate: string;
  isFullSeason: boolean;
  isPast: boolean;
}

interface TvMazeCache {
  [showName: string]: { season: number; episode: number; airDate: string; title?: string }[];
}

const CalendarView = () => {
  const { shows, openDetail } = useShows();
  const { services: customServices } = useCustomServices();
  const [mode, setMode] = useState<CalendarMode>(() => {
    const saved = sessionStorage.getItem('plotify-calendar-mode');
    return (saved === 'month' || saved === 'week') ? saved : 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tvMazeData, setTvMazeData] = useState<TvMazeCache>({});
  const [tvMazeLoading, setTvMazeLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const showPastEpisodes = localStorage.getItem('plotify-show-past-episodes') === 'true';
  const thirtyDaysAgo = subDays(today, 30);

  // Fetch TVMaze episodes for all active shows
  const activeShows = useMemo(() => shows.filter(s => !s.paused), [shows]);

  useEffect(() => {
    if (activeShows.length === 0) return;

    let cancelled = false;
    const fetchAll = async () => {
      setTvMazeLoading(true);
      const cache: TvMazeCache = {};

      for (const show of activeShows) {
        if (cancelled) return;
        // Skip if already cached
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
            .filter(ep => ep.airdate) // only episodes with real dates
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
        setTvMazeLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [activeShows.map(s => s.id).join(',')]);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    activeShows.forEach(show => {
      // Use TVMaze data if available, otherwise fall back to stored episodes
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
        // For full-season, group by season and show earliest date
        const seasonMap = new Map<number, typeof episodes[0]>();
        episodes.forEach(ep => {
          if (!ep.airDate) return;
          if (!seasonMap.has(ep.season) || ep.airDate < seasonMap.get(ep.season)!.airDate) {
            seasonMap.set(ep.season, ep);
          }
        });
        seasonMap.forEach((ep) => {
          const isPast = isBefore(parseISO(ep.airDate), today);
          if (isPast && !showPastEpisodes) return;
          if (isPast && isBefore(parseISO(ep.airDate), thirtyDaysAgo)) return;
          allEvents.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: ep.season,
            episode: ep.episode,
            episodeId: ep.id,
            episodeTitle: ep.title,
            airDate: ep.airDate,
            isFullSeason: true,
            isPast,
          });
        });
      } else {
        episodes.forEach(ep => {
          if (!ep.airDate) return;
          const isPast = isBefore(parseISO(ep.airDate), today);
          if (isPast && !showPastEpisodes) return;
          if (isPast && isBefore(parseISO(ep.airDate), thirtyDaysAgo)) return;
          allEvents.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: ep.season,
            episode: ep.episode,
            episodeId: ep.id,
            episodeTitle: ep.title,
            airDate: ep.airDate,
            isFullSeason: false,
            isPast,
          });
        });
      }
    });
    return allEvents;
  }, [activeShows, tvMazeData, today, showPastEpisodes]);

  const days = useMemo(() => {
    if (mode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      });
    }
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    });
  }, [mode, currentDate]);

  const navigate = (dir: 'prev' | 'next') => {
    if (mode === 'week') {
      setCurrentDate(dir === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(dir === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const getEventsForDay = (day: Date) => events.filter(e => isSameDay(parseISO(e.airDate), day));

  const headerLabel = mode === 'week'
    ? `${format(days[0], 'MMM d')} — ${format(days[days.length - 1], 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold tracking-tight">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = mode === 'week' ? 'month' : 'week';
              setMode(next);
              sessionStorage.setItem('plotify-calendar-mode', next);
            }}
            className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
          >
            {mode === 'week' ? 'Month' : 'Week'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <button onClick={() => navigate('prev')} className="p-1 rounded-md hover:bg-accent transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">{headerLabel}</span>
        <button onClick={() => navigate('next')} className="p-1 rounded-md hover:bg-accent transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className={cn(
        'grid gap-px bg-border rounded-lg overflow-hidden',
        'grid-cols-7'
      )}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="bg-surface-1 px-1 py-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {mode === 'month' && (() => {
          const firstDay = days[0].getDay();
          const offset = firstDay === 0 ? 6 : firstDay - 1;
          return Array.from({ length: offset }, (_, i) => (
            <div key={`empty-${i}`} className="bg-surface-0 min-h-[80px]" />
          ));
        })()}

        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'bg-surface-0 min-h-[80px] p-1.5 space-y-1',
                mode === 'month' && 'min-h-[90px]'
              )}
            >
              <span className={cn(
                'text-xs font-medium',
                isToday ? 'text-foreground bg-foreground/10 rounded-full px-1.5 py-0.5' : 'text-muted-foreground'
              )}>
                {format(day, 'd')}
              </span>
              {dayEvents.map((event, i) => {
                const builtIn = isBuiltInPlatform(event.platform);
                const bgClass = builtIn ? PLATFORM_COLORS[event.platform as keyof typeof PLATFORM_COLORS] : undefined;
                const customColor = !builtIn ? getPlatformColor(event.platform, customServices) : null;
                const contrastClass = getPlatformContrastClass(event.platform, customServices);
                return (
                  <button
                    key={`${event.showId}-${event.episode}-${i}`}
                    onClick={() => openDetail({ showId: event.showId, highlightEpisodeId: event.episodeId })}
                    className={cn(
                      'w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate block transition-opacity hover:opacity-80',
                      bgClass,
                      contrastClass,
                      event.isPast && 'opacity-40'
                    )}
                    style={customColor ? { backgroundColor: customColor } : undefined}
                  >
                    {event.showName} {event.isFullSeason ? `S${event.season}` : `S${event.season}E${event.episode}`}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
