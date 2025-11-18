import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function fmtCreatedAt(value) {
  if (!value) return '-';
  try {
    if (typeof value === 'object') {
      if (value.$date) {
        const d = value.$date.$numberLong ? Number(value.$date.$numberLong) : (typeof value.$date === 'string' ? value.$date : null);
        if (d) return new Date(d).toLocaleDateString();
      }
      if (value.$numberLong) {
        return new Date(Number(value.$numberLong)).toLocaleDateString();
      }
    }

    const asNum = typeof value === 'number' ? value : (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : null);
    if (asNum) return new Date(asNum).toLocaleDateString();

    return new Date(value).toLocaleDateString();
  } catch {
    return '-';
  }
}

export default function Profile({ user, stats, onEdit }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const avatarUrl = user?.avatarUrl || user?.avatar || '';

  if (!user) return <div className="profile-root">No hay usuario autenticado.</div>;

  const nombre = user.nombre || user.name || 'Usuario';
  const email = user.email || '-';
  const createdAt = fmtCreatedAt(user.createdAt || user.created_at || user.created);
  // If createdAt isn't available, try to derive a date from Mongo ObjectId timestamp
  let createdDisplay = createdAt;
  if (!createdDisplay || createdDisplay === '-') {
    const id = user._id || user.id || '';
    if (typeof id === 'string' && id.length >= 8 && /^[0-9a-fA-F]+$/.test(id.substring(0, 8))) {
      try {
        const seconds = parseInt(id.substring(0, 8), 16);
        if (!Number.isNaN(seconds)) {
          createdDisplay = new Date(seconds * 1000).toLocaleDateString();
        }
      } catch {
        createdDisplay = '-';
      }
    }
  }
  const initials = (nombre.split(' ').map(n => n && n[0]).filter(Boolean).slice(0, 2).join('') || 'U').toUpperCase();

  const totalGames = stats?.totalGames ?? stats?.gamesCount ?? 0;
  const hoursPlayed = stats?.hoursPlayed ?? stats?.totalHours ?? 0;
  const progress = stats?.progress ?? 0;

  const handleEdit = (e) => {
    e.preventDefault();
    if (typeof onEdit === 'function') return onEdit(user);
    navigate('/profile/edit');
  };

  return (
    <div className="profile-root">
      <div className="profile-header">
        <div className="avatar-container">
          {avatarUrl && !imgError ? (
            <img
              className="avatar-img"
              src={avatarUrl}
              alt={`${nombre} avatar`}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="avatar" aria-hidden="true">{initials}</div>
          )}
        </div>

        <div className="profile-main">
          <div className="profile-name-and-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="profile-name">{nombre}</div>
              <button className="btn-edit-profile" onClick={handleEdit} aria-label="Editar perfil">Editar perfil</button>
            </div>
            <div className="profile-email">{email} • Miembro desde {createdDisplay}</div>
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">{totalGames}</div>
              <div className="stat-label">Juegos totales</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{hoursPlayed}</div>
              <div className="stat-label">Horas jugadas</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{progress}%</div>
              <div className="stat-label">Progreso</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
