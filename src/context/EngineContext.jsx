import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const EngineContext = createContext(null);

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function EngineProvider({ children }) {
  const [parsed, setParsed] = useState(() => safeRead('finspark.parsed', null));
  const [rankings, setRankings] = useState(() => safeRead('finspark.rankings', []));
  const [config, setConfig] = useState(() => safeRead('finspark.config', null));
  const [simulation, setSimulation] = useState(() => safeRead('finspark.simulation', null));

  useEffect(() => {
    localStorage.setItem('finspark.parsed', JSON.stringify(parsed));
  }, [parsed]);

  useEffect(() => {
    localStorage.setItem('finspark.rankings', JSON.stringify(rankings));
  }, [rankings]);

  useEffect(() => {
    localStorage.setItem('finspark.config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('finspark.simulation', JSON.stringify(simulation));
  }, [simulation]);

  const value = useMemo(() => ({
    parsed,
    setParsed,
    rankings,
    setRankings,
    config,
    setConfig,
    simulation,
    setSimulation,
  }), [parsed, rankings, config, simulation]);

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used inside EngineProvider');
  }
  return context;
}
