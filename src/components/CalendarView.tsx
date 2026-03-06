import { useMemo, useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, format, parseISO, isSameDay, addWeeks,
  subWeeks, addMonths, subMonths, isAfter, isBefore
} from 'date-fns';
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/show';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import PlatformBadge from './PlatformBadge';

type CalendarMode = 'week' | 'month';

interface CalendarEvent {
  showId: string;
  showName: string;
  poster: string;
  platform: string;
  season: number;
  episode: number;
  episodeTitle?: string;
  airDate: string;
  isFullSeason: boolean;
  isPast: boolean;
}

const CalendarView = () => {
  const { shows } = useShows();
  const [mode, setMode] = useState<CalendarMode>(() => {
    const saved = sessionStorage.getItem('streamline-calendar-mode');
    return (saved === 'month' || saved === 'week') ? saved : 'week';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];
    shows.filter(s => !s.paused).forEach(show => {
      if (show.releaseType === 'full-season') {
        const firstEp = show.episodes[0];
        if (firstEp) {
          allEvents.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: firstEp.season,
            episode: firstEp.episode,
            episodeTitle: firstEp.title,
            airDate: firstEp.airDate,
            isFullSeason: true,
            isPast: isBefore(parseISO(firstEp.airDate), today),
          });
        }
      } else {
        show.episodes.forEach(ep => {
          allEvents.push({
            showId: show.id,
            showName: show.name,
            poster: show.poster,
            platform: show.platform,
            season: ep.season,
            episode: ep.episode,
            episodeTitle: ep.title,
            airDate: ep.airDate,
            isFullSeason: false,
            isPast: isBefore(parseISO(ep.airDate), today),
          });
        });
      }
    });
    return allEvents;
  }, [shows, today]);

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
              sessionStorage.setItem('streamline-calendar-mode', next);
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
        mode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
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
              {dayEvents.map((event, i) => (
                <button
                  key={`${event.showId}-${event.episode}-${i}`}
                  onClick={() => setSelectedEvent(event)}
                  className={cn(
                    'w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium truncate block transition-opacity',
                    PLATFORM_COLORS[event.platform as keyof typeof PLATFORM_COLORS],
                    event.platform === 'apple' ? 'text-primary-foreground' : 'text-foreground',
                    event.isPast && 'opacity-40'
                  )}
                >
                  {event.showName} {event.isFullSeason ? `S${event.season}` : `S${event.season}E${event.episode}`}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Detail card overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-card border rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3">
                <img src={selectedEvent.poster} alt={selectedEvent.showName} className="w-14 h-20 rounded-md object-cover" />
                <div>
                  <h3 className="font-semibold text-base">{selectedEvent.showName}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedEvent.isFullSeason
                      ? `Season ${selectedEvent.season} — All Episodes`
                      : `Season ${selectedEvent.season}, Episode ${selectedEvent.episode}`}
                  </p>
                  {selectedEvent.episodeTitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">"{selectedEvent.episodeTitle}"</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <PlatformBadge platform={selectedEvent.platform as any} />
              <span className="text-xs text-muted-foreground">
                {format(parseISO(selectedEvent.airDate), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
