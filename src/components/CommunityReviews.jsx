import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getAllCommunityReviews, likeReview } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import { useRef } from 'react';
import { createCommunityReview } from '../services/api.js';

const CommunityReviews = ({ externalSearchTerm, externalFilterGenre, externalFilterPlatform }) => {
  // useAuth will be called once below where it's actually needed
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poppedIds, setPoppedIds] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [activeNewReviewFor, setActiveNewReviewFor] = useState(null); // gameId
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [submittingNewReview, setSubmittingNewReview] = useState(false);
  const [filterRating, _setFilterRating] = useState('');
  const [sortBy, _setSortBy] = useState('date'); // 'date', 'rating', 'game', 'user'

  const searchTerm = externalSearchTerm ?? '';
  const filterGenre = externalFilterGenre ?? '';
  const filterPlatform = externalFilterPlatform ?? '';

  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalNext, setAuthModalNext] = useState('/login');

  // Load community reviews on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllCommunityReviews();
        if (cancelled) return;
        setReviews(Array.isArray(data) ? data : (data?.reviews || []));
      } catch (e) {
        console.error('Error loading community reviews', e);
        setError('No se pudieron cargar las reseñas de la comunidad.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
 
  // Group reviews by game and apply filters/sorting
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of reviews) {
      const g = r.juegoId || r.game || r.juego || {};
      const gid = String((g && (g._id || g.id)) || r.juegoId || r.gameId || r.game || r._id || Math.random());
      const gameObj = (g && typeof g === 'object') ? g : { _id: gid, titulo: r.tituloJuego || r.nombreJuego || '' };
      if (!map.has(gid)) map.set(gid, { game: gameObj, reviews: [] });
      map.get(gid).reviews.push(r);
    }

    let groups = Array.from(map.values());

    const searchLower = (searchTerm || '').toLowerCase().trim();

    groups = groups.filter(group => {
      if (filterGenre && group.game.genero && String(group.game.genero) !== String(filterGenre)) return false;
      if (filterPlatform && group.game.plataforma && String(group.game.plataforma) !== String(filterPlatform)) return false;
      if (filterRating) {
        const avg = group.reviews.reduce((s, r) => s + (Number(r.puntuacion) || 0), 0) / Math.max(1, group.reviews.length);
        if (Number(avg) < Number(filterRating)) return false;
      }

      if (searchLower) {
        const matchGame = String(group.game.titulo || group.game.name || '').toLowerCase().includes(searchLower);
        const matchReview = group.reviews.some(r =>
          String(r.textoResena || '').toLowerCase().includes(searchLower) ||
          String(r.autorId?.nombre || r.autorId?.nickname || '').toLowerCase().includes(searchLower)
        );
        if (!matchGame && !matchReview) return false;
      }
      return true;
    });

    const compareFns = {
      date: (a, b) => {
        const ta = Math.max(...a.reviews.map(r => new Date(r.fechaCreacion).getTime()));
        const tb = Math.max(...b.reviews.map(r => new Date(r.fechaCreacion).getTime()));
        return tb - ta;
      },
      rating: (a, b) => {
        const avg = arr => arr.reduce((s, r) => s + (Number(r.puntuacion) || 0), 0) / Math.max(1, arr.length);
        return avg(b.reviews) - avg(a.reviews);
      },
      game: (a, b) => String(a.game.titulo || a.game.name || '').localeCompare(String(b.game.titulo || b.game.name || '')),
      user: (a, b) => {
        const an = String(a.reviews?.[0]?.autorId?.nombre || '').toLowerCase();
        const bn = String(b.reviews?.[0]?.autorId?.nombre || '').toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      }
    };

    const cmp = compareFns[sortBy] || compareFns.date;
    groups.sort(cmp);
    return groups;
  }, [reviews, searchTerm, filterGenre, filterPlatform, filterRating, sortBy]);
  

  // Debug: show grouped result when it changes
  useEffect(() => {
    try {
      console.debug('[CommunityReviews] grouped count', grouped.length, grouped.map(g => ({ id: g.game._id || g.game.id, title: g.game.titulo || g.game.name, reviews: g.reviews.length })));
    } catch (e) {
      console.debug('[CommunityReviews] grouped debug error', e);
    }
  }, [grouped]);

  // Try to resolve missing user data (avatarUrl/nickname) by fetching user info
  const fetchedUsersRef = useRef(new Set());
  useEffect(() => {
    const BASE = import.meta.env.VITE_API_BASE || '/api';
    const missing = new Set();
    for (const r of reviews) {
      const a = r.autorId;
      if (!a) continue;
      const hasAvatar = Boolean(a.avatarUrl || a.avatar);
      const hasNickname = Boolean(a.nickname);
      const id = a._id || a;
      if (!hasAvatar || !hasNickname) {
        if (id && !fetchedUsersRef.current.has(String(id))) missing.add(String(id));
      }
    }
    if (missing.size === 0) return;

    let cancelled = false;
    (async () => {
      const users = {};
      await Promise.all(Array.from(missing).map(async (id) => {
        try {
          const res = await fetch(`${BASE}/users/${id}`);
          if (!res.ok) return;
          const data = await res.json();
          users[id] = data;
        } catch {
          // ignore individual failures
        }
      }));
      if (cancelled) return;
      if (Object.keys(users).length === 0) {
        // mark as fetched to avoid retrying repeatedly
        Array.from(missing).forEach(id => fetchedUsersRef.current.add(id));
        return;
      }
      setReviews(prev => prev.map(r => {
        const a = r.autorId;
        const id = String((a && (a._id || a)) || '');
        if (users[id]) {
          fetchedUsersRef.current.add(id);
          return { ...r, autorId: { ...(typeof a === 'object' ? a : {}), ...users[id] } };
        }
        return r;
      }));
    })();

    return () => { cancelled = true; };
  }, [reviews]);

  // clearFilters removed; toolbar controls filters externally

  

  // Small Avatar component to manage image load errors per comment
  const Avatar = ({ src, alt, initials }) => {
    const [imgError, setImgError] = useState(false);
    // Mirror the ProfileDropdown behavior: inline styles for exact sizing + object-fit
    if (src && !imgError) {
      return (
        <img
          src={src}
          alt={alt}
          style={{ width: 40, height: 40, borderRadius: 9999, objectFit: 'cover' }}
          onError={() => setImgError(true)}
          loading="lazy"
          decoding="async"
        />
      );
    }
    return (
      <div className="avatar" style={{ width: 40, height: 40, borderRadius: 9999 }}>{initials}</div>
    );
  };

  // Stars input for visual rating selection
  const StarsInput = ({ value = 5, onChange }) => {
    const [hover, setHover] = useState(0);
    const set = (v) => {
      if (onChange) onChange(v);
    };
    return (
      <div className="stars-input stars" role="radiogroup" aria-label="Puntuación" style={{ gap: '10px', display: 'inline-flex' }}>
        {[...Array(5)].map((_, i) => {
          const v = i + 1;
          const filled = hover ? v <= hover : v <= value;
          return (
            <button
              key={v}
              type="button"
              aria-checked={value === v}
              role="radio"
              className={`star-button${filled ? ' filled' : ''}`}
              onClick={() => set(v)}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              title={`${v} de 5`}
              style={{ padding: 0, background: 'none', border: 'none', marginRight: i < 4 ? '10px' : 0 }}
            >
              <Star
                size={20}
                className={`star${filled ? ' filled' : ''}`}
                fill={filled ? '#fbbf24' : '#fff'}
                stroke={filled ? '#fbbf24' : '#fff'}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) return <Loader message="Cargando reseñas de la comunidad..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  const handleLike = async (review) => {
    if (!isAuthenticated) {
      setAuthModalNext(`/login?next=/community`);
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await likeReview(review._id);
      const likesCount = res?.likesCount ?? review.likesCount;
      const liked = typeof res?.liked === 'boolean' ? res.liked : !review.liked;
      // update local reviews state (count + liked flag)
      setReviews(prev => prev.map(r => r._id === review._id ? { ...r, likesCount, liked } : r));

      // trigger transient pop animation for this review's button
      setPoppedIds(prev => {
        try {
          const s = new Set(prev);
          s.add(review._id);
          return s;
        } catch {
          return prev;
        }
      });
      setTimeout(() => {
        setPoppedIds(prev => {
          try {
            const s = new Set(prev);
            s.delete(review._id);
            return s;
          } catch {
            return prev;
          }
        });
      }, 360);
    } catch (e) {
      console.error('Error liking review', e);
    }
  };

  const openNewReview = (gameId) => {
    if (!isAuthenticated) {
      setAuthModalNext(`/login?next=/community`);
      setAuthModalOpen(true);
      return;
    }
    setActiveNewReviewFor(gameId);
    setNewReviewContent('');
    setNewReviewRating(5);
  };

  const handleSubmitNewReview = async (gameId) => {
    if (!isAuthenticated) {
      setAuthModalNext(`/login?next=/community`);
      setAuthModalOpen(true);
      return;
    }
    if (!gameId) return;
    if (!newReviewContent.trim()) return;
    try {
      setSubmittingNewReview(true);
      const payload = { puntuacion: newReviewRating, textoResena: newReviewContent };
      const created = await createCommunityReview(gameId, payload);
      // Ensure the new review has the populated game object for instant grouping
      let gameObj = null;
      for (const group of grouped) {
        if (String(group.game._id || group.game.id) === String(gameId)) {
          gameObj = group.game;
          break;
        }
      }
      // Ensure autorId is populated with currentUser for instant display
      const newReview = {
        ...created,
        juegoId: gameObj || created.juegoId,
        autorId: currentUser || created.autorId
      };
      setReviews(prev => [newReview, ...prev]);
      setActiveNewReviewFor(null);
    } catch (e) {
      console.error('Error creando reseña comunitaria', e);
    } finally {
      setSubmittingNewReview(false);
    }
  };

  return (
    <div className="community-reviews">
      <ConfirmDialog
        open={authModalOpen}
        title="Necesitas iniciar sesión"
        message="Para dar like o escribir una reseña debes iniciar sesión. ¿Quieres ir a la página de inicio de sesión?"
        confirmLabel="Ir al login"
        confirmClass="btn-primary"
        onCancel={() => setAuthModalOpen(false)}
        onConfirm={() => { setAuthModalOpen(false); navigate(authModalNext); }}
      />
      <div className="reviews-header" />

      {grouped.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={64} />
          <h3>No hay reseñas disponibles</h3>
          <p>¡Sé el primero en compartir tu experiencia!</p>
        </div>
      ) : (
        <div className="community-posts">
          {grouped.map(group => (
            <section key={group.game._id || group.game.id} className="game-post">
              <header className="game-post-header">
                {group.game.imagenPortada && (
                  <img src={group.game.imagenPortada} alt={group.game.titulo || group.game.name} className="game-cover" onError={(e) => e.target.style.display = 'none'} />
                )}
                <div className="game-info">
                  <h3>{group.game.titulo || group.game.name || 'Juego'}</h3>
                    <div className="meta">
                      {group.game.genero && <span className="badge badge-genre">{group.game.genero}</span>}
                      {group.game.plataforma && <span className="badge badge-platform">{group.game.plataforma}</span>}
                      <span className="badge badge-count">{group.reviews.length} reseña{group.reviews.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="game-actions">
                      <button className="btn-secondary" onClick={() => openNewReview(group.game._id || group.game.id)}>Escribir reseña</button>
                    </div>
                </div>
              </header>

              {activeNewReviewFor === (group.game._id || group.game.id) && (
                <div className="new-review-form">
                  {/* Header with small avatar + user info for context */}
                  <div className="new-review-header">
                    {currentUser ? (
                      <Avatar
                        src={currentUser?.avatarUrl || currentUser?.avatar}
                        alt={(currentUser?.nickname || currentUser?.nombre || 'Tú') + ' avatar'}
                        initials={((currentUser?.nickname || currentUser?.nombre || 'T').slice(0,1) || 'T').toUpperCase()}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40 }} />
                    )}
                    <div className="new-review-user">
                      <div className="name">{currentUser?.nickname || currentUser?.nombre || 'Tú'}</div>
                      <div className="hint">Escribe una reseña pública para este juego</div>
                    </div>
                  </div>

                  <label style={{ display: 'block', marginBottom: 6 }}>Puntuación</label>
                  <StarsInput value={newReviewRating} onChange={setNewReviewRating} />

                  <label style={{ display: 'block', margin: '6px 0' }}>Reseña</label>
                  <textarea
                    value={newReviewContent}
                    onChange={(e) => setNewReviewContent(e.target.value)}
                    placeholder="Escribe tu reseña..."
                    rows={4}
                    style={{ width: '100%' }}
                    maxLength={1000}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        handleSubmitNewReview(group.game._id || group.game.id);
                      }
                    }}
                    autoFocus
                  />

                  <div className="new-review-footer">
                    <div className="char-count">{newReviewContent.length}/1000</div>
                    <div className="actions">
                      <button className="btn-primary" disabled={submittingNewReview || !newReviewContent.trim()} onClick={() => handleSubmitNewReview(group.game._id || group.game.id)}>{submittingNewReview ? 'Enviando...' : 'Publicar'}</button>
                      <button className="btn-secondary" onClick={() => setActiveNewReviewFor(null)}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="comments-thread">
                {(() => {
                  const gid = String(group.game._id || group.game.id || '');
                  const isExpanded = expandedGroups.has(gid);
                  // Determine the most popular review (by likes), tie-breaker: most recent
                  const sorted = [...group.reviews].sort((a, b) => {
                    const la = Number(a.likesCount || 0);
                    const lb = Number(b.likesCount || 0);
                    if (lb !== la) return lb - la; // more likes first
                    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime(); // newer first
                  });
                  const topReview = sorted[0];

                  const reviewsToShow = isExpanded ? sorted : (topReview ? [topReview] : []);
                  const longTextThreshold = 240;
                  const needsToggle = group.reviews.length > 1 || (topReview && topReview.textoResena && topReview.textoResena.length > longTextThreshold);

                  return (
                    <>
                      {reviewsToShow.map(r => (
                        <article key={r._id} className={`comment ${r.liked ? 'liked' : ''}`}>
                          <div className="comment-left">
                            <Avatar
                              src={r.autorId?.avatarUrl || r.autorId?.avatar}
                              alt={(r.autorId?.nickname || r.autorId?.nombre || 'Usuario') + ' avatar'}
                              initials={((r.autorId?.nickname || r.autorId?.nombre || 'U').slice(0,1) || 'U').toUpperCase()}
                            />
                          </div>
                          <div className="comment-body">
                            <div className="comment-meta">
                              <strong className="author-name">{r.autorId?.nickname || r.autorId?.nombre || 'Usuario'}</strong>
                              <span className="comment-date">{new Date(r.fechaCreacion).toLocaleDateString()}</span>
                              <span className="comment-rating stars">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={`star${i < (r.puntuacion || 0) ? ' filled' : ''}`}
                                    fill={i < (r.puntuacion || 0) ? '#fbbf24' : 'none'}
                                    stroke={i < (r.puntuacion || 0) ? '#fbbf24' : '#fff'}
                                  />
                                ))}
                              </span>
                            </div>
                            <p className={`comment-text ${isExpanded ? 'full' : 'clamped'}`}>{r.textoResena}</p>
                            <div className="comment-actions">
                              <button className={`like-button ${r.liked ? 'liked' : ''} ${poppedIds.has(r._id) ? 'popped' : ''}`} onClick={() => handleLike(r)}>
                                <ThumbsUp size={14} />
                                <span className="like-count">{r.likesCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}

                      {needsToggle && (
                        <div className="reviews-toggle">
                          {!isExpanded ? (
                            <button className="show-more-btn" onClick={() => setExpandedGroups(prev => new Set(prev).add(gid))}>
                              Ver más
                            </button>
                          ) : (
                            <button className="show-more-btn" onClick={() => setExpandedGroups(prev => {
                              const s = new Set(prev);
                              s.delete(gid);
                              return s;
                            })}>
                              Mostrar menos
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityReviews;
