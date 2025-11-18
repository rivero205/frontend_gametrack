// Hook para usar el ThemeContext
import { useContext } from 'react';

// Crear el contexto aquí para evitar problemas de Fast Refresh
import { createContext } from 'react';
export const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

// Utilidades de tema para usar fuera de componentes
export const getSystemTheme = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getSavedTheme = () => {
  return localStorage.getItem('gametrack-theme');
};