import { Sun, Moon } from 'lucide-react';
import React from 'react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Cambiar a ${theme === 'light' ? 'modo gaming' : 'modo claro'}`}
      title={`Cambiar a ${theme === 'light' ? 'modo gaming' : 'modo claro'}`}
    >
      {theme === 'light' ? (
        <Moon size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;