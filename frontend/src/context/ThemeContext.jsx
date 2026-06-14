// src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  // State for theme mode: 'light', 'dark', or 'system'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'system';
  });
  
  const [darkMode, setDarkMode] = useState(false);

  // Function to check if dark mode should be active based on system preference
  const getSystemPreference = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Apply theme based on mode and system preference
  useEffect(() => {
    let isDark = false;
    
    if (themeMode === 'system') {
      isDark = getSystemPreference();
    } else if (themeMode === 'dark') {
      isDark = true;
    } else {
      isDark = false;
    }
    
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (themeMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const isDark = getSystemPreference();
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const toggleDarkMode = () => {
    // If currently in system mode, switching toggles to the opposite
    // But better to change mode explicitly
    if (themeMode === 'system') {
      setThemeMode(getSystemPreference() ? 'light' : 'dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode('dark');
    }
  };

  const setThemeModeExplicit = (mode) => {
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      setThemeMode(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      themeMode, 
      setThemeMode: setThemeModeExplicit 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};