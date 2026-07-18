import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';

interface LocationState {
  city: string;
  cities: string[];
  setCity: (city: string) => void;
  refresh: () => void;
}

const LocationContext = createContext<LocationState>({
  city: 'Mumbai',
  cities: [],
  setCity: () => {},
  refresh: () => {},
});

export const useLocation = () => useContext(LocationContext);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<string>('Mumbai');
  const [cities, setCities] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    try {
      Promise.all([api.cities(), api.preferences()])
        .then(([citiesData, pref]) => {
          setCities(citiesData.cities || []);
          setCityState(pref.city || citiesData.default || 'Mumbai');
        })
        .catch((e) => console.error(apiError(e)));
    } catch (e) {
      console.error('Failed to load location data', e);
    }
  }, [refreshKey]);

  const setCity = useCallback((newCity: string) => {
    setCityState(newCity);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <LocationContext.Provider value={{ city, cities, setCity, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}
