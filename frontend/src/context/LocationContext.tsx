import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';

interface LocationState {
  city: string;
  cities: string[];
  loaded: boolean;
  setCity: (city: string) => void;
}

const LocationContext = createContext<LocationState>({
  city: 'Hyderabad',
  cities: [],
  loaded: false,
  setCity: () => {},
});

export const useLocation = () => useContext(LocationContext);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<string>('Hyderabad');
  const [cities, setCities] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      Promise.all([api.cities(), api.preferences()])
        .then(([citiesData, pref]) => {
          setCities(citiesData.cities || []);
          setCityState(pref.city || citiesData.default || 'Hyderabad');
          setLoaded(true);
        })
        .catch((e) => {
          console.error(apiError(e));
          setLoaded(true);
        });
    } catch (e) {
      console.error('Failed to load location data', e);
      setLoaded(true);
    }
  }, []);

  const setCity = useCallback((newCity: string) => {
    try {
      setCityState(newCity);
    } catch {
      /* silent */
    }
  }, []);

  return (
    <LocationContext.Provider value={{ city, cities, loaded, setCity }}>
      {children}
    </LocationContext.Provider>
  );
}
