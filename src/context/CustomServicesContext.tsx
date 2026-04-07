import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface CustomService {
  id: string;
  name: string;
  color: string;
  suggested?: boolean;
}

const STORAGE_KEY = 'plotify-custom-services';

const loadServicesFromStorage = (): CustomService[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

interface CustomServicesContextType {
  services: CustomService[];
  addService: (service: CustomService) => void;
  removeService: (id: string) => void;
  hasService: (id: string) => boolean;
  getServiceById: (id: string) => CustomService | undefined;
  loading: boolean;
}

const CustomServicesContext = createContext<CustomServicesContextType | undefined>(undefined);

export const CustomServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !user;
  const initializedRef = useRef(false);

  // Load data based on auth state
  useEffect(() => {
    initializedRef.current = false;
    if (isGuest) {
      setServices(loadServicesFromStorage());
      setLoading(false);
      initializedRef.current = true;
    } else {
      const loadFromSupabase = async () => {
        setLoading(true);
        try {
          const { data } = await supabase.from('custom_services').select('*').eq('user_id', user.id);
          if (data) {
            setServices(data.map(row => ({
              id: row.id,
              name: row.name,
              color: row.colour,
            })));
          }
        } catch (e) {
          console.error('Failed to load custom services:', e);
        } finally {
          setLoading(false);
          initializedRef.current = true;
        }
      };
      loadFromSupabase();
    }
  }, [user, isGuest]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (isGuest && initializedRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    }
  }, [services, isGuest]);

  // Realtime subscription
  useEffect(() => {
    if (isGuest || !user) return;

    const sub = supabase
      .channel(`user-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_services', filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from('custom_services').select('*').eq('user_id', user.id);
        if (data) {
          setServices(data.map(row => ({
            id: row.id,
            name: row.name,
            color: row.colour,
          })));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user, isGuest]);

  const addService = useCallback(async (service: CustomService) => {
    setServices(prev => [...prev, service]);
    if (user) {
      await supabase.from('custom_services').insert({
        id: service.id,
        user_id: user.id,
        name: service.name,
        colour: service.color,
      });
    }
  }, [user]);

  const removeService = useCallback(async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    if (user) {
      await supabase.from('custom_services').delete().eq('id', id).eq('user_id', user.id);
    }
  }, [user]);

  const hasService = useCallback((id: string) => {
    return services.some(s => s.id === id || s.name.toLowerCase() === id.toLowerCase());
  }, [services]);

  const getServiceById = useCallback((id: string) => {
    return services.find(s => s.id === id);
  }, [services]);

  return (
    <CustomServicesContext.Provider value={{ services, addService, removeService, hasService, getServiceById, loading }}>
      {children}
    </CustomServicesContext.Provider>
  );
};

export const useCustomServices = () => {
  const ctx = useContext(CustomServicesContext);
  if (!ctx) throw new Error('useCustomServices must be used within CustomServicesProvider');
  return ctx;
};

export { loadServicesFromStorage, STORAGE_KEY };
