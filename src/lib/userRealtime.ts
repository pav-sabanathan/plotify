import { supabase } from '@/integrations/supabase/client';

type AsyncCallback = () => void | Promise<void>;

type ListenerSet = {
  shows: Set<AsyncCallback>;
  watchProgress: Set<AsyncCallback>;
  customServices: Set<AsyncCallback>;
};

type ChannelEntry = {
  listeners: ListenerSet;
  refCount: number;
};

const channels = new Map<string, ChannelEntry>();

const createListenerSet = (): ListenerSet => ({
  shows: new Set(),
  watchProgress: new Set(),
  customServices: new Set(),
});

const notifyListeners = async (listeners: Set<AsyncCallback>) => {
  await Promise.all(Array.from(listeners, (listener) => listener()));
};

const createChannelEntry = (userId: string): ChannelEntry => {
  const listeners = createListenerSet();

  const channel = supabase
    .channel(`user-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shows', filter: `user_id=eq.${userId}` }, async () => {
      await notifyListeners(listeners.shows);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'watch_progress', filter: `user_id=eq.${userId}` }, async () => {
      await notifyListeners(listeners.watchProgress);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_services', filter: `user_id=eq.${userId}` }, async () => {
      await notifyListeners(listeners.customServices);
    })
    .subscribe();

  return {
    listeners,
    refCount: 0,
  };
};

type UserRealtimeHandlers = {
  onShowsChange?: AsyncCallback;
  onWatchProgressChange?: AsyncCallback;
  onCustomServicesChange?: AsyncCallback;
};

export const subscribeToUserRealtime = (userId: string, handlers: UserRealtimeHandlers) => {
  let entry = channels.get(userId);

  if (!entry) {
    entry = createChannelEntry(userId);
    channels.set(userId, entry);
  }

  entry.refCount += 1;

  if (handlers.onShowsChange) entry.listeners.shows.add(handlers.onShowsChange);
  if (handlers.onWatchProgressChange) entry.listeners.watchProgress.add(handlers.onWatchProgressChange);
  if (handlers.onCustomServicesChange) entry.listeners.customServices.add(handlers.onCustomServicesChange);

  return () => {
    const currentEntry = channels.get(userId);
    if (!currentEntry) return;

    if (handlers.onShowsChange) currentEntry.listeners.shows.delete(handlers.onShowsChange);
    if (handlers.onWatchProgressChange) currentEntry.listeners.watchProgress.delete(handlers.onWatchProgressChange);
    if (handlers.onCustomServicesChange) currentEntry.listeners.customServices.delete(handlers.onCustomServicesChange);

    currentEntry.refCount -= 1;

    if (currentEntry.refCount <= 0) {
      const realtimeChannel = supabase.getChannels().find((item) => item.topic === `user-${userId}`);
      if (realtimeChannel) {
        void supabase.removeChannel(realtimeChannel);
      }
      channels.delete(userId);
    }
  };
};
