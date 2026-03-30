import { CustomService } from '@/context/CustomServicesContext';
import { Platform, PLATFORM_LABELS, PLATFORM_COLORS, PLATFORM_BORDER_COLORS, PLATFORM_TEXT_COLORS } from '@/types/show';

// Built-in platform HSL values (h, s%, l%) matching index.css
const PLATFORM_HSL: Record<Platform, [number, number, number]> = {
  netflix: [357, 91, 47],
  disney: [225, 91, 44],
  apple: [0, 0, 63],
  prime: [196, 100, 44],
  bbc: [25, 100, 50],
  manual: [258, 90, 66],
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Returns 'text-white' or 'text-black' based on background luminance (threshold 0.4) */
export function getPlatformContrastClass(platform: string, customServices: CustomService[]): string {
  if (isBuiltInPlatform(platform)) {
    const [h, s, l] = PLATFORM_HSL[platform];
    const [r, g, b] = hslToRgb(h, s, l);
    return luminance(r, g, b) > 0.4 ? 'text-black' : 'text-white';
  }
  const custom = customServices.find(cs => cs.id === platform);
  if (custom?.color) {
    const [r, g, b] = hexToRgb(custom.color);
    return luminance(r, g, b) > 0.4 ? 'text-black' : 'text-white';
  }
  return 'text-white';
}

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
