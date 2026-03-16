import { useState } from 'react';
import { useShows } from '@/context/ShowsContext';
import { TrackedShow, Platform, PLATFORM_LABELS } from '@/types/show';
import { XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EditShowModalProps {
  show: TrackedShow;
  onClose: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EditShowModal = ({ show, onClose }: EditShowModalProps) => {
  const { updateShow, shows } = useShows();

  const [form, setForm] = useState({
    name: show.name,
    platform: show.platform as Platform | '',
    releaseDay: show.releaseDay ?? 1,
    releaseTime: show.releaseTime ?? '20:00',
    firstEpisodeDate: show.firstEpisodeDate ?? '',
    season: show.episodes[0]?.season?.toString() ?? '1',
    episode: show.episodes[0]?.episode?.toString() ?? '1',
    totalEpisodes: (show.totalEpisodes ?? show.episodes.length).toString(),
  });

  const [errors, setErrors] = useState<{ name?: string; platform?: string; firstEpisodeDate?: string; totalEpisodes?: string }>({});

  const validateField = (field: 'name' | 'platform' | 'firstEpisodeDate' | 'totalEpisodes') => {
    const newErrors = { ...errors };
    if (field === 'name') newErrors.name = form.name.trim() ? undefined : 'Please enter a show name';
    if (field === 'platform') newErrors.platform = form.platform ? undefined : 'Please select a platform';
    if (field === 'firstEpisodeDate') newErrors.firstEpisodeDate = form.firstEpisodeDate ? undefined : 'Please select the first episode date';
    if (field === 'totalEpisodes') newErrors.totalEpisodes = form.totalEpisodes ? undefined : 'Please enter the total number of episodes';
    setErrors(newErrors);
  };

  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = 'Please enter a show name';
    if (!form.platform) newErrors.platform = 'Please select a platform';
    if (!form.firstEpisodeDate) newErrors.firstEpisodeDate = 'Please select the first episode date';
    if (!form.totalEpisodes) newErrors.totalEpisodes = 'Please enter the total number of episodes';
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    // Check duplicate name (excluding current show)
    if (shows.some(s => s.id !== show.id && s.name.toLowerCase() === form.name.trim().toLowerCase())) {
      toast({
        title: `${form.name.trim()} is already in your watchlist`,
        variant: 'destructive',
        className: 'bg-amber-600/90 border-amber-500 text-foreground',
        duration: 3000,
      });
      return;
    }

    const seasonNum = form.season === '' ? 1 : parseInt(form.season, 10) || 1;
    const episodeNum = form.episode === '' ? 1 : parseInt(form.episode, 10) || 1;
    const totalEps = parseInt(form.totalEpisodes, 10) || 10;
    const firstDate = new Date(form.firstEpisodeDate + 'T00:00:00');

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finalEpDate = new Date(firstDate);
    finalEpDate.setDate(firstDate.getDate() + (totalEps - 1) * 7);
    const status = finalEpDate < today ? 'season-complete' : 'ongoing';

    const showName = form.name.trim();
    updateShow(show.id, {
      name: showName,
      platform: form.platform as Platform,
      status,
      releaseDay: form.releaseDay,
      releaseTime: form.releaseTime,
      firstEpisodeDate: form.firstEpisodeDate,
      totalEpisodes: totalEps,
      episodes,
    });

    toast({
      title: `✓ ${showName} updated successfully`,
      className: 'bg-platform-prime/90 border-platform-prime text-foreground',
      duration: 2000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-card border border-border p-4 space-y-3 animate-fade-in relative overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss edit form"
        >
          <XCircle className="h-5 w-5" />
        </button>

        <h2 className="text-base font-semibold pr-8">Edit Show</h2>

        {/* Name */}
        <div>
          <input
            type="text"
            value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }}
            onBlur={() => validateField('name')}
            placeholder="Show name"
            className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-transparent'}`}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Platform */}
        <div>
          <select
            value={form.platform}
            onChange={e => { setForm({ ...form, platform: e.target.value as Platform }); if (errors.platform) setErrors(prev => ({ ...prev, platform: undefined })); }}
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
              value={form.releaseDay}
              onChange={e => setForm({ ...form, releaseDay: Number(e.target.value) })}
              className="w-full rounded-lg bg-surface-2 border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px' }}
            >
              {DAY_NAMES.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Release Time</label>
            <input
              type="time"
              value={form.releaseTime}
              onChange={e => setForm({ ...form, releaseTime: e.target.value })}
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
            value={form.firstEpisodeDate}
            onChange={e => { setForm({ ...form, firstEpisodeDate: e.target.value }); if (errors.firstEpisodeDate) setErrors(prev => ({ ...prev, firstEpisodeDate: undefined })); }}
            onBlur={() => validateField('firstEpisodeDate')}
            className={`w-full rounded-lg bg-surface-2 border text-sm focus:outline-none focus:ring-2 focus:ring-ring ${errors.firstEpisodeDate ? 'border-destructive' : 'border-transparent'}`}
            style={{ height: '48px', minHeight: '48px', boxSizing: 'border-box', padding: '0 12px', WebkitAppearance: 'none', appearance: 'none' as const }}
          />
          {form.firstEpisodeDate && (
            <p className="text-xs text-muted-foreground mt-1">
              {(() => { const [y, m, d] = form.firstEpisodeDate.split('-'); return `${d}-${m}-${y}`; })()}
            </p>
          )}
          {errors.firstEpisodeDate && <p className="text-xs text-destructive mt-1">{errors.firstEpisodeDate}</p>}
        </div>

        {/* Season / Current Episode */}
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="text-xs text-muted-foreground">Season</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.season}
              onChange={e => setForm({ ...form, season: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="1"
              className="w-full rounded-lg bg-surface-2 border-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Current Episode</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.episode}
              onChange={e => setForm({ ...form, episode: e.target.value.replace(/[^0-9]/g, '') })}
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
            value={form.totalEpisodes}
            onChange={e => { setForm({ ...form, totalEpisodes: e.target.value.replace(/[^0-9]/g, '') }); if (errors.totalEpisodes) setErrors(prev => ({ ...prev, totalEpisodes: undefined })); }}
            onBlur={() => validateField('totalEpisodes')}
            placeholder="e.g. 8"
            className={`w-full rounded-lg bg-surface-2 border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.totalEpisodes ? 'border-destructive' : 'border-transparent'}`}
          />
          {errors.totalEpisodes && <p className="text-xs text-destructive mt-1">{errors.totalEpisodes}</p>}
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition-opacity text-foreground"
          style={{ backgroundColor: '#8B5CF6' }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditShowModal;
