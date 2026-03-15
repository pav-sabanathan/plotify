import { TrackedShow, PLATFORM_LABELS } from '@/types/show';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toICSDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@plotify`;
}

export function generateICS(show: TrackedShow): string {
  const platform = PLATFORM_LABELS[show.platform];
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plotify//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  if (show.releaseType === 'full-season' && show.episodes.length > 0) {
    const ep = show.episodes[0];
    const dtStart = toICSDate(ep.airDate, show.releaseTime);
    const dtEnd = toICSDate(ep.airDate, show.releaseTime ? `${parseInt(show.releaseTime) + 1}:${show.releaseTime.split(':')[1]}` : '01:00');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${show.name} S${ep.season} — All Episodes Available`,
      `DESCRIPTION:All episodes of ${show.name} Season ${ep.season} available on ${platform}`,
      'END:VEVENT',
    );
  } else {
    for (const ep of show.episodes) {
      const dtStart = toICSDate(ep.airDate, show.releaseTime);
      // 1 hour duration
      const h = parseInt(show.releaseTime || '0');
      const m = (show.releaseTime || '00:00').split(':')[1];
      const endH = h + 1;
      const dtEnd = `${ep.airDate.replace(/-/g, '')}T${pad(endH)}${pad(parseInt(m || '0'))}00`;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid()}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${show.name} — S${ep.season}E${ep.episode}`,
        `DESCRIPTION:New episode of ${show.name} available on ${platform}`,
        'END:VEVENT',
      );
    }
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
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
