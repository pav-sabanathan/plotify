import { useState, useEffect, useRef } from 'react';
import { useShows } from '@/context/ShowsContext';
import { TrackedShow, Platform, PLATFORM_LABELS } from '@/types/show';
import { Search, Plus, XCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import PlatformBadge from './PlatformBadge';
import FallbackPoster from './FallbackPoster';
import { toast } from '@/hooks/use-toast';
import { MOCK_SHOW_DATABASE, MockShow } from '@/data/mockShowDatabase';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function generateEpisodesFromMock(show: MockShow): TrackedShow['episodes'] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (show.releaseType === 'full-season') {
    const dropDate = show.fullSeasonDropDate
      ? new Date(show.fullSeasonDropDate + 'T00:00:00')
      : addDays(today, 14);
    const dateStr = format(dropDate, 'yyyy-MM-dd');
    return Array.from({ length: show.episodesPerSeason }, (_, i) => ({
      id: `s${show.season}e${i + 1}`,
      season: show.season,
      episode: i + 1,
      title: `Episode ${i + 1}`,
      airDate: dateStr,
    }));
  }

  const releaseDay = show.releaseDay ?? 0;
  const currentDay = today.getDay();
  let daysUntil = releaseDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;

  const startDate = addDays(today, daysUntil);
  return Array.from({ length: show.episodesPerSeason }, (_, i) => ({
    id: `s${show.season}e${i + 1}`,
    season: show.season,
    episode: i + 1,
    title: `Episode ${i + 1}`,
    airDate: format(addDays(startDate, i * 7), 'yyyy-MM-dd'),
  }));
}

function getScheduleLabel(show: MockShow): string {
  const platformLabel = PLATFORM_LABELS[show.platform];
  if (show.releaseType === 'full-season') {
    if (show.fullSeasonDropDate) {
      const d = new Date(show.fullSeasonDropDate + 'T00:00:00');
      return `Full season drop ${format(d, 'MMM d, yyyy')} on ${platformLabel}`;
    }
    return `Full season drop on ${platformLabel}`;
  }
  if (show.releaseDay !== undefined) {
    return `Every ${DAY_NAMES[show.releaseDay]} on ${platformLabel}`;
  }
  return platformLabel;
}

const EMPTY_MANUAL_FORM = { name: '', platform: '' as Platform | '', releaseDay: 1, releaseTime: '20:00', firstEpisodeDate: '', season: '', episode: '', totalEpisodes: '' };

const searchableShows = MOCK_SHOW_DATABASE.filter(s => !s.manualOnly);

const AddShowSearch = () => {
  const { shows, addShow, addShowFormRef } = useShows();
  const [query, setQuery] = useState(addShowFormRef.current.query);
  const [showManual, setShowManual] = useState(addShowFormRef.current.showManual);
  const [manualForm, setManualForm] = useState(addShowFormRef.current.manualForm);
  const [errors, setErrors] = useState<{ name?: string; platform?: string; firstEpisodeDate?: string; totalEpisodes?: string }>({});

  useEffect(() => {
    addShowFormRef.current = { query, showManual, manualForm };
  }, [query, showManual, manualForm, addShowFormRef]);

  const filtered = query.trim().length >= 2
    ? searchableShows.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) &&
        !shows.some(s => s.id === r.id)
      )
    : [];

  const handleTrack = (mock: MockShow) => {
    if (shows.some(s => s.name.toLowerCase() === mock.name.toLowerCase())) {
      toast({
        title: `${mock.name} is already in your watchlist`,
        variant: 'destructive',
        className: 'bg-amber-600/90 border-amber-500 text-foreground',
        duration: 3000,
      });
      return;
    }
    const tracked: TrackedShow = {
      id: mock.id,
      name: mock.name,
      poster: '/placeholder.svg',
      platform: mock.platform,
      status: mock.status,
      releaseType: mock.releaseType,
      paused: false,
      releaseDay: mock.releaseDay,
      releaseTime: mock.releaseTime,
      episodes: generateEpisodesFromMock(mock),
    };
    addShow(tracked);
    toast({
      title: `✓ ${mock.name} added to your watchlist`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    setQuery('');
  };

  const validateField = (field: 'name' | 'platform' | 'firstEpisodeDate' | 'totalEpisodes') => {
    const newErrors = { ...errors };
    if (field === 'name') {
      newErrors.name = manualForm.name.trim() ? undefined : 'Please enter a show name';
    }
    if (field === 'platform') {
      newErrors.platform = manualForm.platform ? undefined : 'Please select a platform';
    }
    if (field === 'firstEpisodeDate') {
      newErrors.firstEpisodeDate = manualForm.firstEpisodeDate ? undefined : 'Please select the first episode date';
    }
    if (field === 'totalEpisodes') {
      newErrors.totalEpisodes = manualForm.totalEpisodes ? undefined : 'Please enter the total number of episodes';
    }
    setErrors(newErrors);
  };

  const handleManualAdd = () => {
    const newErrors: typeof errors = {};
    if (!manualForm.name.trim()) newErrors.name = 'Please enter a show name';
    if (!manualForm.platform) newErrors.platform = 'Please select a platform';
    if (!manualForm.firstEpisodeDate) newErrors.firstEpisodeDate = 'Please select the first episode date';
    if (!manualForm.totalEpisodes) newErrors.totalEpisodes = 'Please enter the total number of episodes';
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    if (shows.some(s => s.name.toLowerCase() === manualForm.name.trim().toLowerCase())) {
      toast({
        title: `${manualForm.name.trim()} is already in your watchlist`,
        variant: 'destructive',
        className: 'bg-amber-600/90 border-amber-500 text-foreground',
        duration: 3000,
      });
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
      return {
        id: `s${seasonNum}e${episodeNum + i}`,
        season: seasonNum,
        episode: episodeNum + i,
        title: `Episode ${episodeNum + i}`,
        airDate: `${year}-${month}-${day}`,
      };
    });

    // Determine initial status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finalEpDate = new Date(firstDate);
    finalEpDate.setDate(firstDate.getDate() + (totalEps - 1) * 7);
    const status = finalEpDate < today ? 'season-complete' : 'ongoing';

    const showName = manualForm.name.trim();
    addShow({
      id,
      name: showName,
      poster: '/placeholder.svg',
      platform: manualForm.platform as Platform,
      status,
      releaseType: 'weekly',
      paused: false,
      releaseDay: manualForm.releaseDay,
      releaseTime: manualForm.releaseTime,
      firstEpisodeDate: manualForm.firstEpisodeDate,
      totalEpisodes: totalEps,
      episodes,
    });
    toast({
      title: `✓ ${showName} added to your watchlist`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    setManualForm({ ...EMPTY_MANUAL_FORM });
    setErrors({});
    setShowManual(false);
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for a TV show..."
          className="w-full rounded-xl bg-card border border-border pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Results */}
      {filtered.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {filtered.map(result => (
            <div key={result.id} className="flex items-center gap-3 rounded-lg bg-card border p-3">
              <FallbackPoster name={result.name} platform={result.platform} className="w-12 h-[72px] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{result.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <PlatformBadge platform={result.platform} />
                  <span className="text-xs text-muted-foreground capitalize">{result.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{getScheduleLabel(result)}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{result.description}</p>
              </div>
              <button
                onClick={() => handleTrack(result)}
                className="rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Track
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty search state */}
      {query.trim().length >= 2 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center animate-fade-in">
          <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium mb-1">No results for &apos;{query.trim()}&apos;</p>
          <p className="text-xs text-muted-foreground mb-4">Try a different title or add it manually</p>
          <button
            onClick={() => {
              setShowManual(true);
              setManualForm(prev => ({ ...prev, name: query.trim() }));
            }}
            className="rounded-lg bg-platform-manual text-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Add Manually
          </button>
        </div>
      )}

      {/* Manual entry toggle */}
      <button
        onClick={() => setShowManual(!showManual)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2"
      >
        <Plus className="h-4 w-4" />
        Add Manually
      </button>

      {showManual && (
        <div className="rounded-xl bg-card border p-4 space-y-3 animate-fade-in relative overflow-hidden box-border">
          <button
            onClick={() => {
              setShowManual(false);
              setManualForm({ ...EMPTY_MANUAL_FORM });
              setErrors({});
            }}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss manual form"
          >
            <XCircle className="h-5 w-5" />
          </button>
          {/* Name field */}
          <div>
            <input
              type="text"
              value={manualForm.name}
              onChange={e => {
                setManualForm({ ...manualForm, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              onBlur={() => validateField('name')}
              placeholder="Show name"
              className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-transparent'}`}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Platform field */}
          <div>
            <select
              value={manualForm.platform}
              onChange={e => {
                setManualForm({ ...manualForm, platform: e.target.value as Platform });
                if (errors.platform) setErrors(prev => ({ ...prev, platform: undefined }));
              }}
              onBlur={() => validateField('platform')}
              className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.platform ? 'border-destructive' : 'border-transparent'}`}
            >
              <option value="">Select platform...</option>
              {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            {errors.platform && <p className="text-xs text-destructive mt-1">{errors.platform}</p>}
          </div>

          {/* Release Day / Release Time */}
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="text-xs text-muted-foreground">Release Day</label>
              <select
                value={manualForm.releaseDay}
                onChange={e => setManualForm({ ...manualForm, releaseDay: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px' }}
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Release Time</label>
              <input
                type="time"
                value={manualForm.releaseTime}
                onChange={e => setManualForm({ ...manualForm, releaseTime: e.target.value })}
                className="w-full rounded-lg bg-surface-2 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px', WebkitAppearance: 'none', appearance: 'none' as const }}
              />
            </div>
          </div>

          {/* First Episode Date */}
          <div>
            <label className="text-xs text-muted-foreground">First Episode Date</label>
            <input
              type="date"
              value={manualForm.firstEpisodeDate}
              onChange={e => {
                setManualForm({ ...manualForm, firstEpisodeDate: e.target.value });
                if (errors.firstEpisodeDate) setErrors(prev => ({ ...prev, firstEpisodeDate: undefined }));
              }}
              onBlur={() => validateField('firstEpisodeDate')}
              className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.firstEpisodeDate ? 'border-destructive' : 'border-transparent'}`}
              style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box' }}
            />
            {errors.firstEpisodeDate && <p className="text-xs text-destructive mt-1">{errors.firstEpisodeDate}</p>}
          </div>

          {/* Season / Current Episode */}
          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="text-xs text-muted-foreground">Season</label>
              <input
                type="text"
                inputMode="numeric"
                value={manualForm.season}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setManualForm({ ...manualForm, season: val });
                }}
                placeholder="1"
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Episode</label>
              <input
                type="text"
                inputMode="numeric"
                value={manualForm.episode}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setManualForm({ ...manualForm, episode: val });
                }}
                placeholder="1"
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Total Episodes */}
          <div>
            <label className="text-xs text-muted-foreground">Total Episodes</label>
            <input
              type="text"
              inputMode="numeric"
              value={manualForm.totalEpisodes}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setManualForm({ ...manualForm, totalEpisodes: val });
                if (errors.totalEpisodes) setErrors(prev => ({ ...prev, totalEpisodes: undefined }));
              }}
              onBlur={() => validateField('totalEpisodes')}
              placeholder="e.g. 8"
              className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.totalEpisodes ? 'border-destructive' : 'border-transparent'}`}
            />
            {errors.totalEpisodes && <p className="text-xs text-destructive mt-1">{errors.totalEpisodes}</p>}
          </div>

          <button
            onClick={handleManualAdd}
            className="w-full rounded-lg bg-platform-manual text-foreground py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Add Show
          </button>
        </div>
      )}
    </div>
  );
};

export default AddShowSearch;
