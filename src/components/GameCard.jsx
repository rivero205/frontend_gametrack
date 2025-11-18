import React from 'react';
import { resolveImageUrl } from '../utils/helpers';
import { Star, Trash2, Edit2, Check } from 'lucide-react';

export default function GameCard({ game, reviews = [], onEdit, onDelete, onToggleCompleted, onAddReview, readOnly = false, onView }) {
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length : 0;

  return (
    <div className="game-card" onClick={(e) => { if (onView && !e.target.closest('.icon-btn') && !e.target.closest('button')) onView(game); }} role={onView ? 'button' : undefined} tabIndex={onView ? 0 : undefined}>
      {game.imagenPortada ? (
        <img src={resolveImageUrl(game.imagenPortada)} alt={game.titulo} className="game-cover" />
      ) : (
        <div className="game-cover" />
      )}

      <div className="game-content">
        <div className="game-header">
          <h3 className="game-title">{game.titulo}</h3>
          {!readOnly && (
            <div className="game-actions">
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }} title="Editar">
                <Edit2 size={16} />
              </button>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }} title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="game-meta">
          {game.genero && <span className="badge">{game.genero}</span>}
          {game.plataforma && <span className="badge">{game.plataforma}</span>}
          {game.añoLanzamiento && <span className="badge highlight">{game.añoLanzamiento}</span>}
        </div>

        {game.descripcion && (
          <p className="game-description">{game.descripcion}</p>
        )}

        {reviews.length > 0 && (
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill={i < avgRating ? '#fbbf24' : 'none'} />
            ))}
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#9ca3bc' }}>
              ({reviews.length})
            </span>
          </div>
        )}

        {!readOnly && (
          <div className="game-footer">
            <button
              className={`completed-toggle ${game.completado ? 'completed' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleCompleted && onToggleCompleted(); }}
            >
              {game.completado && <Check size={16} />}
              {game.completado ? 'Completado' : 'Completar'}
            </button>
            <button className="btn-review" onClick={(e) => { e.stopPropagation(); onAddReview && onAddReview(); }}>
              Reseñar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
