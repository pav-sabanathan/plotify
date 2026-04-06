-- Add unique constraint for watch_progress upsert
ALTER TABLE public.watch_progress
ADD CONSTRAINT watch_progress_unique_episode UNIQUE (show_id, user_id, season, episode);

-- Enable realtime for cross-device sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.shows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_services;