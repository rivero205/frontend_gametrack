import React, { useEffect, useState, useMemo, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import GameGrid from '../components/GameGrid';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import GameDetailsModal from '../components/GameDetailsModal';
import { getImportedGames, createGame, linkOrCreateGame, upsertUserGame } from '../services/api.js';
import { useAuth } from '../hooks/useAuth';
import { useGameOperations } from '../hooks/useGameOperations';
import { useToast } from '../hooks/useToast';
import ReviewFormModal from '../components/ReviewFormModal';

const mapImportedToLocal = (g) => ({
  _id: g.id || g.slug || `${g.name}-${g.released || ''}`,
  rawgId: g.id || g.rawgId || null,
  titulo: g.name || g.titulo || 'Sin título',
  // Support both RAWG shape (genres/platforms/developers) and local DB shape (genero/plataforma/desarrollador)
  genero: (g.genres && g.genres.length) ? g.genres[0].name : (g.genero || g.genre || ''),
  plataforma: (g.platforms && g.platforms.length) ? (g.platforms[0].platform?.name || g.platforms[0].name) : (g.plataforma || g.platform || ''),
  añoLanzamiento: g.released ? new Date(g.released).getFullYear() : (g.añoLanzamiento || null),
  desarrollador: (g.developers && g.developers.length) ? g.developers[0].name : (g.desarrollador || g.developer || ''),
  imagenPortada: g.background_image || g.imagenPortada || '',
  descripcion: g.short_description || g.description || g.descripcion || '',
  completado: false,
  metacritic: typeof g.metacritic !== 'undefined' ? g.metacritic : null,
  released: g.released || null
});

const CatalogPage = () => {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toolbar controlled state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCompleted, setFilterCompleted] = useState(''); // unused but Toolbar expects it

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 24;
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewGame, setReviewGame] = useState(null);
  const { isAuthenticated } = useAuth();
  const { success, error: showError, info } = useToast();
  const { games: myGames, saveReview, loadGames } = useGameOperations(isAuthenticated);

  const handleSaveReview = async (reviewData) => {
    if (!reviewGame) return;
    try {
      await saveReview(reviewData, reviewGame._id);
      success('Reseña guardada en tu biblioteca');
      setShowReviewModal(false);
      setReviewGame(null);
    } catch (err) {
      console.error('Error saving review to library:', err);
      showError('Error al guardar la reseña. Intenta de nuevo.');
    }
  };

  const handleRequestReviewFromCatalog = async (game) => {
    if (!isAuthenticated) {
      info('Debes iniciar sesión para publicar una reseña.');
      return;
    }

    // Buscar si ya existe en mi biblioteca por título (y año si está disponible)
    const existing = (myGames || []).find(g => g.titulo === game.titulo && (!game.añoLanzamiento || g.añoLanzamiento === game.añoLanzamiento));
    if (existing) {
      setReviewGame(existing);
      setShowReviewModal(true);
      return;
    }

    // No existe: crear en la biblioteca y luego abrir modal para reseñar
    try {
      const payload = {
        titulo: game.titulo,
        genero: game.genero || null,
        plataforma: game.plataforma || null,
        añoLanzamiento: game.añoLanzamiento || null,
        desarrollador: game.desarrollador || null,
        imagenPortada: game.imagenPortada || null,
        descripcion: game.descripcion || null,
        completado: false
      };

      if (game.rawgId) {
        // Link or create the global Game record, then ensure user has an entry
        const linked = await linkOrCreateGame({ rawgId: game.rawgId, ...payload });
        const linkedId = linked && (linked._id || linked.id);
        const linkedIdStr = linkedId ? String(linkedId) : null;
        if (!linkedIdStr) throw new Error('Failed to link or create game');
        // Ensure user library contains this game
        await upsertUserGame({ gameId: linkedIdStr, estado: 'pendiente' });
        setReviewGame(linked);
        setShowReviewModal(true);
        success('Juego agregado a tu biblioteca. Ahora puedes reseñarlo.');
      } else {
        const created = await createGame(payload);
        const createdId = created && (created._id || created.id) ? (created._id || created.id) : null;
        if (createdId) await upsertUserGame({ gameId: String(createdId), estado: 'pendiente' });
        setReviewGame(created);
        setShowReviewModal(true);
        success('Juego agregado a tu biblioteca. Ahora puedes reseñarlo.');
      }
    } catch (err) {
      console.error('Error creando juego en biblioteca:', err);
      showError('No se pudo agregar el juego a tu biblioteca. Intenta de nuevo.');
    }
  };
  // Genre modal state
  const [genreModalOpen, setGenreModalOpen] = useState(false);
  const [modalGenre, setModalGenre] = useState('');
  const [modalGenreItems, setModalGenreItems] = useState([]);
  const prevGenreModalOpen = useRef(false);
  const [showCollections, setShowCollections] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use shared API service and Vite base env to avoid hardcoded ports
        const imported = await getImportedGames({ limit: 200, sort: '-metacritic' });
        if (cancelled) return;
        // The backend returns { success: true, juegos: [...] }.
        if (imported && Array.isArray(imported.juegos)) {
          setRaw(imported.juegos);
        } else if (imported && Array.isArray(imported.results)) {
          // Some APIs use `results`
          setRaw(imported.results);
        } else {
          // Fallback: try to find any array value in the object
          const arr = Object.values(imported).find(v => Array.isArray(v));
          setRaw(Array.isArray(arr) ? arr : []);
        }
      } catch (err) {
        console.error('Error loading imported games:', err);
        setError('No se pudo cargar el catálogo público. Intenta recargar o revisa que el backend esté corriendo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Map shapes only when needed
  const games = useMemo(() => raw.map(mapImportedToLocal), [raw]);

  const genres = useMemo(() => [...new Set(games.map(g => g.genero).filter(Boolean))].sort(), [games]);
  const platforms = useMemo(() => [...new Set(games.map(g => g.plataforma).filter(Boolean))].sort(), [games]);

  // Collections: top-rated
  const topRated = useMemo(() => (
    [...games].filter(g => typeof g.metacritic === 'number').sort((a,b) => (b.metacritic||0) - (a.metacritic||0)).slice(0,3)
  ), [games]);

  // Filtering & searching (client-side)
  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return games.filter(g => {
      if (filterGenre && g.genero !== filterGenre) return false;
      if (filterPlatform && g.plataforma !== filterPlatform) return false;
      if (filterCompleted === 'true' && !g.completado) return false;
      if (filterCompleted === 'false' && g.completado) return false;
      if (!q) return true;
      return (
        (g.titulo || '').toLowerCase().includes(q) ||
        (g.descripcion || '').toLowerCase().includes(q) ||
        (g.genero || '').toLowerCase().includes(q)
      );
    });
  }, [games, searchTerm, filterGenre, filterPlatform, filterCompleted]);

  

  // --- New: genre-based collections ---
  // Determine top genres by number of games available
  const genreCounts = useMemo(() => {
    const counts = {};
    games.forEach(g => { if (g.genero) counts[g.genero] = (counts[g.genero] || 0) + 1; });
    return counts;
  }, [games]);

  const topGenres = useMemo(() => {
    return Object.entries(genreCounts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 4)
      .map(([genre]) => genre);
  }, [genreCounts]);

  const genreCollections = useMemo(() => {
    return topGenres.map(genre => {
      const items = games
        .filter(g => g.genero === genre)
        .sort((a,b) => (b.metacritic||0) - (a.metacritic||0))
        .slice(0,6);
      return { genre, items };
    });
  }, [topGenres, games]);

  // Exclude games already shown in collections (tops + genre collections)
  const displayedIds = useMemo(() => {
    const s = new Set();
    topRated.forEach(g => s.add(g._id));
    genreCollections.forEach(c => c.items.forEach(i => s.add(i._id)));
    return s;
  }, [topRated, genreCollections]);

  const filteredExcludingCollections = useMemo(() => filtered.filter(g => !displayedIds.has(g._id)), [filtered, displayedIds]);
  const visibleExcludingCollections = filteredExcludingCollections.slice(0, page * perPage);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterGenre('');
    setFilterPlatform('');
    setFilterCompleted('');
    setShowCollections(true);
  };

  const handleApplySearch = () => {
    // When user explicitly hits Buscar, hide collections and show only search results
    setShowCollections(false);
    setPage(1);
  };

  // If searchTerm is emptied manually, restore collections view
  useEffect(() => {
    if ((searchTerm || '').trim() === '') {
      setShowCollections(true);
    }
  }, [searchTerm]);

  const handleView = (game) => {
    // If a genre modal was open, remember and hide it so the details modal appears alone
    prevGenreModalOpen.current = genreModalOpen;
    if (genreModalOpen) setGenreModalOpen(false);
    setSelectedGame(game);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedGame(null);
    // If we hid a genre modal when opening details, restore it now
    if (prevGenreModalOpen.current) {
      setGenreModalOpen(true);
      prevGenreModalOpen.current = false;
    }
  };

  // Callback passed to GameDetailsModal so it can request a refresh of my library
  const handleAddedToLibrary = async () => {
    try {
      await loadGames();
    } catch (err) {
      console.warn('Failed to refresh library after add:', err);
    }
  };

  if (loading) return <div className="catalog-page"><Loader message="Cargando catálogo público..." /></div>;

  return (
    <div className="catalog-page">
      <div className="catalog-hero">
        <BarChart3 size={56} className="hero-icon" />
        <div>
          <h1>Catálogo público</h1>
          <p>Explora juegos importados desde nuestra fuente pública. Usa búsqueda y filtros para refinar resultados.</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="catalog-controls">
        <Toolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterGenre={filterGenre}
          setFilterGenre={setFilterGenre}
          genres={genres}
          filterPlatform={filterPlatform}
          setFilterPlatform={setFilterPlatform}
          platforms={platforms}
          filterCompleted={filterCompleted}
          setFilterCompleted={setFilterCompleted}
          onClearFilters={handleClearFilters}
          onSearch={handleApplySearch}
          /* no onAddGame: public catalog must not allow adding games */
        />
      </div>

      {showCollections && (
      <section className="collections">
        <div className="collections-grid">
          <div className="collection">
            <h4 className="section-title">Top Valorados</h4>
            <GameGrid games={topRated} reviewsMap={{}} onEdit={() => {}} onDelete={() => {}} onToggleCompleted={() => {}} onAddReview={(game) => { handleRequestReviewFromCatalog(game); }} onView={handleView} readOnly />
          </div>
        </div>
  </section>
  )}

  {showCollections && (
  <section className="genre-explore">
    <h3 className="section-title">Explorar por género</h3>
        <div className="genre-grid">
          {genres.map((genre, idx) => (
            <button
              key={genre}
              className={`genre-card ${filterGenre === genre ? 'active' : ''}`}
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => {
                // Open modal showing all games of this genre
                const items = games.filter(g => g.genero === genre).sort((a,b) => (b.metacritic||0) - (a.metacritic||0));
                setModalGenre(genre);
                setModalGenreItems(items);
                setGenreModalOpen(true);
              }}
            >
              <span className="genre-name">{genre}</span>
            </button>
          ))}
        </div>
  </section>
  )}

      {/* Show results only when searching or when there are leftover results beyond collections */}
      {(!showCollections || filteredExcludingCollections.length > 0) && (
      <section className="catalog-results">
        <h3>Resultados ({!showCollections ? filtered.length : filteredExcludingCollections.length})</h3>
        {(!showCollections && filtered.length === 0) || (showCollections && visibleExcludingCollections.length === 0) ? (
          <div className="empty">No se encontraron juegos con esos filtros.</div>
        ) : (
          <GameGrid
            games={showCollections ? visibleExcludingCollections : filtered.slice(0, page * perPage)}
            reviewsMap={{}}
            onEdit={() => {}}
            onDelete={() => {}}
            onToggleCompleted={() => {}}
            onAddReview={(game) => { handleRequestReviewFromCatalog(game); }}
            onView={handleView}
            readOnly
          />
        )}

        {page < Math.max(1, Math.ceil((!showCollections ? filtered.length : filteredExcludingCollections.length) / perPage)) && (
          <div className="load-more">
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)}>Cargar más</button>
          </div>
        )}
      </section>
      )}

  <GameDetailsModal open={detailsOpen} game={selectedGame} onClose={closeDetails} onAdded={handleAddedToLibrary} />

      {showReviewModal && reviewGame && (
        <ReviewFormModal
          game={reviewGame}
          onSave={handleSaveReview}
          onClose={() => { setShowReviewModal(false); setReviewGame(null); }}
        />
      )}

      {/* Genre modal: shows all games for a selected genre */}
      {genreModalOpen && (
        <div className="modal-backdrop" onClick={() => setGenreModalOpen(false)}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Género: {modalGenre}</h3>
              <button className="icon-btn modal-close" onClick={() => setGenreModalOpen(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="modal-body">
              {modalGenreItems.length === 0 ? (
                <div className="empty">No hay juegos en este género.</div>
                  ) : (
                <GameGrid games={modalGenreItems} reviewsMap={{}} onEdit={() => {}} onDelete={() => {}} onToggleCompleted={() => {}} onAddReview={(game) => { handleRequestReviewFromCatalog(game); }} onView={handleView} readOnly />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setGenreModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
