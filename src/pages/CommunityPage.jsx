import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThumbsUp, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getCommunityReviews, likeReview, createCommunityReview } from '../services/api';
import Toolbar from '../components/Toolbar';
import CommunityReviews from '../components/CommunityReviews';
import '../styles/community.css';

const CommunityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const params = new URLSearchParams(location.search);
  const initialGameId = params.get('game') || '';

  // Toolbar controlled state (reuse names from CatalogPage)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sort, setSort] = useState('recientes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [poppedIds, setPoppedIds] = useState(new Set());
  const [showNewReview, setShowNewReview] = useState(false);
  const [newReview, setNewReview] = useState({ puntuacion: 5, textoResena: '' });

  // no local suggestions: Toolbar provides search/filter UI

  // Si hay game en querystring, cargar reseñas
  useEffect(() => {
    async function loadById(id) {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const list = await getCommunityReviews(id, { sort });
        setReviews(list);
      } catch (e) {
        console.error('Error listando reseñas:', e);
        setError('No se pudieron cargar las reseñas.');
      } finally {
        setLoading(false);
      }
    }
    if (initialGameId) {
      setSelectedGame({ _id: initialGameId });
      loadById(initialGameId);
    }
  }, [initialGameId, sort]);

  // selection via querystring remains supported (initialGameId)

  const handleLike = async (review) => {
    if (!isAuthenticated) {
      const next = `/community?game=${selectedGame?._id || ''}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    try {
      const res = await likeReview(review._id);
      const likesCount = res?.likesCount ?? review.likesCount;
      const liked = typeof res?.liked === 'boolean' ? res.liked : !review.liked;
      setReviews(prev => prev.map(r => r._id === review._id ? { ...r, likesCount, liked } : r));

      // transient pop effect
      setPoppedIds(prev => {
        try {
          const s = new Set(prev);
          s.add(review._id);
          return s;
        } catch { return prev; }
      });
      setTimeout(() => {
        setPoppedIds(prev => {
          try {
            const s = new Set(prev);
            s.delete(review._id);
            return s;
          } catch { return prev; }
        });
      }, 360);
    } catch (e) {
      console.error('Error al dar like:', e);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      const next = `/community?game=${selectedGame?._id || ''}`;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    try {
      setLoading(true);
      const created = await createCommunityReview(selectedGame._id, newReview);
      setReviews(prev => [created, ...prev]);
      setShowNewReview(false);
      setNewReview({ puntuacion: 5, textoResena: '' });
    } catch (e) {
      console.error('Error creando reseña:', e);
    } finally {
      setLoading(false);
    }
  };

  const Stars = ({ value = 0 }) => {
    const v = Math.max(0, Math.min(5, value));
    return (
      <div className="stars" aria-label={`Puntuación ${v} de 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={16} className={`star ${i < v ? 'filled' : ''}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="community-page">
      <div className="community-hero">
        <div>
          <h1>Comunidad</h1>
          <section className="community-callouts">
            <div className="callout">
              <h4>¿Cómo funciona?</h4>
              <p>Busca un juego y descubre reseñas de la comunidad. Puedes filtrar por más recientes, mejor puntuación o más likes.</p>
            </div>
            <div className="callout">
              <h4>¿Quieres compartir tu opinión?</h4>
              <p>Inicia sesión y escribe tu propia reseña. ¡Tu voz cuenta!</p>
            </div>
            <div className="callout">
              <h4>Puntuaciones</h4>
              <p>Las estrellas van de 1 a 5. Sé honesto y constructivo para ayudar a otros gamers.</p>
            </div>
          </section>
        </div>
      </div>

      {/* Search by game removed - using community grouped feed's search instead */}

      <div className="community-container">
        <div className="catalog-controls">
          <Toolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterGenre={filterGenre}
            setFilterGenre={setFilterGenre}
            genres={[]}
            filterPlatform={filterPlatform}
            setFilterPlatform={setFilterPlatform}
            platforms={[]}
            filterCompleted={filterCompleted}
            setFilterCompleted={setFilterCompleted}
            onClearFilters={() => { setSearchTerm(''); setFilterGenre(''); setFilterPlatform(''); setFilterCompleted(''); }}
            onSearch={() => {}}
            variant="community"
            sort={sort}
            setSort={setSort}
          />
        </div>

        {/* Insert grouped community feed (posts per game) */}
        <section className="community-feed">
          <CommunityReviews
            externalSearchTerm={searchTerm}
            externalFilterGenre={filterGenre}
            externalFilterPlatform={filterPlatform}
          />
        </section>
      </div>

      {selectedGame && (
        <section className="community-results">
          <div className="results-header">
            <h2>Reseñas de "{selectedGame.name || selectedGame.nombre || 'Juego'}"</h2>
            <div className="filters">
              <label>Ordenar:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recientes">Más recientes</option>
                <option value="mejores">Mejor puntuación</option>
                <option value="likes">Más me gusta</option>
              </select>
              <button className="btn-primary" onClick={() => setShowNewReview(true)}>Escribir reseña</button>
            </div>
          </div>

          {loading && <div className="loading">Cargando reseñas…</div>}
          {error && <div className="error">{error}</div>}

          <div className="reviews-list">
            {reviews.map(r => (
              <article key={r._id} className={`review-card ${r.liked ? 'liked' : ''}`}>
                <header className="review-header">
                  <div className="author">
                    { (r.autorId?.avatarUrl || r.autorId?.avatar) ? (
                      <img
                        src={r.autorId.avatarUrl || r.autorId.avatar}
                        alt={r.autorId?.nombre || 'Usuario'}
                        className="avatar-sm avatar-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="avatar-sm">{(r.autorId?.nombre || 'U').slice(0,1).toUpperCase()}</div>
                    ) }
                    <div>
                      <div className="author-name">{r.autorId?.nombre || 'Usuario'}</div>
                      <div className="review-date">{new Date(r.fechaCreacion).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Stars value={r.puntuacion} />
                </header>
                <p className="review-text">{r.textoResena || ''}</p>
                <footer className="review-actions">
                  <button className={`like-button ${r.liked ? 'liked' : ''} ${poppedIds.has(r._id) ? 'popped' : ''}`} onClick={() => handleLike(r)}>
                    <ThumbsUp size={16} />
                    <span>Me gusta</span>
                    <span className="like-count">{r.likesCount || 0}</span>
                  </button>
                </footer>
              </article>
            ))}
            {reviews.length === 0 && !loading && (
              <div className="empty">No hay reseñas todavía.</div>
            )}
          </div>
        </section>
      )}

      {showNewReview && (
        <div className="modal-backdrop" onClick={() => setShowNewReview(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Escribir reseña</h3>
            <form onSubmit={handleSubmitReview}>
              <label>
                Puntuación
                <select
                  value={newReview.puntuacion}
                  onChange={(e) => setNewReview(prev => ({ ...prev, puntuacion: Number(e.target.value) }))}
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrellas</option>)}
                </select>
              </label>
              <label>
                Reseña
                <textarea
                  value={newReview.textoResena}
                  onChange={(e) => setNewReview(prev => ({ ...prev, textoResena: e.target.value }))}
                  placeholder="Escribe tu opinión sobre el juego"
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNewReview(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* callouts moved into the hero area above */}
    </div>
  );
};

export default CommunityPage;
