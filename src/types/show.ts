export type Platform = 'netflix' | 'disney' | 'apple' | 'prime' | 'bbc' | 'manual';

export type ShowStatus = 'ongoing' | 'ended' | 'upcoming' | 'season-complete';

export type ReleaseType = 'weekly' | 'full-season';

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title?: string;
  airDate: string; // ISO date string
}

export interface TrackedShow {
  id: string;
  name: string;
  poster: string;
  platform: Platform;
  status: ShowStatus;
  releaseType: ReleaseType;
  paused: boolean;
  episodes: Episode[];
  releaseDay?: number; // 0=Sun, 1=Mon...
  releaseTime?: string; // HH:mm
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  netflix: 'Netflix',
  disney: 'Disney+',
  apple: 'Apple TV',
  prime: 'Prime Video',
  bbc: 'BBC iPlayer',
  manual: 'Manual',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  netflix: 'bg-platform-netflix',
  disney: 'bg-platform-disney',
  apple: 'bg-platform-apple',
  prime: 'bg-platform-prime',
  bbc: 'bg-platform-bbc',
  manual: 'bg-platform-manual',
};

export const PLATFORM_TEXT_COLORS: Record<Platform, string> = {
  netflix: 'text-platform-netflix',
  disney: 'text-platform-disney',
  apple: 'text-platform-apple',
  prime: 'text-platform-prime',
  bbc: 'text-platform-bbc',
  manual: 'text-platform-manual',
};

export const PLATFORM_BORDER_COLORS: Record<Platform, string> = {
  netflix: 'border-platform-netflix',
  disney: 'border-platform-disney',
  apple: 'border-platform-apple',
  prime: 'border-platform-prime',
  bbc: 'border-platform-bbc',
  manual: 'border-platform-manual',
};
