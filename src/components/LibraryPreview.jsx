import React from 'react';
import './Profile.css';

export default function LibraryPreview({ items = [] }) {
  // items: array of userGame-like objects or normalized game objects
  // Show only the last 3 games in the profile preview
  const preview = items.slice(0, 3);
  return (
    <div className="library-preview">
      <h3 className="section-title">Últimos en tu biblioteca</h3>
      <div className="library-grid">
        {preview.length === 0 && <div className="empty-state">No hay juegos en tu biblioteca.</div>}
        {preview.map((gItem) => {
          // Support both a game object and a userGame object with nested gameId
          const game = gItem.gameId && typeof gItem.gameId === 'object' ? gItem.gameId : gItem;
          const title = game?.titulo || gItem?.titulo || 'Título desconocido';
          const cover = game?.imagenPortada || gItem?.imagenPortada || null;
          const status = gItem?.estado || (gItem?.completado ? 'Completado' : 'Pendiente');
          const key = gItem._id || gItem.userGameId || (game && game._id) || Math.random();
          return (
            <div key={key} className="mini-game-card">
              <div className="mini-cover">
                {cover ? (
                  <img src={cover} alt={title} />
                ) : (
                  <div className="mini-placeholder">{(title || 'Juego').slice(0,1)}</div>
                )}
              </div>
              <div className="mini-meta">
                <div className="mini-title">{title}</div>
                <div className="mini-sub">{status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
