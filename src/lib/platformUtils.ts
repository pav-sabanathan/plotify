import { CustomService } from '@/context/CustomServicesContext';
import { Platform, PLATFORM_LABELS, PLATFORM_COLORS, PLATFORM_BORDER_COLORS, PLATFORM_TEXT_COLORS } from '@/types/show';

const BUILT_IN_PLATFORMS = new Set<string>(['netflix', 'disney', 'apple', 'prime', 'bbc', 'manual']);

export function isBuiltInPlatform(platform: string): platform is Platform {
  return BUILT_IN_PLATFORMS.has(platform);
}

export function getPlatformLabel(platform: string, customServices: CustomService[]): string {
  if (isBuiltInPlatform(platform)) return PLATFORM_LABELS[platform];
  const custom = customServices.find(s => s.id === platform);
  return custom?.name ?? platform;
}

export function getPlatformColor(platform: string, customServices: CustomService[]): string | null {
  if (isBuiltInPlatform(platform)) return null; // use Tailwind class
  const custom = customServices.find(s => s.id === platform);
  return custom?.color ?? null;
}

export function getPlatformBgClass(platform: string): string | undefined {
  if (isBuiltInPlatform(platform)) return PLATFORM_COLORS[platform];
  return undefined;
}

export function getPlatformBorderClass(platform: string): string | undefined {
  if (isBuiltInPlatform(platform)) return PLATFORM_BORDER_COLORS[platform];
  return undefined;
}

export function getPlatformTextClass(platform: string): string | undefined {
  if (isBuiltInPlatform(platform)) return PLATFORM_TEXT_COLORS[platform];
  return undefined;
}
