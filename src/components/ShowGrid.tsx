import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShows } from '@/context/ShowsContext';
import { useCustomServices } from '@/context/CustomServicesContext';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import FallbackPoster from './FallbackPoster';
import EditShowModal from './EditShowModal';
import { Pause, Play, Trash2, Tv, CalendarPlus, Pencil, Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLATFORM_BORDER_COLORS, PLATFORM_COLORS, TrackedShow } from '@/types/show';
import { isBuiltInPlatform, getPlatformColor, getPlatformLabel } from '@/lib/platformUtils';
import { downloadICS } from '@/lib/icsExport';
import { trackEvent } from '@/lib/posthog';
import { sortKey } from '@/lib/sortShows';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const isPlaceholder = (poster: string) => !poster || poster === '/placeholder.svg';

const getDisplayStatus = (show: TrackedShow) => {
  if (show.releaseType === 'full-season' && show.status !== 'ended') {
    return 'full-season' as const;
  }
  return show.status;
};

type SortOption = 'recent' | 'az' | 'za';
type StatusFilter = 'all' | 'ongoing' | 'ended' | 'paused';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'ended', label: 'Ended' },
  { value: 'paused', label: 'Paused' },
];

const ShowGrid = () => {
  const { shows, removeShow, togglePause, watchedEpisodes, openDetail } = useShows();
  const { services: customServices } = useCustomServices();
  const navigate = useNavigate();
  const [editingShow, setEditingShow] = useState<TrackedShow | null>(null);
  const [deletingShow, setDeletingShow] = useState<TrackedShow | null>(null);

  // Filter & sort state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Derive unique platforms from user's tracked shows
  const platforms = useMemo(() => {
    const seen = new Map<string, string>();
    shows.forEach(s => {
      if (!seen.has(s.platform)) {
        seen.set(s.platform, getPlatformLabel(s.platform, customServices));
      }
    });
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [shows, customServices]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...shows];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === 'paused') {
      result = result.filter(s => s.paused);
    } else if (statusFilter === 'ongoing') {
      result = result.filter(s => !s.paused && (s.status === 'ongoing' || s.status === 'upcoming'));
    } else if (statusFilter === 'ended') {
      result = result.filter(s => !s.paused && (s.status === 'ended' || s.status === 'season-complete'));
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter(s => s.platform === platformFilter);
    }

    // Sort
    if (sortBy === 'az') {
      result.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)));
    } else if (sortBy === 'za') {
      result.sort((a, b) => sortKey(b.name).localeCompare(sortKey(a.name)));
    }
    // 'recent' keeps the original order (most recently added first, which is the default from context)

    return result;
  }, [shows, search, statusFilter, platformFilter, sortBy]);

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
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your shows…"
          className="w-full rounded-lg bg-secondary border border-border pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter & sort row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status pills */}
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              statusFilter === opt.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Platform dropdown */}
        {platforms.length > 1 && (
          <div className="relative">
            <select
              value={platformFilter}
              onChange={e => setPlatformFilter(e.target.value)}
              className="appearance-none rounded-full bg-secondary border border-border pl-3 pr-7 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Platforms</option>
              {platforms.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="appearance-none rounded-full bg-secondary border border-border pl-3 pr-7 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Show grid or empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No shows match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((show, i) => {
            const watched = watchedEpisodes[show.id] || [];
            const totalEps = show.totalEpisodes || show.episodes.length;
            const watchedCount = watched.length;
            const builtIn = isBuiltInPlatform(show.platform);
            const customColor = !builtIn ? getPlatformColor(show.platform, customServices) : null;
            const borderClass = builtIn ? PLATFORM_BORDER_COLORS[show.platform] : undefined;

            return (
              <div
                key={show.id}
                className={cn(
                  'group relative rounded-xl overflow-hidden bg-card border transition-all hover:scale-[1.02] animate-fade-in cursor-pointer',
                  borderClass,
                  'border-opacity-30',
                  show.paused && 'opacity-50'
                )}
                style={customColor ? { borderColor: customColor + '4D' } : undefined}
                onClick={() => openDetail({ showId: show.id })}
              >
                <div className="w-full aspect-[2/3] overflow-hidden">
                  {isPlaceholder(show.poster) ? (
                    <FallbackPoster name={show.name} platform={show.platform} className="w-full h-full" customServices={customServices} />
                  ) : (
                    <img src={show.poster} alt={show.name} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <p className="font-semibold text-sm truncate">{show.name}</p>
                  <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <PlatformBadge platform={show.platform} />
                    <StatusBadge status={getDisplayStatus(show)} />
                  </div>

                  <span className="text-[10px] text-muted-foreground">
                    {watchedCount} watched · Season {show.episodes[0]?.season ?? 1}
                  </span>

                  <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
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
                          onClick={() => { downloadICS(show); trackEvent('ics_exported', { platform: show.platform }); }}
                          className="rounded-md bg-secondary p-1 hover:bg-accent transition-colors text-white"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Export to calendar</TooltipContent>
                    </Tooltip>
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
                    <button
                      onClick={() => setDeletingShow(show)}
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
        </div>
      )}

      {editingShow && (
        <EditShowModal show={editingShow} onClose={() => setEditingShow(null)} />
      )}

      <AlertDialog open={!!deletingShow} onOpenChange={(open) => { if (!open) setDeletingShow(null); }}>
        <AlertDialogContent className="bg-[hsl(var(--card))] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Show?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to remove <span className="text-foreground font-medium">{deletingShow?.name}</span> from your watchlist? This will also delete your watch progress for this show.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingShow) { removeShow(deletingShow.id); setDeletingShow(null); } }}
            >
              Remove Show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShowGrid;
