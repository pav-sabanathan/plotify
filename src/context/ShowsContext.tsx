import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { TrackedShow, Platform } from '@/types/show';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { subscribeToUserRealtime } from '@/lib/userRealtime';

const STORAGE_KEY = 'plotify-shows';
const WATCHED_KEY = 'plotify-watched';

export interface AddShowFormState {
  query: string;
  showManual: boolean;
  manualForm: {
    name: string;
    platform: Platform | '';
    releaseDay: number;
    releaseTime: string;
    firstEpisodeDate: string;
    season: string;
    episode: string;
    totalEpisodes: string;
  };
}

const DEFAULT_ADD_FORM: AddShowFormState = {
  query: '',
  showManual: false,
  manualForm: { name: '', platform: '', releaseDay: 1, releaseTime: '20:00', firstEpisodeDate: '', season: '', episode: '', totalEpisodes: '' },
};

type WatchedMap = Record<string, string[]>;

export interface ShowDetailTarget {
  showId: string;
  highlightEpisodeId?: string;
}

interface ShowsContextType {
  shows: TrackedShow[];
  addShow: (show: TrackedShow) => void;
  removeShow: (id: string) => void;
  updateShow: (id: string, updates: Partial<TrackedShow>) => void;
  togglePause: (id: string) => void;
  addShowFormRef: React.MutableRefObject<AddShowFormState>;
  watchedEpisodes: WatchedMap;
  toggleWatched: (showId: string, episodeId: string) => void;
  markAllWatched: (showId: string) => void;
  detailTarget: ShowDetailTarget | null;
  openDetail: (target: ShowDetailTarget) => void;
  closeDetail: () => void;
  loading: boolean;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

const migrateShow = (s: TrackedShow): TrackedShow => {
  const migrated = { ...s };
  if (!migrated.totalEpisodes) migrated.totalEpisodes = 10;
  if (!migrated.firstEpisodeDate) {
    const today = new Date();
    migrated.firstEpisodeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  if (migrated.releaseType === 'weekly' && migrated.totalEpisodes && migrated.firstEpisodeDate) {
    const start = new Date(migrated.firstEpisodeDate + 'T00:00:00');
    const finalEpDate = new Date(start);
    finalEpDate.setDate(start.getDate() + (migrated.totalEpisodes - 1) * 7);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (finalEpDate < now && migrated.status !== 'ended') {
      migrated.status = 'season-complete';
    }
  }
  return migrated;
};

const loadShowsFromStorage = (): TrackedShow[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    try { return (JSON.parse(stored) as TrackedShow[]).map(migrateShow); } catch { return []; }
  }
  return [];
};

const loadWatchedFromStorage = (): WatchedMap => {
  const stored = localStorage.getItem(WATCHED_KEY);
  if (stored !== null) {
    try { return JSON.parse(stored); } catch { return {}; }
  }
  return {};
};

// Convert Supabase row to TrackedShow
function dbRowToShow(row: any): TrackedShow {
  const seasonNum = row.season ?? 1;
  const currentEp = row.current_episode ?? 1;
  const totalEps = row.total_episodes ?? 10;
  const firstDate = row.first_episode_date;
  const releaseType = row.release_type === 'full-season' ? 'full-season' : 'weekly';

  let episodes: TrackedShow['episodes'] = [];
  if (firstDate && totalEps) {
    const start = new Date(firstDate + 'T00:00:00');
    episodes = Array.from({ length: totalEps }, (_, i) => {
      const epDate = new Date(start);
      epDate.setDate(start.getDate() + (releaseType === 'weekly' ? i * 7 : 0));
      const year = epDate.getFullYear();
      const month = String(epDate.getMonth() + 1).padStart(2, '0');
      const day = String(epDate.getDate()).padStart(2, '0');
      return {
        id: `s${seasonNum}e${currentEp + i}`,
        season: seasonNum,
        episode: currentEp + i,
        title: `Episode ${currentEp + i}`,
        airDate: `${year}-${month}-${day}`,
      };
    });
  }

  const show: TrackedShow = {
    id: row.id,
    name: row.title,
    poster: row.poster_url || '/placeholder.svg',
    platform: row.platform as Platform,
    status: row.status as TrackedShow['status'],
    releaseType,
    paused: row.is_paused ?? false,
    releaseDay: row.release_day != null ? parseInt(row.release_day, 10) : undefined,
    releaseTime: row.release_time ?? undefined,
    firstEpisodeDate: firstDate ?? undefined,
    totalEpisodes: totalEps,
    episodes,
  };
  return migrateShow(show);
}

// Convert TrackedShow to Supabase row for insert/update
function showToDbRow(show: TrackedShow, userId: string) {
  return {
    id: show.id,
    user_id: userId,
    title: show.name,
    platform: show.platform,
    status: show.status,
    poster_url: show.poster === '/placeholder.svg' ? null : show.poster,
    release_day: show.releaseDay != null ? String(show.releaseDay) : null,
    release_time: show.releaseTime ?? null,
    season: show.episodes[0]?.season ?? 1,
    current_episode: show.episodes[0]?.episode ?? 1,
    is_paused: show.paused,
    is_full_season_drop: show.releaseType === 'full-season',
    first_episode_date: show.firstEpisodeDate ?? null,
    total_episodes: show.totalEpisodes ?? null,
    release_type: show.releaseType ?? 'weekly',
    tmdb_id: null as number | null,
  };
}

// Convert WatchedMap to watch_progress rows
function watchedToDbRows(watched: WatchedMap, userId: string) {
  const rows: { show_id: string; user_id: string; season: number; episode: number; watched: boolean }[] = [];
  for (const [showId, epIds] of Object.entries(watched)) {
    for (const epId of epIds) {
      const match = epId.match(/^s(\d+)e(\d+)$/);
      if (match) {
        rows.push({
          show_id: showId,
          user_id: userId,
          season: parseInt(match[1], 10),
          episode: parseInt(match[2], 10),
          watched: true,
        });
      }
    }
  }
  return rows;
}

// Convert watch_progress DB rows to WatchedMap
function dbWatchedToMap(rows: any[]): WatchedMap {
  const map: WatchedMap = {};
  for (const row of rows) {
    if (!row.watched) continue;
    const key = row.show_id;
    const epId = `s${row.season}e${row.episode}`;
    if (!map[key]) map[key] = [];
    map[key].push(epId);
  }
  return map;
}

export const ShowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shows, setShows] = useState<TrackedShow[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<WatchedMap>({});
  const [detailTarget, setDetailTarget] = useState<ShowDetailTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const addShowFormRef = useRef<AddShowFormState>({ ...DEFAULT_ADD_FORM });
  const isGuest = !user;
  const initializedRef = useRef(false);

  // Load data on mount or auth change
  useEffect(() => {
    initializedRef.current = false;
    if (isGuest) {
      setShows(loadShowsFromStorage());
      setWatchedEpisodes(loadWatchedFromStorage());
      setLoading(false);
      initializedRef.current = true;
    } else {
      const loadFromSupabase = async () => {
        setLoading(true);
        try {
          const [showsRes, watchedRes] = await Promise.all([
            supabase.from('shows').select('*').eq('user_id', user.id),
            supabase.from('watch_progress').select('*').eq('user_id', user.id),
          ]);
          if (showsRes.data) {
            setShows(showsRes.data.map(dbRowToShow));
          }
          if (watchedRes.data) {
            setWatchedEpisodes(dbWatchedToMap(watchedRes.data));
          }
        } catch (e) {
          console.error('Failed to load from Supabase:', e);
        } finally {
          setLoading(false);
          initializedRef.current = true;
        }
      };
      loadFromSupabase();
    }
  }, [user, isGuest]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (isGuest && initializedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
    }
  }, [shows, isGuest]);

  useEffect(() => {
    if (isGuest && initializedRef.current) {
      localStorage.setItem(WATCHED_KEY, JSON.stringify(watchedEpisodes));
    }
  }, [watchedEpisodes, isGuest]);

  // Realtime subscription for authenticated users
  useEffect(() => {
    if (isGuest || !user) return;

    return subscribeToUserRealtime(user.id, {
      onShowsChange: async () => {
        const { data } = await supabase.from('shows').select('*').eq('user_id', user.id);
        if (data) setShows(data.map(dbRowToShow));
      },
      onWatchProgressChange: async () => {
        const { data } = await supabase.from('watch_progress').select('*').eq('user_id', user.id);
        if (data) setWatchedEpisodes(dbWatchedToMap(data));
      },
    });
  }, [user, isGuest]);

  const addShow = useCallback(async (show: TrackedShow) => {
    setShows(prev => [...prev, show]);
    if (user) {
      const row = showToDbRow(show, user.id);
      await supabase.from('shows').insert(row as any);
    }
  }, [user]);

  const removeShow = useCallback(async (id: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
    setWatchedEpisodes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (user) {
      await Promise.all([
        supabase.from('watch_progress').delete().eq('show_id', id).eq('user_id', user.id),
        supabase.from('shows').delete().eq('id', id).eq('user_id', user.id),
      ]);
    }
  }, [user]);

  const updateShow = useCallback(async (id: string, updates: Partial<TrackedShow>) => {
    setShows(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (user) {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.title = updates.name;
      if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.poster !== undefined) dbUpdates.poster_url = updates.poster === '/placeholder.svg' ? null : updates.poster;
      if (updates.releaseDay !== undefined) dbUpdates.release_day = String(updates.releaseDay);
      if (updates.releaseTime !== undefined) dbUpdates.release_time = updates.releaseTime;
      if (updates.paused !== undefined) dbUpdates.is_paused = updates.paused;
      if (updates.releaseType !== undefined) {
        dbUpdates.is_full_season_drop = updates.releaseType === 'full-season';
        dbUpdates.release_type = updates.releaseType;
      }
      if (updates.firstEpisodeDate !== undefined) dbUpdates.first_episode_date = updates.firstEpisodeDate;
      if (updates.totalEpisodes !== undefined) dbUpdates.total_episodes = updates.totalEpisodes;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('shows').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      }
    }
  }, [user]);

  const togglePause = useCallback(async (id: string) => {
    let newPaused = false;
    setShows(prev => prev.map(s => {
      if (s.id === id) {
        newPaused = !s.paused;
        return { ...s, paused: newPaused };
      }
      return s;
    }));
    if (user) {
      // Read current value from state after toggle
      const show = shows.find(s => s.id === id);
      await supabase.from('shows').update({ is_paused: !(show?.paused ?? false) }).eq('id', id).eq('user_id', user.id);
    }
  }, [user, shows]);

  const toggleWatched = useCallback(async (showId: string, episodeId: string) => {
    let isNowWatched = false;
    setWatchedEpisodes(prev => {
      const current = prev[showId] || [];
      const has = current.includes(episodeId);
      isNowWatched = !has;
      return { ...prev, [showId]: has ? current.filter(e => e !== episodeId) : [...current, episodeId] };
    });
    if (user) {
      const match = episodeId.match(/^s(\d+)e(\d+)$/);
      if (match) {
        const season = parseInt(match[1], 10);
        const episode = parseInt(match[2], 10);
        if (isNowWatched) {
          await supabase.from('watch_progress').upsert({
            show_id: showId,
            user_id: user.id,
            season,
            episode,
            watched: true,
            watched_at: new Date().toISOString(),
          }, { onConflict: 'show_id,user_id,season,episode' }).select();
        } else {
          await supabase.from('watch_progress')
            .delete()
            .eq('show_id', showId)
            .eq('user_id', user.id)
            .eq('season', season)
            .eq('episode', episode);
        }
      }
    }
  }, [user]);

  const markAllWatched = useCallback(async (showId: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const airedIds = show.episodes
      .filter(ep => new Date(ep.airDate + 'T00:00:00') <= today)
      .map(ep => ep.id);
    setWatchedEpisodes(prev => ({ ...prev, [showId]: airedIds }));
    if (user) {
      const rows = airedIds.map(epId => {
        const match = epId.match(/^s(\d+)e(\d+)$/);
        if (!match) return null;
        return {
          show_id: showId,
          user_id: user.id,
          season: parseInt(match[1], 10),
          episode: parseInt(match[2], 10),
          watched: true,
          watched_at: new Date().toISOString(),
        };
      }).filter(Boolean);
      if (rows.length > 0) {
        // Delete existing and re-insert
        await supabase.from('watch_progress').delete().eq('show_id', showId).eq('user_id', user.id);
        await supabase.from('watch_progress').insert(rows as any);
      }
    }
  }, [shows, user]);

  const openDetail = useCallback((target: ShowDetailTarget) => setDetailTarget(target), []);
  const closeDetail = useCallback(() => setDetailTarget(null), []);

  return (
    <ShowsContext.Provider value={{
      shows, addShow, removeShow, updateShow, togglePause, addShowFormRef,
      watchedEpisodes, toggleWatched, markAllWatched,
      detailTarget, openDetail, closeDetail, loading,
    }}>
      {children}
    </ShowsContext.Provider>
  );
};

export const useShows = () => {
  const ctx = useContext(ShowsContext);
  if (!ctx) throw new Error('useShows must be used within ShowsProvider');
  return ctx;
};

// Export for import modal
export { showToDbRow, watchedToDbRows, loadShowsFromStorage, loadWatchedFromStorage, STORAGE_KEY, WATCHED_KEY };
