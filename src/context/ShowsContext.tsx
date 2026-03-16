import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { TrackedShow, Platform } from '@/types/show';

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

// watched episodes stored as { [showId]: string[] } where strings are episode ids
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
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

const migrateShow = (s: TrackedShow): TrackedShow => {
  const migrated = { ...s };
  if (!migrated.totalEpisodes) migrated.totalEpisodes = 10;
  if (!migrated.firstEpisodeDate) {
    const today = new Date();
    migrated.firstEpisodeDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  // Check season completion
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

const loadShows = (): TrackedShow[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    try { return (JSON.parse(stored) as TrackedShow[]).map(migrateShow); } catch { return []; }
  }
  return [];
};

const loadWatched = (): WatchedMap => {
  const stored = localStorage.getItem(WATCHED_KEY);
  if (stored !== null) {
    try { return JSON.parse(stored); } catch { return {}; }
  }
  return {};
};

export const ShowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<TrackedShow[]>(loadShows);
  const [watchedEpisodes, setWatchedEpisodes] = useState<WatchedMap>(loadWatched);
  const [detailTarget, setDetailTarget] = useState<ShowDetailTarget | null>(null);
  const addShowFormRef = useRef<AddShowFormState>({ ...DEFAULT_ADD_FORM });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
  }, [shows]);

  useEffect(() => {
    localStorage.setItem(WATCHED_KEY, JSON.stringify(watchedEpisodes));
  }, [watchedEpisodes]);

  const addShow = useCallback((show: TrackedShow) => {
    setShows(prev => [...prev, show]);
  }, []);

  const removeShow = useCallback((id: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
    setWatchedEpisodes(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateShow = useCallback((id: string, updates: Partial<TrackedShow>) => {
    setShows(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const togglePause = useCallback((id: string) => {
    setShows(prev => prev.map(s => s.id === id ? { ...s, paused: !s.paused } : s));
  }, []);

  const toggleWatched = useCallback((showId: string, episodeId: string) => {
    setWatchedEpisodes(prev => {
      const current = prev[showId] || [];
      const has = current.includes(episodeId);
      return { ...prev, [showId]: has ? current.filter(e => e !== episodeId) : [...current, episodeId] };
    });
  }, []);

  const markAllWatched = useCallback((showId: string) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const airedIds = show.episodes
      .filter(ep => new Date(ep.airDate + 'T00:00:00') <= today)
      .map(ep => ep.id);
    setWatchedEpisodes(prev => ({ ...prev, [showId]: airedIds }));
  }, [shows]);

  const openDetail = useCallback((target: ShowDetailTarget) => setDetailTarget(target), []);
  const closeDetail = useCallback(() => setDetailTarget(null), []);

  return (
    <ShowsContext.Provider value={{
      shows, addShow, removeShow, updateShow, togglePause, addShowFormRef,
      watchedEpisodes, toggleWatched, markAllWatched,
      detailTarget, openDetail, closeDetail,
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
