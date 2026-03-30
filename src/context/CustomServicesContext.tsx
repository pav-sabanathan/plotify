import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface CustomService {
  id: string;
  name: string;
  color: string; // hex color e.g. "#0057FF"
  suggested?: boolean; // true if added from suggested list
}

const STORAGE_KEY = 'plotify-custom-services';

const loadServices = (): CustomService[] => {
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
}

const CustomServicesContext = createContext<CustomServicesContextType | undefined>(undefined);

export const CustomServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<CustomService[]>(loadServices);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  }, [services]);

  const addService = useCallback((service: CustomService) => {
    setServices(prev => [...prev, service]);
  }, []);

  const removeService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const hasService = useCallback((id: string) => {
    return services.some(s => s.id === id);
  }, [services]);

  const getServiceById = useCallback((id: string) => {
    return services.find(s => s.id === id);
  }, [services]);

  return (
    <CustomServicesContext.Provider value={{ services, addService, removeService, hasService, getServiceById }}>
      {children}
    </CustomServicesContext.Provider>
  );
};

export const useCustomServices = () => {
  const ctx = useContext(CustomServicesContext);
  if (!ctx) throw new Error('useCustomServices must be used within CustomServicesProvider');
  return ctx;
};
