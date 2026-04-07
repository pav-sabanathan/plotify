/**
 * Maps platform identifiers and names to public SVG logo files.
 * Each entry specifies whether a CSS filter is needed to render white on dark backgrounds.
 */

export interface PlatformLogoInfo {
  src: string;
  /** True = logo has no colour, needs `filter: brightness(0) invert(1)` to appear white */
  needsInvert: boolean;
}

const LOGO_MAP: Record<string, PlatformLogoInfo> = {
  netflix:       { src: '/netflix.svg',       needsInvert: true },
  apple:         { src: '/appletv.svg',       needsInvert: true },
  prime:         { src: '/primevideo.svg',     needsInvert: true },
  bbc:           { src: '/bbciplayer.svg',     needsInvert: true },
  disney:        { src: '/disney.svg',        needsInvert: false },
  peacock:       { src: '/peacock.svg',        needsInvert: false },
  britbox:       { src: '/britbox.svg',        needsInvert: false },
  crave:         { src: '/crave.svg',          needsInvert: false },
  crunchyroll:   { src: '/crunchyroll.svg',   needsInvert: true },
  hbomax:        { src: '/hbomax.svg',        needsInvert: true },
  itvx:          { src: '/itvx.svg',          needsInvert: true },
  paramountplus: { src: '/paramountplus.svg', needsInvert: true },
  sky:           { src: '/sky.svg',           needsInvert: true },
  channel4:      { src: '/channel4.svg',      needsInvert: true },
  nowtv:         { src: '/nowtv.svg',         needsInvert: true },
};

/** Normalised name → LOGO_MAP key */
const NAME_ALIASES: Record<string, string> = {
  'netflix': 'netflix',
  'apple tv+': 'apple',
  'apple tv': 'apple',
  'prime video': 'prime',
  'amazon prime': 'prime',
  'amazon prime video': 'prime',
  'disney+': 'disney',
  'disney plus': 'disney',
  'bbc iplayer': 'bbc',
  'bbc': 'bbc',
  'paramount+': 'paramountplus',
  'paramount plus': 'paramountplus',
  'hbo max': 'hbomax',
  'max': 'hbomax',
  'max / hbo max': 'hbomax',
  'crunchyroll': 'crunchyroll',
  'crunchyroll premium': 'crunchyroll',
  'sky': 'sky',
  'now tv': 'nowtv',
  'now': 'nowtv',
  'channel 4': 'channel4',
  'channel4': 'channel4',
  'itvx': 'itvx',
  'itv': 'itvx',
  'peacock': 'peacock',
  'britbox': 'britbox',
  'crave': 'crave',
  'manual': undefined as unknown as string, // no logo for manual
};

/**
 * Resolve a platform key or display name to logo info.
 * Accepts built-in keys (e.g. "netflix"), suggested service names (e.g. "Paramount+"),
 * or custom service names that happen to match a known platform.
 */
export function getPlatformLogo(platformKeyOrName: string): PlatformLogoInfo | null {
  // Direct key match
  if (LOGO_MAP[platformKeyOrName]) return LOGO_MAP[platformKeyOrName];

  // Name-based alias match (case-insensitive)
  const normalised = platformKeyOrName.toLowerCase().trim();
  const aliasKey = NAME_ALIASES[normalised];
  if (aliasKey && LOGO_MAP[aliasKey]) return LOGO_MAP[aliasKey];

  return null;
}
