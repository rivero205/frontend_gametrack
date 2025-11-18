import { useEffect, useState } from 'react';
import { ThemeContext } from '../hooks/useTheme';

// Configuración de temas disponibles
const THEMES = {
  light: {
    id: 'light',
    name: 'Modo Claro',
    class: 'theme-light',
    dataAttribute: 'light'
  },
  dark: {
    id: 'dark', 
    name: 'Modo Gaming',
    class: 'theme-gaming',
    dataAttribute: 'dark'
  }
};

export default function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Verificar si hay una preferencia guardada
    const savedTheme = localStorage.getItem('gametrack-theme');
    if (savedTheme && THEMES[savedTheme]) {
      return savedTheme;
    }
    
    // Si no hay preferencia guardada, usar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Aplicar el tema al DOM
  const applyTheme = (themeId) => {
    const theme = THEMES[themeId];
    if (!theme) return;

    const root = document.documentElement;
    const body = document.body;

    // Limpiar clases anteriores
    Object.values(THEMES).forEach(t => {
      root.classList.remove(t.class);
      body.classList.remove(t.class);
    });

    // Aplicar nuevo tema
    root.setAttribute('data-theme', theme.dataAttribute);
    root.classList.add(theme.class);
    body.setAttribute('data-theme', theme.dataAttribute);
    body.classList.add(theme.class);
    
    // Guardar preferencia
    localStorage.setItem('gametrack-theme', themeId);
  };

  useEffect(() => {
    applyTheme(currentTheme);

    // Listener para cambios en preferencias del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Solo cambiar automáticamente si no hay preferencia explícita
      const savedTheme = localStorage.getItem('gametrack-theme');
      if (!savedTheme) {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  const toggleTheme = () => {
    setCurrentTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId);
    }
  };

  const resetTheme = () => {
    localStorage.removeItem('gametrack-theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setCurrentTheme(systemPreference);
  };

  const value = {
    // Estado actual
    theme: currentTheme,
    themeConfig: THEMES[currentTheme],
    
    // Queries de conveniencia
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark',
    isGaming: currentTheme === 'dark', // Gaming theme es el modo oscuro
    
    // Acciones
    toggleTheme,
    setTheme,
    resetTheme,
    
    // Utilidades
    getThemeClass: (baseClass) => `${baseClass} ${THEMES[currentTheme].class}`,
    getTokenValue: (tokenName) => {
      // Helper para obtener valores de tokens CSS en JavaScript
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--gt-${tokenName}`)
        .trim();
    },
    
    // Temas disponibles
    availableThemes: Object.values(THEMES)
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}