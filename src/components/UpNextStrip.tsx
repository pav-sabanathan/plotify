import { useMemo } from 'react';
import { useShows } from '@/context/ShowsContext';
import { differenceInDays, isAfter, isToday, parseISO, format } from 'date-fns';
import { PLATFORM_COLORS, PLATFORM_BORDER_COLORS } from '@/types/show';
import PlatformBadge from './PlatformBadge';
import { cn } from '@/lib/utils';

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
        // Weekly: find next upcoming episode
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
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {upcoming.map((item, i) => (
          <div
            key={`${item.showId}-${i}`}
            className={cn(
              'flex-shrink-0 w-[260px] rounded-lg bg-card border overflow-hidden animate-fade-in',
              PLATFORM_BORDER_COLORS[item.platform as keyof typeof PLATFORM_BORDER_COLORS],
              'border-opacity-40'
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
  );
};

export default UpNextStrip;
