import React, { useState } from 'react';
import '../styles/reviews.css';
import { Star, Trash2, Edit3 } from 'lucide-react';
import ReviewEditModal from './ReviewEditModal';

export default function ReviewsList({ reviews, games, onDelete, onEdit }) {
  const [editingReview, setEditingReview] = useState(null);

  // Open edit modal when clicking edit; parent-provided `onEdit` is used only after saving
  const handleEdit = (review) => {
    setEditingReview(review);
  };

  const handleSaved = (updated) => {
    // If parent provided onEdit, call it to update state there
    if (typeof onEdit === 'function') {
      onEdit(updated);
      return;
    }
    // fallback: reload so parent can fetch latest data
    window.location.reload();
  };
  const getGame = (gameIdParam) => {
    // Support both string IDs and populated game objects (from backend .populate)
    if (!gameIdParam) return null;
    const id = (typeof gameIdParam === 'object') ? (gameIdParam._id || gameIdParam.id) : gameIdParam;
    return games.find(g => String(g._id) === String(id)) || null;
  };

  return (
    <div>
      <h2 className="view-title">Mis Reseñas</h2>

      <div className="reviews-grid">
        {reviews.map(review => {
          const game = getGame(review.juegoId);
          return (
            <article key={review._id} className="review-card">
              <div className="review-card-left">
                {game && game.imagenPortada ? (
                  <img src={game.imagenPortada} alt={game.titulo} className="review-cover" />
                ) : (
                  <div className="review-cover placeholder" />
                )}
              </div>

              <div className="review-card-body">
                <div className="review-card-header">
                  <div>
                    <h3 className="review-game-title">
                      {game ? game.titulo : (typeof review.juegoId === 'object' && review.juegoId.titulo) ? review.juegoId.titulo : 'Juego eliminado'}
                    </h3>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < review.puntuacion ? '#fbbf24' : 'none'} />
                      ))}
                    </div>
                  </div>

                  <div className="review-header-badges">
                    <span className="badge badge--muted">{new Date(review.fechaCreacion || review.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>

                  <div className="review-actions">
                    <button className="icon-btn" onClick={() => onDelete(review._id)} title="Eliminar reseña">
                      <Trash2 size={18} />
                    </button>
                    <button className="icon-btn" onClick={() => handleEdit(review)} title="Editar reseña">
                      <Edit3 size={18} />
                    </button>
                  </div>
                </div>

                {/* Destacar el texto de la reseña: colocarlo justo debajo del título y antes de los metadatos */}
                {review.textoResena ? (
                  <p className="review-text review-text--featured">{review.textoResena}</p>
                ) : (
                  <p className="review-text review-text--muted">Sin texto de reseña</p>
                )}

                {/* Badges (moved to header) - removed from body per design */}
              </div>
            </article>
          );
        })}
      </div>

      {reviews.length === 0 && (
        <div className="empty-state">
          <Star size={64} />
          <h2>No hay reseñas todavía</h2>
          <p>¡Escribe tu primera reseña!</p>
        </div>
      )}
      {editingReview && (
        <ReviewEditModal review={editingReview} onClose={() => setEditingReview(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
