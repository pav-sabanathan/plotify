const WATCHMODE_KEY = import.meta.env.VITE_PUBLIC_WATCHMODE_KEY as string;

interface WatchmodeSource {
  source_id: number;
  name: string;
  type: string;
  region: string;
  web_url: string;
}

// Canonical name aliases → Plotify built-in key
const PLATFORM_MAP: Record<string, string> = {
  'netflix': 'netflix',
  'disney+': 'disney',
  'disney plus': 'disney',
  'apple tv+': 'apple',
  'apple tv plus': 'apple',
  'apple tv': 'apple',
  'amazon prime video': 'prime',
  'prime video': 'prime',
  'bbc iplayer': 'bbc',
};

// Aliases for suggested / custom platforms
const SUGGESTED_MAP: Record<string, { key: string; name: string }> = {
  'crave': { key: 'crave', name: 'Crave' },
  'paramount+': { key: 'paramount-plus', name: 'Paramount+' },
  'paramount plus': { key: 'paramount-plus', name: 'Paramount+' },
  'hbo max': { key: 'max', name: 'Max' },
  'max': { key: 'max', name: 'Max' },
  'crunchyroll': { key: 'crunchyroll', name: 'Crunchyroll' },
  'peacock': { key: 'peacock', name: 'Peacock' },
  'peacock premium': { key: 'peacock', name: 'Peacock' },
  'britbox': { key: 'britbox', name: 'BritBox' },
};

const PLATFORM_DISPLAY: Record<string, string> = {
  'netflix': 'Netflix',
  'disney': 'Disney+',
  'apple': 'Apple TV',
  'prime': 'Prime Video',
  'bbc': 'BBC iPlayer',
};

export const PLATFORM_DEFAULT_COLORS: Record<string, string> = {
  'crave': '#0057FF',
  'paramount-plus': '#0064FF',
  'max': '#5822B4',
  'crunchyroll': '#F47521',
  'peacock': '#F5C400',
  'britbox': '#00A8A8',
};

export interface StreamingSuggestion {
  platformKey: string;
  platformName: string;
}

function resolveplatform(sourceName: string): StreamingSuggestion | null {
  const lower = sourceName.toLowerCase().trim();

  // Check built-in platforms first
  const builtInKey = PLATFORM_MAP[lower];
  if (builtInKey) {
    return { platformKey: builtInKey, platformName: PLATFORM_DISPLAY[builtInKey] || sourceName };
  }

  // Check suggested/custom platforms
  const suggested = SUGGESTED_MAP[lower];
  if (suggested) {
    return { platformKey: suggested.key, platformName: suggested.name };
  }

  // No match — return the raw name as a custom platform key
  const customKey = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { platformKey: customKey, platformName: sourceName };
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

    // Prefer subscription-type sources
    const sub = sources.find(s => s.type === 'sub');
    const match = sub || sources[0];
    if (!match) return null;

    return resolveplatform(match.name);
  } catch {
    return null;
  }
}
