import { useNavigate } from 'react-router-dom';
import { useShows } from '@/context/ShowsContext';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import { Pause, Play, Trash2, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_BORDER_COLORS, TrackedShow } from '@/types/show';

const getDisplayStatus = (show: TrackedShow) => {
  if (show.releaseType === 'full-season' && show.status !== 'ended') {
    return 'full-season' as const;
  }
  return show.status;
};

const ShowGrid = () => {
  const { shows, removeShow, togglePause } = useShows();
  const navigate = useNavigate();

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {shows.map((show, i) => (
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
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={show.poster}
              alt={show.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-3 space-y-2">
            <p className="font-semibold text-sm truncate">{show.name}</p>
            <div className="flex flex-wrap gap-1.5">
              <PlatformBadge platform={show.platform} />
              <StatusBadge status={getDisplayStatus(show)} />
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
      ))}
    </div>
  );
};

export default ShowGrid;
