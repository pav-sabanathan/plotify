import React, { createContext, useContext, useState, useCallback } from 'react';
import { TrackedShow, Platform } from '@/types/show';
import { SAMPLE_SHOWS } from '@/data/sampleShows';

interface ShowsContextType {
  shows: TrackedShow[];
  addShow: (show: TrackedShow) => void;
  removeShow: (id: string) => void;
  togglePause: (id: string) => void;
}

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

export const ShowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<TrackedShow[]>(SAMPLE_SHOWS);

  const addShow = useCallback((show: TrackedShow) => {
    setShows(prev => [...prev, show]);
  }, []);

  const removeShow = useCallback((id: string) => {
    setShows(prev => prev.filter(s => s.id !== id));
  }, []);

  const togglePause = useCallback((id: string) => {
    setShows(prev => prev.map(s => s.id === id ? { ...s, paused: !s.paused } : s));
  }, []);

  return (
    <ShowsContext.Provider value={{ shows, addShow, removeShow, togglePause }}>
      {children}
    </ShowsContext.Provider>
  );
};

export const useShows = () => {
  const ctx = useContext(ShowsContext);
  if (!ctx) throw new Error('useShows must be used within ShowsProvider');
  return ctx;
};
