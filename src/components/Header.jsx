import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Gamepad2, Compass, Users, Library, LogIn, BookOpen, TrendingUp, MessageSquare } from 'lucide-react';
/* Theme toggle temporarily hidden from users.
  Keep import here commented so the component remains in the codebase
  and can be re-enabled quickly by removing these comments. */
// import ThemeToggle from './ThemeToggle';
import ProfileDropdown from './ProfileDropdown';

import './Header.css';

export default function Header({ isAuthenticated: initialAuth = false, onLogout, currentUser, onProfileClick, onSettings }) {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialAuth));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(Boolean(initialAuth));
  }, [initialAuth]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    document.body.classList.remove('mobile-menu-open');
  }, [location.pathname]);

  // Handle body scroll lock when menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => document.body.classList.remove('mobile-menu-open');
  }, [mobileMenuOpen]);

  // Close mobile menu when viewport becomes desktop-sized to avoid leftover open menu
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 900px)');
    const onChange = (e) => {
      if (e.matches) {
        setMobileMenuOpen(false);
        document.body.classList.remove('mobile-menu-open');
      }
    };
    // initial check
    if (mq.matches) {
      setMobileMenuOpen(false);
      document.body.classList.remove('mobile-menu-open');
    }
    // add listener (use addEventListener if available)
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
    } else if (typeof mq.addListener === 'function') {
      mq.addListener(onChange);
    }
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onChange);
      } else if (typeof mq.removeListener === 'function') {
        mq.removeListener(onChange);
      }
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleExploreClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
    closeMobileMenu();
  };

  const handleCommunityClick = () => {
    navigate('/community');
    closeMobileMenu();
  };

  const handleCatalogClick = () => {
    navigate('/catalog');
    closeMobileMenu();
  };

  const handleLibraryClick = () => {
    navigate('/dashboard');
    closeMobileMenu();
  };

  const handleStatsClick = () => {
    navigate('/stats');
    closeMobileMenu();
  };

  const handleMyReviewsClick = () => {
    navigate('/reviews');
    closeMobileMenu();
  };

  const handleLoginClick = () => {
    navigate('/login');
    closeMobileMenu();
  };

  const handleRegisterClick = () => {
    navigate('/register');
    closeMobileMenu();
  };

  const currentPath = location.pathname;
  
  const getIsActive = (path) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  // Navigation items for both desktop and mobile
  const renderNavItems = () => {
    if (!isAuthenticated) {
      return (
        <>
          <button
            className={`nav-item ${getIsActive('/') ? 'active' : ''}`}
            onClick={handleExploreClick}
          >
            <Compass size={18} />
            <span>Explorar</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/community') ? 'active' : ''}`}
            onClick={handleCommunityClick}
          >
            <Users size={18} />
            <span>Comunidad</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/catalog') ? 'active' : ''}`}
            onClick={handleCatalogClick}
          >
            <Library size={18} />
            <span>Catálogo</span>
          </button>
        </>
      );
    } else {
      return (
        <>
          <button
            className={`nav-item ${getIsActive('/dashboard') ? 'active' : ''}`}
            onClick={handleLibraryClick}
          >
            <BookOpen size={18} />
            <span>Mi Biblioteca</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/community') ? 'active' : ''}`}
            onClick={handleCommunityClick}
          >
            <Users size={18} />
            <span>Comunidad</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/catalog') ? 'active' : ''}`}
            onClick={handleCatalogClick}
          >
            <Library size={18} />
            <span>Catálogo</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/stats') ? 'active' : ''}`}
            onClick={handleStatsClick}
          >
            <TrendingUp size={18} />
            <span>Estadísticas</span>
          </button>
          <button
            className={`nav-item ${getIsActive('/reviews') ? 'active' : ''}`}
            onClick={handleMyReviewsClick}
          >
            <MessageSquare size={18} />
            <span>Mis Reseñas</span>
          </button>
        </>
      );
    }
  };

  return (
    <header className="modern-header">
      <div className="modern-header-content">
        {/* Logo */}
        <div 
          className="modern-logo" 
          role="button" 
          onClick={() => navigate('/')}
        >
          
          <h1 className="logo-text">
            <span className="logo-text--main">GameTrack</span>
            <span className="logo-text--accent">REVOLUTION</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="modern-nav">
          {renderNavItems()}
        </nav>

        {/* Desktop Actions */}
        <div className="desktop-actions">
            {/* ThemeToggle hidden: users should not see light/dark toggle right now.
              To re-enable, uncomment the import at top and this line:
              <ThemeToggle /> */}

          {!isAuthenticated ? (
            <div className="auth-buttons">
              <button 
                className="btn btn-secondary btn-register"
                onClick={handleRegisterClick}
              >
                Registrarse
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleLoginClick}
              >
                Ingresar
              </button>
            </div>
          ) : (
            <ProfileDropdown 
              currentUser={currentUser} 
              onProfile={onProfileClick} 
              onLogout={onLogout}
              onSettings={onSettings}
            />
          )}

          {/* Hamburger Button */}
          <button 
            className={`hamburger-button ${mobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay + Menu rendered via portal to avoid stacking/overflow issues */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <div 
            className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}
            onClick={closeMobileMenu}
          />

          <nav className={`mobile-nav ${mobileMenuOpen ? 'active' : ''}`}>
            <button
              className="mobile-nav-close"
              onClick={closeMobileMenu}
              aria-label="Cerrar menú"
            >
              ×
            </button>
            <div className="mobile-nav-content">
              {renderNavItems()}
              
              {!isAuthenticated && (
                <>
                  <div className="mobile-nav-divider" />
                  <div className="mobile-auth-buttons">
                    <button 
                      className="btn btn-secondary btn-register"
                      onClick={handleRegisterClick}
                    >
                      Registrarse
                    </button>
                    <button 
                      className="btn-login"
                      onClick={handleLoginClick}
                    >
                      Ingresar
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </>,
        document.body
      )}
    </header>
  );
}