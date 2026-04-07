import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShows } from '@/context/ShowsContext';
import { supabase } from '@/integrations/supabase/client';

const TMDB_TOKEN = import.meta.env.VITE_PUBLIC_TMDB_TOKEN as string;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DISMISS_KEY = 'plotify-season-dismissed';

export interface NewSeasonAlert {
  showId: string;
  showName: string;
  currentSeason: number;
  newSeason: number;
}

function getDismissed(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setDismissedStorage(showId: string, season: number) {
  const d = getDismissed();
  d[showId] = season;
  localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
}

export function useNewSeasonCheck() {
  const { user } = useAuth();
  const { shows } = useShows();
  const [alerts, setAlerts] = useState<NewSeasonAlert[]>([]);
  const runningRef = useRef(false);
  const updatedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!user || !TMDB_TOKEN || shows.length === 0) return;
    if (runningRef.current) return;

    const checkShows = async () => {
      runningRef.current = true;
      const now = Date.now();
      const dismissed = getDismissed();
      const newAlerts: NewSeasonAlert[] = [];

      for (const show of shows) {
        // Skip shows we just updated this session
        if (updatedIdsRef.current.has(show.id)) continue;

        const tmdbIdMatch = show.id.match(/^tmdb-(\d+)-/);
        if (!tmdbIdMatch) continue;
        const tmdbId = parseInt(tmdbIdMatch[1], 10);

        try {
          const { data: dbShow } = await supabase
            .from('shows')
            .select('last_checked_at, season')
            .eq('id', show.id)
            .eq('user_id', user.id)
            .single();

          if (dbShow?.last_checked_at) {
            const lastChecked = new Date(dbShow.last_checked_at).getTime();
            if (now - lastChecked < ONE_DAY_MS) continue;
          }

          const currentSeason = dbShow?.season ?? 1;

          const res = await fetch(
            `https://api.themoviedb.org/3/tv/${tmdbId}`,
            { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
          );
          if (!res.ok) continue;
          const data = await res.json();
          const tmdbSeasons = data.number_of_seasons;

          // Update last_checked_at
          await supabase
            .from('shows')
            .update({ last_checked_at: new Date().toISOString() } as any)
            .eq('id', show.id)
            .eq('user_id', user.id);

          if (tmdbSeasons && tmdbSeasons > currentSeason) {
            // Skip if this season was already dismissed
            if (dismissed[show.id] === tmdbSeasons) continue;

            newAlerts.push({
              showId: show.id,
              showName: show.name,
              currentSeason,
              newSeason: tmdbSeasons,
            });
          }
        } catch {
          // Skip silently
        }
      }

      runningRef.current = false;

      if (newAlerts.length > 0) {
        setAlerts(prev => {
          const existingIds = new Set(prev.map(a => a.showId));
          const fresh = newAlerts.filter(a => !existingIds.has(a.showId));
          return [...prev, ...fresh];
        });
      }
    };

    checkShows();
  }, [user, shows]);

  const handleUpdate = useCallback(async (alert: NewSeasonAlert) => {
    // Mark as updated immediately to prevent re-check
    updatedIdsRef.current.add(alert.showId);
    // Remove alert from UI first
    setAlerts(prev => prev.filter(a => a.showId !== alert.showId));

    if (user) {
      // Update season, episode, and last_checked_at atomically in Supabase
      await supabase
        .from('shows')
        .update({
          season: alert.newSeason,
          current_episode: 1,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', alert.showId)
        .eq('user_id', user.id);
    }
  }, [user]);

  const handleDismiss = useCallback((showId: string) => {
    const alert = alerts.find(a => a.showId === showId);
    if (alert) {
      setDismissedStorage(showId, alert.newSeason);
    }
    setAlerts(prev => prev.filter(a => a.showId !== showId));
  }, [alerts]);

  return { alerts, handleUpdate, handleDismiss };
}
