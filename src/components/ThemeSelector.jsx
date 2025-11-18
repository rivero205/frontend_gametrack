import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeSelector = () => {
  const { theme, setTheme, resetTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  const handleSystemTheme = () => {
    resetTheme();
    setIsOpen(false);
  };

  return (
    <div className="theme-selector" ref={ref}>
      <button 
        className="theme-selector-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Cambiar tema"
      >
        <Palette size={18} />
      </button>

      {isOpen && (
        <div className="theme-selector-dropdown">
          <div className="theme-selector-header">
            <span>Seleccionar Tema</span>
          </div>
          
          <div className="theme-selector-options">
            {availableThemes.map((themeOption) => (
              <button
                key={themeOption.id}
                className={`theme-option ${theme === themeOption.id ? 'active' : ''}`}
                onClick={() => handleThemeSelect(themeOption.id)}
              >
                <div className={`theme-preview theme-preview-${themeOption.id}`}></div>
                <span className="theme-name">{themeOption.name}</span>
                {theme === themeOption.id && <Check size={16} />}
              </button>
            ))}
            
            <hr className="theme-divider" />
            
            <button
              className="theme-option"
              onClick={handleSystemTheme}
            >
              <Monitor size={16} />
              <span>Usar tema del sistema</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;