import { TrackedShow } from '@/types/show';
import { addDays, format, subDays } from 'date-fns';

import posterTheBear from '@/assets/poster-the-bear.jpg';
import posterSlowHorses from '@/assets/poster-slow-horses.jpg';
import posterFallout from '@/assets/poster-fallout.jpg';
import posterBlueLights from '@/assets/poster-blue-lights.jpg';
import posterAdolescence from '@/assets/poster-adolescence.jpg';

const today = new Date();

function generateWeeklyEpisodes(
  seasonNum: number,
  totalEps: number,
  startDate: Date,
  dayOfWeek: number
): { id: string; season: number; episode: number; title: string; airDate: string }[] {
  const episodes = [];
  let currentDate = new Date(startDate);
  // Adjust to the correct day of week
  while (currentDate.getDay() !== dayOfWeek) {
    currentDate = addDays(currentDate, 1);
  }
  for (let i = 1; i <= totalEps; i++) {
    episodes.push({
      id: `s${seasonNum}e${i}`,
      season: seasonNum,
      episode: i,
      title: `Episode ${i}`,
      airDate: format(currentDate, 'yyyy-MM-dd'),
    });
    currentDate = addDays(currentDate, 7);
  }
  return episodes;
}

function generateFullSeasonEpisodes(
  seasonNum: number,
  totalEps: number,
  releaseDate: Date
): { id: string; season: number; episode: number; title: string; airDate: string }[] {
  const dateStr = format(releaseDate, 'yyyy-MM-dd');
  return Array.from({ length: totalEps }, (_, i) => ({
    id: `s${seasonNum}e${i + 1}`,
    season: seasonNum,
    episode: i + 1,
    title: `Episode ${i + 1}`,
    airDate: dateStr,
  }));
}

export const SAMPLE_SHOWS: TrackedShow[] = [
  {
    id: 'the-bear',
    name: 'The Bear',
    poster: posterTheBear,
    platform: 'disney',
    status: 'ongoing',
    releaseType: 'weekly',
    paused: false,
    releaseDay: 3, // Wednesday
    releaseTime: '02:00',
    episodes: generateWeeklyEpisodes(4, 10, subDays(today, 14), 3),
  },
  {
    id: 'slow-horses',
    name: 'Slow Horses',
    poster: posterSlowHorses,
    platform: 'apple',
    status: 'ongoing',
    releaseType: 'weekly',
    paused: false,
    releaseDay: 5, // Friday
    releaseTime: '00:00',
    episodes: generateWeeklyEpisodes(5, 6, subDays(today, 7), 5),
  },
  {
    id: 'fallout',
    name: 'Fallout',
    poster: posterFallout,
    platform: 'prime',
    status: 'ongoing',
    releaseType: 'full-season',
    paused: false,
    episodes: generateFullSeasonEpisodes(2, 8, addDays(today, 10)),
  },
  {
    id: 'blue-lights',
    name: 'Blue Lights',
    poster: posterBlueLights,
    platform: 'bbc',
    status: 'ongoing',
    releaseType: 'weekly',
    paused: false,
    releaseDay: 0, // Sunday
    releaseTime: '21:00',
    episodes: generateWeeklyEpisodes(3, 6, subDays(today, 7), 0),
  },
  {
    id: 'adolescence',
    name: 'Adolescence',
    poster: posterAdolescence,
    platform: 'netflix',
    status: 'ongoing',
    releaseType: 'full-season',
    paused: false,
    episodes: generateFullSeasonEpisodes(1, 4, addDays(today, 3)),
  },
];
