import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useShows } from '@/context/ShowsContext';
import { supabase } from '@/integrations/supabase/client';

const TMDB_TOKEN = import.meta.env.VITE_PUBLIC_TMDB_TOKEN as string;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface NewSeasonAlert {
  showId: string;
  showName: string;
  currentSeason: number;
  newSeason: number;
}

export function useNewSeasonCheck() {
  const { user } = useAuth();
  const { shows, updateShow } = useShows();
  const [alerts, setAlerts] = useState<NewSeasonAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !TMDB_TOKEN || shows.length === 0) return;

    const checkShows = async () => {
      const now = Date.now();
      const newAlerts: NewSeasonAlert[] = [];

      for (const show of shows) {
        // Only check shows with a tmdb_id
        const tmdbIdMatch = show.id.match(/^tmdb-(\d+)-/);
        if (!tmdbIdMatch) continue;
        const tmdbId = parseInt(tmdbIdMatch[1], 10);

        // Throttle: check last_checked_at from DB
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

          // Fetch from TMDb
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
            newAlerts.push({
              showId: show.id,
              showName: show.name,
              currentSeason,
              newSeason: tmdbSeasons,
            });
          }
        } catch {
          // Skip silently, retry on next load
        }
      }

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
    // Update the show season and reset episode to 1
    updateShow(alert.showId, {
      episodes: [],
    });
    if (user) {
      await supabase
        .from('shows')
        .update({ season: alert.newSeason, current_episode: 1 })
        .eq('id', alert.showId)
        .eq('user_id', user.id);
    }
    setAlerts(prev => prev.filter(a => a.showId !== alert.showId));
  }, [updateShow, user]);

  const handleDismiss = useCallback((showId: string) => {
    setDismissed(prev => new Set(prev).add(showId));
    setAlerts(prev => prev.filter(a => a.showId !== showId));
  }, []);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.showId));

  return { alerts: visibleAlerts, handleUpdate, handleDismiss };
}
