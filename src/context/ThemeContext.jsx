import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'universo_theme';

export const THEMES = [
  {
    id: 'artemis',
    name: 'Artemis Control',
    subtitle: 'Deep-Space Telemetry',
    accentColor: '#00f0ff',
    badge: 'NASA / JPL',
    tagline: 'Deep space void with ice-cyan telemetry and high-contrast indicators.'
  },
  {
    id: 'arrakis',
    name: 'Arrakis Field',
    subtitle: 'Mars Desert Expedition',
    accentColor: '#f59e0b',
    badge: 'MARS DUNE',
    tagline: 'Warm obsidian graphite with high-vis solar amber for sunlight readability.'
  },
  {
    id: 'stealth',
    name: 'Stealth MFD',
    subtitle: 'Fighter Cockpit Avionics',
    accentColor: '#22c55e',
    badge: 'OLED TACTICAL',
    tagline: 'True OLED black with razor-sharp slate borders and phosphor green HUD.'
  }
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && THEMES.some(t => t.id === saved)) {
        return saved;
      }
    } catch (e) {}
    return 'artemis';
  });

  const setTheme = (newTheme) => {
    if (THEMES.some(t => t.id === newTheme)) {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {}
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const activeThemeMeta = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, activeThemeMeta }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
