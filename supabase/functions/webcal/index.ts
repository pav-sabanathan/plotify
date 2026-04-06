import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function nowUTC(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function toICSDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
}

function addHour(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h + 1)}${pad(m)}00`;
}

function generateEpisodes(show: any): { season: number; episode: number; airDate: string }[] {
  const episodes: { season: number; episode: number; airDate: string }[] = [];
  if (!show.first_episode_date || !show.season) return episodes;

  const total = show.total_episodes || 10;
  const season = show.season;

  if (show.release_type === "full-season" || show.is_full_season_drop) {
    episodes.push({ season, episode: 1, airDate: show.first_episode_date });
  } else {
    const releaseDay = show.release_day ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(show.release_day) : new Date(show.first_episode_date + "T00:00:00").getDay();
    const start = new Date(show.first_episode_date + "T00:00:00");
    for (let i = 0; i < total; i++) {
      const epDate = new Date(start);
      epDate.setDate(start.getDate() + i * 7);
      episodes.push({
        season,
        episode: i + 1,
        airDate: `${epDate.getFullYear()}-${pad(epDate.getMonth() + 1)}-${pad(epDate.getDate())}`,
      });
    }
  }
  return episodes;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Expect path like /webcal/{token} or just the token
  let token = pathParts[pathParts.length - 1] || "";
  // Strip .ics extension if present
  token = token.replace(/\.ics$/, "");

  if (!token) {
    return new Response("Not Found", { status: 404 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Look up token
  const { data: sub, error: subErr } = await supabase
    .from("webcal_subscriptions")
    .select("user_id")
    .eq("token", token)
    .single();

  if (subErr || !sub) {
    return new Response("Not Found", { status: 404 });
  }

  const userId = sub.user_id;

  // Fetch user preferences
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("spoiler_free_calendar")
    .eq("user_id", userId)
    .single();

  const spoilerFree = prefs?.spoiler_free_calendar ?? false;

  // Fetch all shows
  const { data: shows } = await supabase
    .from("shows")
    .select("*")
    .eq("user_id", userId);

  if (!shows || shows.length === 0) {
    const empty = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Plotify//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Plotify",
      "X-WR-TIMEZONE:UTC",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n";
    return new Response(empty, {
      headers: { "Content-Type": "text/calendar; charset=utf-8" },
    });
  }

  const dtstamp = nowUTC();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plotify//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Plotify",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const show of shows) {
    if (show.is_paused) continue;

    const episodes = generateEpisodes(show);
    if (episodes.length === 0) continue;

    const isFullSeason = show.release_type === "full-season" || show.is_full_season_drop;

    if (isFullSeason) {
      const ep = episodes[0];
      const safe = show.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const uid = `${safe}-s${ep.season}e0-webcal@plotify`;
      const summary = `${show.title} S${ep.season} — All Episodes Available`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${toICSDate(ep.airDate, show.release_time || undefined)}`,
        `DTEND:${addHour(ep.airDate, show.release_time || undefined)}`,
        `SUMMARY:${summary}`,
      );
      if (!spoilerFree) {
        lines.push(`DESCRIPTION:All episodes of ${show.title} Season ${ep.season} available on ${show.platform}. Data provided by TMDB (themoviedb.org)`);
      }
      lines.push("END:VEVENT");
    } else {
      for (const ep of episodes) {
        const safe = show.title.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const uid = `${safe}-s${ep.season}e${ep.episode}-webcal@plotify`;
        const summary = `${show.title} — S${ep.season}E${ep.episode}`;
        lines.push(
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART:${toICSDate(ep.airDate, show.release_time || undefined)}`,
          `DTEND:${addHour(ep.airDate, show.release_time || undefined)}`,
          `SUMMARY:${summary}`,
        );
        if (!spoilerFree) {
          lines.push(`DESCRIPTION:New episode of ${show.title} available on ${show.platform}. Data provided by TMDB (themoviedb.org)`);
        }
        lines.push("END:VEVENT");
      }
    }
  }

  lines.push("END:VCALENDAR");
  const ics = lines.join("\r\n") + "\r\n";

  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
});
