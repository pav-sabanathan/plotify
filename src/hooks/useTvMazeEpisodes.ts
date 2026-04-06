import { useEffect, useState } from 'react';
import { Episode } from '@/types/show';

interface TvMazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
}

async function searchTvMazeShow(name: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

async function fetchAllEpisodes(tvMazeId: number): Promise<TvMazeEpisode[]> {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${tvMazeId}/episodes`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function useTvMazeEpisodes(showName: string | undefined, season: number) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSeasons, setTotalSeasons] = useState(1);

  useEffect(() => {
    if (!showName) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      const tvMazeId = await searchTvMazeShow(showName);
      if (cancelled) return;

      if (!tvMazeId) {
        setEpisodes([]);
        setLoading(false);
        return;
      }

      const allEps = await fetchAllEpisodes(tvMazeId);
      if (cancelled) return;

      // Determine total seasons
      const maxSeason = allEps.reduce((max, ep) => Math.max(max, ep.season), 1);
      setTotalSeasons(maxSeason);

      // Filter to requested season
      const seasonEps = allEps
        .filter(ep => ep.season === season)
        .map(ep => ({
          id: `s${ep.season}e${ep.number}`,
          season: ep.season,
          episode: ep.number,
          title: ep.name || undefined,
          airDate: ep.airdate || '', // empty string means no date
        }));

      setEpisodes(seasonEps);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [showName, season]);

  return { episodes, loading, totalSeasons };
}
