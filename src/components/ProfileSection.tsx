import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TMDB_TOKEN = import.meta.env.VITE_PUBLIC_TMDB_TOKEN as string;
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const POPULAR_SHOW_IDS = [
  1399, 1396, 66732, 76479, 94997, 93405,
  84958, 71912, 60735, 1418, 63174, 82856,
];

const ProfileSection = () => {
  const { user, profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [posters, setPosters] = useState<string[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url ?? '');

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setSelectedAvatar(profile?.avatar_url ?? '');
  }, [profile]);

  useEffect(() => {
    if (!TMDB_TOKEN) return;
    const fetchPosters = async () => {
      const urls: string[] = [];
      await Promise.all(
        POPULAR_SHOW_IDS.map(async (id) => {
          try {
            const res = await fetch(`https://api.themoviedb.org/3/tv/${id}`, {
              headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.poster_path) urls.push(`${TMDB_IMG}${data.poster_path}`);
          } catch {}
        })
      );
      setPosters(urls);
    };
    fetchPosters();
  }, []);

  if (!user) return null;

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    const { error } = await updateProfile({ display_name: displayName.trim() });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save name', variant: 'destructive', duration: 3000 });
    } else {
      toast({ title: '✓ Display name updated', duration: 2000 });
    }
  };

  const handleSelectAvatar = async (url: string) => {
    setSelectedAvatar(url);
    const { error } = await updateProfile({ avatar_url: url });
    if (error) {
      toast({ title: 'Failed to save avatar', variant: 'destructive', duration: 3000 });
    } else {
      toast({ title: '✓ Avatar updated', duration: 2000 });
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Profile
      </h2>
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        {/* Avatar preview */}
        <div className="flex items-center gap-3">
          {selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt="Avatar"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-transparent bg-gradient-to-r from-purple-500 to-pink-500 p-[2px]"
              style={{ borderRadius: '9999px' }}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{profile?.display_name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Display Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="flex-1 rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your name"
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !displayName.trim() || displayName.trim() === profile?.display_name}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Avatar grid */}
        {posters.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Choose an Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {posters.map((url) => {
                const isSelected = selectedAvatar === url;
                return (
                  <button
                    key={url}
                    onClick={() => handleSelectAvatar(url)}
                    className={`relative h-12 w-12 rounded-full overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-card'
                        : 'hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-1 hover:ring-offset-card'
                    }`}
                  >
                    <img src={url} alt="Avatar option" className="h-full w-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfileSection;
