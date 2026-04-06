-- Add missing columns to shows table for full data sync
ALTER TABLE public.shows
ADD COLUMN IF NOT EXISTS first_episode_date text,
ADD COLUMN IF NOT EXISTS total_episodes integer,
ADD COLUMN IF NOT EXISTS release_type text NOT NULL DEFAULT 'weekly';