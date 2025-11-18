import React from 'react';
import { Star } from 'lucide-react';
import './Profile.css';

export default function RecentReviews({ reviews = [] }) {
  // Mostrar solo las 2 reseñas más recientes
  const preview = reviews.slice(0, 2);
  if (preview.length === 0) {
    return (
      <div className="recent-reviews">
        <h3 className="section-title">Reseñas recientes</h3>
        <div className="reviews-list">
          <div className="empty-state">No hay reseñas recientes.</div>
        </div>
      </div>
    );
  }

  const resolveTitle = (r) => {
    if (r.juegoId && typeof r.juegoId === 'object') return r.juegoId.titulo || r.juegoId.title || 'Juego';
    return r.juegoTitulo || r.gameTitle || r.titulo || 'Juego';
  };

  const resolveCover = (r) => {
    if (r.juegoId && typeof r.juegoId === 'object') return r.juegoId.imagenPortada || null;
    return r.imagenPortada || null;
  };

  const resolveScore = (r) => r.puntuacion || r.score || 0;

  const resolveText = (r) => r.textoResena || r.texto || r.contenido || r.descripcion || '';

  return (
    <div className="recent-reviews">
      <h3 className="section-title">Reseñas recientes</h3>
      <div className="reviews-grid">
        {preview.map(review => {
          const title = resolveTitle(review);
          const cover = resolveCover(review);
          const score = resolveScore(review);
          const text = resolveText(review);
          const date = review.fechaCreacion || review.createdAt || null;
          return (
            <article key={review._id} className="review-card">
              <div className="review-card-left">
                {cover ? (
                  <img src={cover} alt={title} className="review-cover" />
                ) : (
                  <div className="review-cover placeholder" />
                )}
              </div>

              <div className="review-card-body">
                <div className="review-card-header">
                  <div>
                    <h3 className="review-game-title">{title}</h3>
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < score ? '#fbbf24' : 'none'} />
                      ))}
                    </div>
                  </div>

                  <div className="review-header-badges">
                    <span className="badge badge--muted">{date ? new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                  </div>
                </div>

                {text ? (
                  <p className="review-text review-text--featured">{text}</p>
                ) : (
                  <p className="review-text review-text--muted">Sin texto de reseña</p>
                )}

                {/* bottom meta removed per design (badges moved to header) */}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
