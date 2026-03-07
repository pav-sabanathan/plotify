import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import { TrackedShow, Platform, PLATFORM_LABELS } from '@/types/show';
import { Search, Plus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import PlatformBadge from './PlatformBadge';

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
    platform: 'manual' as Platform,
    releaseDay: 1,
    releaseTime: '20:00',
    season: 1,
    episode: 1,
  });

  const filtered = query.trim().length > 0
    ? MOCK_RESULTS.filter(r =>
        r.name.toLowerCase().includes(query.toLowerCase()) &&
        !shows.some(s => s.id === r.id)
      )
    : [];

  const handleTrack = (result: Omit<TrackedShow, 'paused'>) => {
    addShow({ ...result, paused: false });
    setQuery('');
  };

  const handleManualAdd = () => {
    if (!manualForm.name.trim()) return;
    const id = manualForm.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const episodes = Array.from({ length: 10 }, (_, i) => ({
      id: `s${manualForm.season}e${manualForm.episode + i}`,
      season: manualForm.season,
      episode: manualForm.episode + i,
      title: `Episode ${manualForm.episode + i}`,
      airDate: format(addDays(new Date(), i * 7), 'yyyy-MM-dd'),
    }));
    addShow({
      id,
      name: manualForm.name,
      poster: '/placeholder.svg',
      platform: manualForm.platform,
      status: 'ongoing',
      releaseType: 'weekly',
      paused: false,
      releaseDay: manualForm.releaseDay,
      releaseTime: manualForm.releaseTime,
      episodes,
    });
    setManualForm({ name: '', platform: 'manual', releaseDay: 1, releaseTime: '20:00', season: 1, episode: 1 });
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

      {query.trim().length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No results found. Try the manual entry below.
        </p>
      )}

      {/* Manual entry */}
      <button
        onClick={() => setShowManual(!showManual)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2"
      >
        <Plus className="h-4 w-4" />
        Add Manually
      </button>

      {showManual && (
        <div className="rounded-xl bg-card border p-4 space-y-3 animate-fade-in">
          <input
            type="text"
            value={manualForm.name}
            onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
            placeholder="Show name"
            className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={manualForm.platform}
            onChange={e => setManualForm({ ...manualForm, platform: e.target.value as Platform })}
            className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Release Day</label>
              <select
                value={manualForm.releaseDay}
                onChange={e => setManualForm({ ...manualForm, releaseDay: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Current Episode</label>
              <input
                type="number"
                min={1}
                value={manualForm.episode}
                onChange={e => setManualForm({ ...manualForm, episode: Number(e.target.value) })}
                className="w-full rounded-lg bg-surface-2 border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button
            onClick={handleManualAdd}
            disabled={!manualForm.name.trim()}
            className="w-full rounded-lg bg-platform-manual text-white py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Add Show
          </button>
        </div>
      )}
    </div>
  );
};

export default AddShowSearch;
