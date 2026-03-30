import { TrackedShow, PLATFORM_LABELS } from '@/types/show';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toICSDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
}

function addHour(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  const endH = h + 1;
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(endH)}${pad(m)}00`;
}

function nowUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function makeUID(showName: string, season: number, episode: number): string {
  const safe = showName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${safe}-s${season}e${episode}-${Date.now()}@plotify`;
}

export function generateICS(show: TrackedShow): string {
  const platform = PLATFORM_LABELS[show.platform];
  const spoilerFree = localStorage.getItem('plotify-spoiler-free-export') === 'true';
  const dtstamp = nowUTC();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plotify//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Plotify',
    'X-WR-TIMEZONE:UTC',
  ];

  if (show.releaseType === 'full-season' && show.episodes.length > 0) {
    const ep = show.episodes[0];
    const summary = `${show.name} S${ep.season} — All Episodes Available`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${makeUID(show.name, ep.season, 0)}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toICSDate(ep.airDate, show.releaseTime)}`,
      `DTEND:${addHour(ep.airDate, show.releaseTime)}`,
      `SUMMARY:${summary}`,
    );
    if (!spoilerFree) {
      lines.push(`DESCRIPTION:All episodes of ${show.name} Season ${ep.season} available on ${platform}`);
    }
    lines.push('END:VEVENT');
  } else {
    for (const ep of show.episodes) {
      const summary = `${show.name} — S${ep.season}E${ep.episode}`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${makeUID(show.name, ep.season, ep.episode)}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${toICSDate(ep.airDate, show.releaseTime)}`,
        `DTEND:${addHour(ep.airDate, show.releaseTime)}`,
        `SUMMARY:${summary}`,
      );
      if (!spoilerFree) {
        lines.push(`DESCRIPTION:New episode of ${show.name} available on ${platform}`);
      }
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export function downloadICS(show: TrackedShow): void {
  const content = generateICS(show);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const season = show.episodes[0]?.season ?? 1;
  const safeName = show.name.replace(/[^a-zA-Z0-9]/g, '');
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plotify_${safeName}_S${season}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
