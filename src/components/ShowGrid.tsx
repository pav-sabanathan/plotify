import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShows } from '@/context/ShowsContext';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import FallbackPoster from './FallbackPoster';
import EditShowModal from './EditShowModal';
import { Pause, Play, Trash2, Tv, CalendarPlus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_BORDER_COLORS, PLATFORM_COLORS, TrackedShow } from '@/types/show';
import { downloadICS } from '@/lib/icsExport';
import { trackEvent } from '@/lib/posthog';
import { sortByName } from '@/lib/sortShows';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MOCK_SHOW_DATABASE } from '@/data/mockShowDatabase';

const isPlaceholder = (poster: string) => !poster || poster === '/placeholder.svg';

const getDisplayStatus = (show: TrackedShow) => {
  if (show.releaseType === 'full-season' && show.status !== 'ended') {
    return 'full-season' as const;
  }
  return show.status;
};

const PLATFORM_TEXT: Record<string, string> = {
  netflix: 'text-platform-netflix',
  disney: 'text-platform-disney',
  apple: 'text-platform-apple',
  prime: 'text-platform-prime',
  bbc: 'text-platform-bbc',
  manual: 'text-platform-manual',
};

const mockShowIds = new Set(MOCK_SHOW_DATABASE.map(s => s.id));

const ShowGrid = () => {
  const { shows, removeShow, togglePause, watchedEpisodes, openDetail } = useShows();
  const navigate = useNavigate();
  const [editingShow, setEditingShow] = useState<TrackedShow | null>(null);

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <Tv className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold mb-1">No shows added yet</h2>
        <p className="text-sm text-muted-foreground mb-6">Your tracked shows will appear here</p>
        <button
          onClick={() => navigate('/add')}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold bg-platform-manual text-foreground hover:opacity-90 transition-opacity"
        >
          Add a Show
        </button>
      </div>
    );
  }

  const sorted = sortByName(shows);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {sorted.map((show, i) => {
        const watched = watchedEpisodes[show.id] || [];
        const totalEps = show.episodes.length;
        const watchedCount = watched.length;
        const progress = totalEps > 0 ? (watchedCount / totalEps) * 100 : 0;

        return (
          <div
            key={show.id}
            className={cn(
              'group relative rounded-xl overflow-hidden bg-card border transition-all hover:scale-[1.02] animate-fade-in',
              PLATFORM_BORDER_COLORS[show.platform],
              'border-opacity-30',
              show.paused && 'opacity-50'
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Clickable poster */}
            <button
              onClick={() => openDetail({ showId: show.id })}
              className="w-full aspect-[2/3] overflow-hidden block cursor-pointer"
            >
              {isPlaceholder(show.poster) ? (
                <FallbackPoster name={show.name} platform={show.platform} className="w-full h-full" />
              ) : (
                <img src={show.poster} alt={show.name} className="w-full h-full object-cover" loading="lazy" />
              )}
            </button>

            <div className="p-3 space-y-2">
              <p className="font-semibold text-sm truncate">{show.name}</p>
              <div className="flex flex-wrap gap-1.5">
                <PlatformBadge platform={show.platform} />
                <StatusBadge status={getDisplayStatus(show)} />
              </div>

              {/* Progress indicator */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground">{watchedCount}/{totalEps}</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', PLATFORM_COLORS[show.platform])}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => togglePause(show.id)}
                  className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground hover:bg-accent transition-colors"
                  title={show.paused ? 'Resume' : 'Pause'}
                >
                  {show.paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {show.paused ? 'Resume' : 'Pause'}
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => downloadICS(show)}
                      className="rounded-md bg-secondary p-1 hover:bg-accent transition-colors text-white"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Export to calendar</TooltipContent>
                </Tooltip>
                {!mockShowIds.has(show.id) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setEditingShow(show)}
                        className="rounded-md bg-secondary p-1 hover:bg-accent transition-colors text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit show</TooltipContent>
                  </Tooltip>
                )}
                <button
                  onClick={() => removeShow(show.id)}
                  className="rounded-md bg-destructive/10 p-1 text-destructive hover:bg-destructive/20 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {editingShow && (
        <EditShowModal show={editingShow} onClose={() => setEditingShow(null)} />
      )}
    </div>
  );
};

export default ShowGrid;
