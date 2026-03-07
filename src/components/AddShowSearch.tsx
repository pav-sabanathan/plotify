import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import { TrackedShow, Platform, PLATFORM_LABELS } from '@/types/show';
import { Search, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import PlatformBadge from './PlatformBadge';
import { toast } from '@/hooks/use-toast';

// Mock search results for demo
const MOCK_RESULTS: Omit<TrackedShow, 'paused'>[] = [
  {
    id: 'severance',
    name: 'Severance',
    poster: 'https://image.tmdb.org/t/p/w200/pAzRkqLnJsMjnE2I3OaRkfvQeo0.jpg',
    platform: 'apple',
    status: 'ongoing',
    releaseType: 'weekly',
    releaseDay: 5,
    releaseTime: '00:00',
    episodes: Array.from({ length: 10 }, (_, i) => ({
      id: `s2e${i + 1}`,
      season: 2,
      episode: i + 1,
      title: `Episode ${i + 1}`,
      airDate: format(addDays(new Date(), (i - 3) * 7), 'yyyy-MM-dd'),
    })),
  },
  {
    id: 'squid-game',
    name: 'Squid Game',
    poster: 'https://image.tmdb.org/t/p/w200/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    platform: 'netflix',
    status: 'upcoming',
    releaseType: 'full-season',
    episodes: Array.from({ length: 7 }, (_, i) => ({
      id: `s3e${i + 1}`,
      season: 3,
      episode: i + 1,
      title: `Episode ${i + 1}`,
      airDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    })),
  },
  {
    id: 'andor',
    name: 'Andor',
    poster: 'https://image.tmdb.org/t/p/w200/59SVNwLfoMnZPPB6ukW6dlPxAdI.jpg',
    platform: 'disney',
    status: 'upcoming',
    releaseType: 'weekly',
    releaseDay: 3,
    releaseTime: '02:00',
    episodes: Array.from({ length: 12 }, (_, i) => ({
      id: `s2e${i + 1}`,
      season: 2,
      episode: i + 1,
      title: `Episode ${i + 1}`,
      airDate: format(addDays(new Date(), (i + 2) * 7), 'yyyy-MM-dd'),
    })),
  },
];

const AddShowSearch = () => {
  const { shows, addShow } = useShows();
  const [query, setQuery] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    platform: '' as Platform | '',
    releaseDay: 1,
    releaseTime: '20:00',
    season: '' as string,
    episode: '' as string,
  });
  const [errors, setErrors] = useState<{ name?: string; platform?: string }>({});

  const filtered = query.trim().length > 0
    ? MOCK_RESULTS.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) &&
        !shows.some(s => s.id === r.id)
      )
    : [];

  const handleTrack = (result: Omit<TrackedShow, 'paused'>) => {
    // Check duplicate by name
    if (shows.some(s => s.name.toLowerCase() === result.name.toLowerCase())) {
      toast({
        title: `${result.name} is already in your watchlist`,
        variant: 'destructive',
        className: 'bg-amber-600/90 border-amber-500 text-foreground',
        duration: 3000,
      });
      return;
    }
    addShow({ ...result, paused: false });
    toast({
      title: `✓ ${result.name} added to your watchlist`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    setQuery('');
  };

  const validateField = (field: 'name' | 'platform') => {
    const newErrors = { ...errors };
    if (field === 'name') {
      newErrors.name = manualForm.name.trim() ? undefined : 'Please enter a show name';
    }
    if (field === 'platform') {
      newErrors.platform = manualForm.platform ? undefined : 'Please select a platform';
    }
    setErrors(newErrors);
  };

  const handleManualAdd = () => {
    const newErrors: { name?: string; platform?: string } = {};
    if (!manualForm.name.trim()) newErrors.name = 'Please enter a show name';
    if (!manualForm.platform) newErrors.platform = 'Please select a platform';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check duplicate by name
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
    // Find the next occurrence of the selected weekday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = today.getDay();
    let daysUntilRelease = manualForm.releaseDay - currentDay;
    if (daysUntilRelease < 0) daysUntilRelease += 7;
    if (daysUntilRelease === 0) daysUntilRelease = 0; // Today is the release day

    const seasonNum = manualForm.season === '' ? 1 : parseInt(manualForm.season, 10) || 1;
    const episodeNum = manualForm.episode === '' ? 1 : parseInt(manualForm.episode, 10) || 1;

    const episodes = Array.from({ length: 10 }, (_, i) => {
      const epDate = new Date(today);
      epDate.setDate(today.getDate() + daysUntilRelease + i * 7);
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
    const showName = manualForm.name.trim();
    addShow({
      id,
      name: showName,
      poster: '/placeholder.svg',
      platform: manualForm.platform as Platform,
      status: 'ongoing',
      releaseType: 'weekly',
      paused: false,
      releaseDay: manualForm.releaseDay,
      releaseTime: manualForm.releaseTime,
      episodes,
    });
    toast({
      title: `✓ ${showName} added to your watchlist`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    setManualForm({ name: '', platform: '', releaseDay: 1, releaseTime: '20:00', season: 1, episode: 1 });
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
              <img src={result.poster} alt={result.name} className="w-12 h-18 rounded-md object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{result.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <PlatformBadge platform={result.platform} />
                  <span className="text-xs text-muted-foreground capitalize">{result.status}</span>
                </div>
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
      {query.trim().length > 0 && filtered.length === 0 && (
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
        <div className="rounded-xl bg-card border p-4 space-y-3 animate-fade-in">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Release Day</label>
              <select
                value={manualForm.releaseDay}
                onChange={e => setManualForm({ ...manualForm, releaseDay: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Season</label>
              <input
                type="number"
                min={1}
                value={manualForm.season}
                onChange={e => setManualForm({ ...manualForm, season: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Episode</label>
              <input
                type="number"
                min={1}
                value={manualForm.episode}
                onChange={e => setManualForm({ ...manualForm, episode: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
