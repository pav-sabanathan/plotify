import { useState, useEffect, useRef, useCallback } from 'react';
import { useShows } from '@/context/ShowsContext';
import { useCustomServices } from '@/context/CustomServicesContext';
import { TrackedShow, Platform, PLATFORM_LABELS } from '@/types/show';
import { Search, Plus, XCircle, Loader2, ArrowLeft, Film } from 'lucide-react';
import PlatformBadge from './PlatformBadge';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/posthog';
import { fetchStreamingAvailability, StreamingSuggestion } from '@/lib/watchmode';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TMDB_TOKEN = import.meta.env.VITE_PUBLIC_TMDB_TOKEN as string;
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

interface TmdbResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date?: string;
}

const EMPTY_MANUAL_FORM = {
  name: '', platform: '' as Platform | '', releaseDay: 1, releaseTime: '20:00',
  firstEpisodeDate: '', season: '', episode: '', totalEpisodes: '',
};

async function searchTmdb(query: string): Promise<TmdbResult[]> {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&page=1`,
    { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, 'Content-Type': 'application/json' } },
  );
  if (!res.ok) throw new Error('TMDb request failed');
  const data = await res.json();
  return (data.results as TmdbResult[]).slice(0, 8);
}

async function fetchTvMazeSchedule(title: string): Promise<{ day?: number; time?: string }> {
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(title)}`);
    if (!res.ok) return {};
    const results = await res.json();
    if (!results.length) return {};
    const schedule = results[0]?.show?.schedule;
    if (!schedule) return {};
    const dayStr = schedule.days?.[0];
    const time = schedule.time || undefined;
    const dayIndex = dayStr ? DAY_NAMES.findIndex(d => d.toLowerCase() === dayStr.toLowerCase()) : undefined;
    return { day: dayIndex !== undefined && dayIndex >= 0 ? dayIndex : undefined, time };
  } catch {
    return {};
  }
}

const AddShowSearch = () => {
  const { shows, addShow, addShowFormRef } = useShows();
  const { services: customServices } = useCustomServices();
  const [query, setQuery] = useState(addShowFormRef.current.query);
  const [showManual, setShowManual] = useState(addShowFormRef.current.showManual);
  const [manualForm, setManualForm] = useState(addShowFormRef.current.manualForm);
  const [errors, setErrors] = useState<{ name?: string; platform?: string; firstEpisodeDate?: string; totalEpisodes?: string }>({});

  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    addShowFormRef.current = { query, showManual, manualForm };
  }, [query, showManual, manualForm, addShowFormRef]);

  // Debounced TMDb search
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError(null);
      try {
        const r = await searchTmdb(q.trim());
        setResults(r);
        trackEvent('show_searched');
      } catch {
        setResults([]);
        setSearchError('Search unavailable. You can still add your show manually.');
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    doSearch(val);
  };

  // Watchmode streaming suggestion state
  const [streamingSuggestion, setStreamingSuggestion] = useState<StreamingSuggestion | null>(null);
  const [lastAddedShow, setLastAddedShow] = useState<{ id: string; name: string } | null>(null);

  const handleSelectTmdb = async (result: TmdbResult) => {
    if (shows.some(s => s.name.toLowerCase() === result.name.toLowerCase())) {
      toast({ title: `${result.name} is already in your watchlist`, variant: 'destructive', className: 'bg-amber-600/90 border-amber-500 text-foreground', duration: 3000 });
      return;
    }

    // Fetch TVMaze schedule data
    const schedule = await fetchTvMazeSchedule(result.name);

    const id = `tmdb-${result.id}-${Date.now()}`;
    const posterUrl = result.poster_path ? `${TMDB_IMG_BASE}/w500${result.poster_path}` : '/placeholder.svg';

    const tracked: TrackedShow = {
      id,
      name: result.name,
      poster: posterUrl,
      platform: 'manual' as Platform,
      status: 'ongoing',
      releaseType: 'weekly',
      paused: false,
      releaseDay: schedule.day ?? 1,
      releaseTime: schedule.time || '20:00',
      episodes: [],
    };

    addShow(tracked);
    trackEvent('show_added_search', { platform: 'tmdb', tmdb_id: result.id });
    toast({ title: `✓ ${result.name} added to your watchlist`, className: 'bg-platform-prime/90 border-platform-prime text-foreground', duration: 2000 });

    // Fetch streaming suggestion in background
    setStreamingSuggestion(null);
    setLastAddedShow({ id, name: result.name });
    fetchStreamingAvailability(result.id).then(suggestion => {
      if (suggestion) setStreamingSuggestion(suggestion);
    });

    setQuery('');
    setResults([]);
  };

  const validateField = (field: 'name' | 'platform' | 'firstEpisodeDate' | 'totalEpisodes') => {
    const newErrors = { ...errors };
    if (field === 'name') newErrors.name = manualForm.name.trim() ? undefined : 'Please enter a show name';
    if (field === 'platform') newErrors.platform = manualForm.platform ? undefined : 'Please select a platform';
    if (field === 'firstEpisodeDate') newErrors.firstEpisodeDate = manualForm.firstEpisodeDate ? undefined : 'Please select the first episode date';
    if (field === 'totalEpisodes') newErrors.totalEpisodes = manualForm.totalEpisodes ? undefined : 'Please enter the total number of episodes';
    setErrors(newErrors);
  };

  const handleManualAdd = () => {
    const newErrors: typeof errors = {};
    if (!manualForm.name.trim()) newErrors.name = 'Please enter a show name';
    if (!manualForm.platform) newErrors.platform = 'Please select a platform';
    if (!manualForm.firstEpisodeDate) newErrors.firstEpisodeDate = 'Please select the first episode date';
    if (!manualForm.totalEpisodes) newErrors.totalEpisodes = 'Please enter the total number of episodes';
    if (Object.values(newErrors).some(Boolean)) { setErrors(newErrors); return; }

    if (shows.some(s => s.name.toLowerCase() === manualForm.name.trim().toLowerCase())) {
      toast({ title: `${manualForm.name.trim()} is already in your watchlist`, variant: 'destructive', className: 'bg-amber-600/90 border-amber-500 text-foreground', duration: 3000 });
      return;
    }

    const id = manualForm.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const seasonNum = manualForm.season === '' ? 1 : parseInt(manualForm.season, 10) || 1;
    const episodeNum = manualForm.episode === '' ? 1 : parseInt(manualForm.episode, 10) || 1;
    const totalEps = parseInt(manualForm.totalEpisodes, 10) || 10;
    const firstDate = new Date(manualForm.firstEpisodeDate + 'T00:00:00');

    const episodes = Array.from({ length: totalEps }, (_, i) => {
      const epDate = new Date(firstDate);
      epDate.setDate(firstDate.getDate() + i * 7);
      const year = epDate.getFullYear();
      const month = String(epDate.getMonth() + 1).padStart(2, '0');
      const day = String(epDate.getDate()).padStart(2, '0');
      return { id: `s${seasonNum}e${episodeNum + i}`, season: seasonNum, episode: episodeNum + i, title: `Episode ${episodeNum + i}`, airDate: `${year}-${month}-${day}` };
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const finalEpDate = new Date(firstDate); finalEpDate.setDate(firstDate.getDate() + (totalEps - 1) * 7);
    const status = finalEpDate < today ? 'season-complete' : 'ongoing';
    const showName = manualForm.name.trim();

    addShow({
      id, name: showName, poster: '/placeholder.svg', platform: manualForm.platform as Platform,
      status, releaseType: 'weekly', paused: false, releaseDay: manualForm.releaseDay,
      releaseTime: manualForm.releaseTime, firstEpisodeDate: manualForm.firstEpisodeDate, totalEpisodes: totalEps, episodes,
    });
    trackEvent('show_added_manual', { platform: manualForm.platform as string });
    toast({ title: `✓ ${showName} added to your watchlist`, className: 'bg-platform-prime/90 border-platform-prime text-foreground', duration: 2000 });
    setManualForm({ ...EMPTY_MANUAL_FORM }); setErrors({}); setShowManual(false);
  };

  return (
    <div className="space-y-4">
      {!showManual ? (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
            <input
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Start typing a show name..."
              className="w-full rounded-xl bg-card border border-border pl-10 pr-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* TMDb attribution */}
          <p className="text-xs text-muted-foreground/50 text-center">
            Powered by{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">
              TMDB
            </a>
          </p>

          {/* Error state */}
          {searchError && (
            <p className="text-sm text-muted-foreground text-center py-4">{searchError}</p>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2 animate-fade-in">
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleSelectTmdb(result)}
                  className="flex items-center gap-3 rounded-lg bg-card border border-border p-3 w-full text-left hover:bg-accent/50 transition-colors"
                >
                  {result.poster_path ? (
                    <img
                      src={`${TMDB_IMG_BASE}/w92${result.poster_path}`}
                      alt={result.name}
                      className="w-12 h-[72px] rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-[72px] rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Film className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{result.name}</p>
                    {result.first_air_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {result.first_air_date.slice(0, 4)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 3 && !loading && !searchError && results.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center animate-fade-in">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium mb-1">No shows found.</p>
              <p className="text-xs text-muted-foreground">Try a different search or add manually.</p>
            </div>
          )}

          {/* Manual fallback link */}
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2"
          >
            <Plus className="h-4 w-4" />
            Can't find your show? Add it manually
          </button>
        </>
      ) : (
        /* Manual entry form */
        <div className="rounded-xl bg-card border p-4 space-y-3 animate-fade-in relative overflow-hidden box-border">
          <button
            onClick={() => { setShowManual(false); setManualForm({ ...EMPTY_MANUAL_FORM }); setErrors({}); }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss manual form"
          >
            <XCircle className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowManual(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to search
          </button>

          {/* Name */}
          <div>
            <input type="text" value={manualForm.name} onChange={e => { setManualForm({ ...manualForm, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }} onBlur={() => validateField('name')} placeholder="Show name" className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-transparent'}`} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Platform */}
          <div>
            <select value={manualForm.platform} onChange={e => { setManualForm({ ...manualForm, platform: e.target.value as Platform }); if (errors.platform) setErrors(prev => ({ ...prev, platform: undefined })); }} onBlur={() => validateField('platform')} className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.platform ? 'border-destructive' : 'border-transparent'}`}>
              <option value="">Select platform...</option>
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              {customServices.length > 0 && (<optgroup label="My Platforms">{customServices.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}</optgroup>)}
            </select>
            {errors.platform && <p className="text-xs text-destructive mt-1">{errors.platform}</p>}
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="text-xs text-muted-foreground">Release Day</label>
              <select value={manualForm.releaseDay} onChange={e => setManualForm({ ...manualForm, releaseDay: Number(e.target.value) })} className="w-full rounded-lg bg-surface-2 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px' }}>
                {DAY_NAMES.map((d, i) => (<option key={i} value={i}>{d}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Release Time</label>
              <input type="time" value={manualForm.releaseTime} onChange={e => setManualForm({ ...manualForm, releaseTime: e.target.value })} className="w-full rounded-lg bg-surface-2 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring" style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px', WebkitAppearance: 'none', appearance: 'none' as const }} />
            </div>
          </div>

          {/* First Episode Date */}
          <div>
            <label className="text-xs text-muted-foreground">First Episode Date</label>
            <input type="date" value={manualForm.firstEpisodeDate} onChange={e => { const val = e.target.value; const newDay = val ? new Date(val + 'T00:00:00').getDay() : 1; setManualForm({ ...manualForm, firstEpisodeDate: val, releaseDay: newDay }); if (errors.firstEpisodeDate) setErrors(prev => ({ ...prev, firstEpisodeDate: undefined })); }} onBlur={() => validateField('firstEpisodeDate')} className={`w-full rounded-lg bg-surface-2 border text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.firstEpisodeDate ? 'border-destructive' : 'border-transparent'}`} style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px', WebkitAppearance: 'none', appearance: 'none' as const }} />
            {manualForm.firstEpisodeDate && (<p className="text-xs text-muted-foreground mt-1">{(() => { const [y, m, d] = manualForm.firstEpisodeDate.split('-'); return `${d}-${m}-${y}`; })()}</p>)}
            {errors.firstEpisodeDate && <p className="text-xs text-destructive mt-1">{errors.firstEpisodeDate}</p>}
          </div>

          {/* Season / Episode */}
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="text-xs text-muted-foreground">Season</label>
              <input type="text" inputMode="numeric" value={manualForm.season} onChange={e => setManualForm({ ...manualForm, season: e.target.value.replace(/[^0-9]/g, '') })} placeholder="1" className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Episode</label>
              <input type="text" inputMode="numeric" value={manualForm.episode} onChange={e => setManualForm({ ...manualForm, episode: e.target.value.replace(/[^0-9]/g, '') })} placeholder="1" className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {/* Total Episodes */}
          <div>
            <label className="text-xs text-muted-foreground">Total Episodes</label>
            <input type="text" inputMode="numeric" value={manualForm.totalEpisodes} onChange={e => { setManualForm({ ...manualForm, totalEpisodes: e.target.value.replace(/[^0-9]/g, '') }); if (errors.totalEpisodes) setErrors(prev => ({ ...prev, totalEpisodes: undefined })); }} onBlur={() => validateField('totalEpisodes')} placeholder="e.g. 8" className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.totalEpisodes ? 'border-destructive' : 'border-transparent'}`} />
            {errors.totalEpisodes && <p className="text-xs text-destructive mt-1">{errors.totalEpisodes}</p>}
          </div>

          <button onClick={handleManualAdd} className="w-full rounded-lg bg-platform-manual text-foreground py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
            Add Show
          </button>
        </div>
      )}
    </div>
  );
};

export default AddShowSearch;
