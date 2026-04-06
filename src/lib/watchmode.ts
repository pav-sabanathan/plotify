const WATCHMODE_KEY = import.meta.env.VITE_PUBLIC_WATCHMODE_KEY as string;

interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  region: string;
  web_url: string;
}

const PLATFORM_MAP: Record<string, string> = {
  'Netflix': 'netflix',
  'Disney+': 'disney',
  'Disney Plus': 'disney',
  'Apple TV+': 'apple',
  'Apple TV Plus': 'apple',
  'Amazon Prime Video': 'prime',
  'Prime Video': 'prime',
  'BBC iPlayer': 'bbc',
  'Crave': 'suggested-crave',
  'Paramount+': 'suggested-paramount',
  'Paramount Plus': 'suggested-paramount',
  'HBO Max': 'suggested-max',
  'Max': 'suggested-max',
  'Crunchyroll': 'suggested-crunchyroll',
  'Peacock': 'suggested-peacock',
  'Peacock Premium': 'suggested-peacock',
  'BritBox': 'suggested-britbox',
};

const PLATFORM_DISPLAY: Record<string, string> = {
  'netflix': 'Netflix',
  'disney': 'Disney+',
  'apple': 'Apple TV+',
  'prime': 'Prime Video',
  'bbc': 'BBC iPlayer',
  'suggested-crave': 'Crave',
  'suggested-paramount': 'Paramount+',
  'suggested-max': 'Max',
  'suggested-crunchyroll': 'Crunchyroll',
  'suggested-peacock': 'Peacock',
  'suggested-britbox': 'BritBox',
};

export interface StreamingSuggestion {
  platformKey: string;
  platformName: string;
}

export async function fetchStreamingAvailability(
  tmdbId: number,
  region: string = 'CA'
): Promise<StreamingSuggestion | null> {
  if (!WATCHMODE_KEY) return null;
  try {
    const res = await fetch(
      `https://api.watchmode.com/v1/title/tv-${tmdbId}/sources/?apiKey=${WATCHMODE_KEY}&regions=${region}`
    );
    if (!res.ok) return null;
    const sources: WatchmodeSource[] = await res.json();
    if (!Array.isArray(sources) || sources.length === 0) return null;

    // Find the first subscription-type source that maps to a known platform
    const sub = sources.find(s => s.type === 'sub' && PLATFORM_MAP[s.name]);
    const match = sub || sources.find(s => PLATFORM_MAP[s.name]);
    if (!match) return null;

    const platformKey = PLATFORM_MAP[match.name];
    return {
      platformKey,
      platformName: PLATFORM_DISPLAY[platformKey] || match.name,
    };
  } catch {
    return null;
  }
}
