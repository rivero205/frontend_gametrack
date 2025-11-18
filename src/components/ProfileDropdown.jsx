import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, Settings } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function ProfileDropdown({ currentUser, onProfile, onLogout, onSettings }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const ref = useRef(null);
  const [imgError, setImgError] = useState(false);
  const avatarUrl = currentUser?.avatarUrl || currentUser?.avatar || '';

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function handleProfile() {
    setOpen(false);
    if (onProfile) onProfile();
  }

  function handleLogout() {
    setOpen(false);
    setConfirmOpen(true);
  }

  function confirmLogout() {
    setConfirmOpen(false);
    if (onLogout) onLogout();
  }

  const initials = (currentUser?.nombre || 'U')
    .split(' ')
    .map(n => n[0])
    .slice(0,2)
    .join('')
    .toUpperCase();

  return (
    <div className="profile-dropdown" ref={ref}>
      <button
        className="profile-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        title="Cuenta"
      >
        {avatarUrl && !imgError ? (
          <img src={avatarUrl} alt={`${currentUser?.nombre || 'Usuario'} avatar`} style={{width:40, height:40, borderRadius:9999, objectFit:'cover'}} onError={() => setImgError(true)} />
        ) : (
          <div className="avatar" style={{width:40, height:40, borderRadius:9999}}>{initials}</div>
        )}
      </button>

      <div className={`dropdown-menu ${open ? 'open' : ''}`} role="menu">
        <div className="dropdown-header">
          <div className="dropdown-avatar">
            {avatarUrl && !imgError ? (
              <img src={avatarUrl} alt={`${currentUser?.nombre || 'Usuario'} avatar`} style={{width:48, height:48, borderRadius:9999, objectFit:'cover'}} onError={() => setImgError(true)} />
            ) : (
              initials
            )}
          </div>
          <div className="dropdown-user">
            <div className="dropdown-name">{currentUser?.nombre || 'Usuario'}</div>
            <div className="dropdown-email">{currentUser?.email || ''}</div>
          </div>
        </div>
        <div className="dropdown-actions">
          <button className="dropdown-item" onClick={handleProfile}>
            <User size={16} /> Mi Perfil
          </button>
          <button className="dropdown-item danger" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cerrar sesión"
        message="¿Estás seguro que quieres cerrar sesión?"
        onConfirm={confirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
