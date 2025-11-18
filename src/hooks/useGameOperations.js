import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';
import {
  getReviews,
  createGame,
  linkOrCreateGame,
  updateGame,
  deleteGame as apiDeleteGame,
  deleteUserGame,
  createReview,
  createCommunityReview,
  deleteReview as apiDeleteReview,
  // usergames
  getUserGames,
  getGame,
  upsertUserGame,
  updateUserGame
} from '../services/api';

export const useGameOperations = (isAuthenticated = false) => {
  const { success, error: showError, confirm } = useToast();

  // State
  const [games, setGames] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('');
  const [error, setError] = useState(null);
  // Initialize loading flags to true when authenticated so we don't render
  // empty statistics before the first load completes (avoids flicker)
  const [loadingStates, setLoadingStates] = useState({
    games: Boolean(isAuthenticated),
    reviews: Boolean(isAuthenticated),
    saving: false,
    deleting: false
  });

  // Load games with filters
  const loadGames = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoadingStates(prev => ({ ...prev, games: true }));
    try {
      // Load user library items (userGames) and map to UI-friendly shape
      const ugData = await getUserGames({ estado: filterCompleted || undefined });
      const ugs = Array.isArray(ugData) ? ugData : (Array.isArray(ugData?.userGames) ? ugData.userGames : []);

      // The backend usually returns populated gameId; but in some cases it may be an ObjectId.
      // Normalize: if gameId is populated, use its fields; otherwise, fetch the missing games.
      const mapped = ugs.map(u => ({ rawUserGame: u }));

      // Identify missing game IDs that are not populated objects
      const needFetch = mapped
        .map(m => {
          const g = m.rawUserGame.gameId;
          // If gameId is an object with titulo, assume populated
          if (g && typeof g === 'object' && g.titulo) return null;
          // else if gameId exists, return as string
          return g ? String(g) : null;
        })
        .filter(Boolean);

      // Deduplicate
      const uniqueToFetch = [...new Set(needFetch)];

      const fetchedById = {};
      if (uniqueToFetch.length > 0) {
        try {
          const fetched = await Promise.all(uniqueToFetch.map(id => getGame(id).catch(err => {
            console.warn('Failed to fetch game detail for', id, err);
            return null;
          })));
          fetched.forEach((f, i) => { if (f) fetchedById[uniqueToFetch[i]] = f; });
        } catch (e) {
          console.warn('Error fetching missing games', e);
        }
      }

      const final = mapped.map(({ rawUserGame: u }) => {
        const g = u.gameId;
        const populated = (g && typeof g === 'object' && g.titulo) ? g : (g ? fetchedById[String(g)] : null) || null;

        // If the referenced Game document is missing (deleted), show a sensible placeholder
        if (!populated) {
          return {
            _id: String(g) || `usergame-${u._id}`,
            titulo: 'Juego eliminado',
            genero: null,
            plataforma: null,
            añoLanzamiento: null,
            desarrollador: null,
            imagenPortada: null,
            descripcion: null,
            // user-specific
            userGameId: u._id,
            estado: u.estado,
            horasTotalesJugadas: u.horasTotalesJugadas !== undefined ? u.horasTotalesJugadas : null,
            fechaCompletado: u.fechaCompletado || null,
            reseña: u.reseña || null,
            ratingUsuario: u.ratingUsuario || null,
            completado: u.estado === 'completado',
            rawgId: null,
            esJuegoImportado: false,
            ownerId: null,
            _deletedGame: true
          };
        }

        return {
          _id: populated._id || String(g),
          titulo: populated.titulo,
          genero: populated.genero,
          plataforma: populated.plataforma,
          añoLanzamiento: populated.añoLanzamiento,
          desarrollador: populated.desarrollador,
          imagenPortada: populated.imagenPortada,
          descripcion: populated.descripcion,
          rawgId: populated.rawgId,
          esJuegoImportado: populated.esJuegoImportado || false,
          ownerId: populated.ownerId || null,
          // user-specific
          userGameId: u._id,
          estado: u.estado,
          horasTotalesJugadas: u.horasTotalesJugadas !== undefined ? u.horasTotalesJugadas : null,
          fechaCompletado: u.fechaCompletado || null,
          reseña: u.reseña || null,
          ratingUsuario: u.ratingUsuario || null,
          completado: u.estado === 'completado'
        };
      });

      setGames(final);
      setError(null);
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, games: false }));
    }
  }, [filterCompleted, isAuthenticated]);

  // Load reviews
  const loadReviews = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoadingStates(prev => ({ ...prev, reviews: true }));
    try {
      const data = await getReviews();
      setReviews(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
      throw error;
    } finally {
      setLoadingStates(prev => ({ ...prev, reviews: false }));
    }
  }, [isAuthenticated]);

  // Load data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      // Kick off both loads together; keep loading flags accurate
      loadGames();
      loadReviews();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadGames, loadReviews, isAuthenticated]);

  // Game operations
  const saveGame = async (gameData, editingGame = null) => {
    setLoadingStates(prev => ({ ...prev, saving: true }));
    setError(null);

    try {
      // Sanitization to match backend validators
      const sanitize = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : v);
      const cleanData = {
        titulo: sanitize(gameData.titulo, 200),
        genero: sanitize(gameData.genero || '', 100) || null,
        plataforma: sanitize(gameData.plataforma || '', 100) || null,
        añoLanzamiento: (gameData.añoLanzamiento || gameData.añoLanzamiento === 0) ? parseInt(gameData.añoLanzamiento) : null,
        desarrollador: sanitize(gameData.desarrollador || '', 200) || null,
        imagenPortada: typeof gameData.imagenPortada === 'string' && gameData.imagenPortada.trim() !== '' ? gameData.imagenPortada.trim() : undefined,
        descripcion: sanitize(gameData.descripcion || '', 1000) || null,
        // Support only user-reported total hours (horasTotalesJugadas). RAWG playtime is ignored.
        horasTotalesJugadas: (gameData.horasTotalesJugadas !== undefined && gameData.horasTotalesJugadas !== null) ? parseFloat(gameData.horasTotalesJugadas) : undefined,
        estado: gameData.estado || (gameData.completado ? 'completado' : 'pendiente'),
        completado: Boolean(gameData.completado)
      };

      if (editingGame) {
        await updateGame(editingGame._id, cleanData);
      } else {
        console.log('[useGameOperations] createGame payload:', cleanData);
        // If this payload originates from an imported catalog item, prefer link-or-create
        const rawgId = gameData.rawgId || gameData._rawgId || null;
        let created;
        if (rawgId) {
          console.log('[useGameOperations] linkOrCreate payload (imported):', { rawgId, ...cleanData });
          created = await linkOrCreateGame({ rawgId, ...cleanData });
        } else {
          created = await createGame(cleanData);
        }
        console.log('[useGameOperations] createGame response:', created);
        // After creating a Game owned by the user, ensure there's a UserGame entry
        // so it appears in the user's library. Backend requires a valid gameId.
        try {
          const gameId = created && (created._id || created.id) ? (created._id || created.id) : null;
          if (gameId) {
            const estado = cleanData.completado ? 'completado' : 'pendiente';
            const payload = { gameId, estado };
            if (cleanData.horasTotalesJugadas !== undefined && cleanData.horasTotalesJugadas !== null) payload.horasTotalesJugadas = cleanData.horasTotalesJugadas;
            await upsertUserGame(payload);
          } else {
            console.warn('[useGameOperations] Created game did not return an id; skipping userGame upsert');
          }
        } catch (e) {
          console.warn('[useGameOperations] Failed to upsert userGame after creating game:', e);
        }
      }

      await loadGames();
      success(editingGame ? 'Juego actualizado correctamente' : 'Juego agregado correctamente');
    } catch (error) {
      console.error('Error saving game:', error);
      // Prefer backend validation messages when available
      const status = error?.status;
      const body = error?.body;
      if (body && Array.isArray(body.errors) && body.errors.length > 0) {
        const msgs = body.errors.map(e => e.msg || e.message || JSON.stringify(e)).join('\n');
        showError(msgs);
      } else if (body && body.message) {
        showError(body.message);
      } else if (status) {
        showError(`Error del servidor (${status}). Intenta de nuevo.`);
      } else {
        showError('Error al guardar el juego. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  };

  const deleteGame = async (id) => {
    const confirmed = await confirm('¿Eliminar este juego y todas sus reseñas?');

    if (confirmed) {
      setLoadingStates(prev => ({ ...prev, deleting: true }));
      setError(null);

      try {
        // If id is not a valid Mongo ObjectId, assume it's a local-only/imported entry
        const isObjectId = typeof id === 'string' && (/^[a-fA-F0-9]{24}$/.test(id));
        if (!isObjectId) {
          // Remove from local state and refresh lists without calling backend
          setGames(prev => prev.filter(g => g._id !== id && g.userGameId !== id));
          await loadReviews();
          success('Juego eliminado localmente');
          return;
        }

        await apiDeleteGame(id);
        await loadGames();
        await loadReviews();
        success('Juego eliminado correctamente');
      } catch (error) {
        console.error('Error deleting game:', error);
        // If backend reports 404, consider it already removed and update UI
        const status = error?.status;
        if (status === 404) {
          setGames(prev => prev.filter(g => g._id !== id && g.userGameId !== id));
          await loadReviews();
          success('El juego no se encontró en el servidor; lo eliminé localmente');
        } else {
          // Generic error
          const msg = error?.body?.message || 'Error al eliminar el juego. Por favor, inténtalo de nuevo.';
          showError(msg);
        }
      } finally {
        setLoadingStates(prev => ({ ...prev, deleting: false }));
      }
    }
  };

  // Remove a userGame (entry in user's library) by its id
  const removeUserGame = async (userGameId) => {
    const confirmed = await confirm('¿Eliminar este juego de tu biblioteca?');
    if (!confirmed) return;

    setLoadingStates(prev => ({ ...prev, deleting: true }));
    setError(null);
    try {
      if (!userGameId || typeof userGameId !== 'string') {
        // local removal fallback
        setGames(prev => prev.filter(g => g.userGameId !== userGameId && g._id !== userGameId));
        success('Entrada eliminada localmente');
        return;
      }

      await deleteUserGame(userGameId);
      await loadGames();
      success('Juego eliminado de tu biblioteca');
    } catch (err) {
      console.error('Error removing userGame:', err);
      if (err?.status === 404) {
        setGames(prev => prev.filter(g => g.userGameId !== userGameId && g._id !== userGameId));
        success('La entrada ya no existe; eliminada localmente');
      } else {
        showError(err?.body?.message || 'Error al eliminar la entrada de la biblioteca');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }));
    }
  };

  // Ahora acepta un segundo argumento: horas (opcional)
  const toggleCompleted = async (game, horas) => {
    // If trying to mark as completed, use completeGame flow which validates hours
    if (!game.completado) {
      await completeGame(game, horas);
      return;
    }

    // Otherwise (unmark completed) allow simple toggle
    // Unmark completed: update the userGame record if present
    try {
      setGames(prevGames => prevGames.map(g => g._id === game._id ? { ...g, completado: false, estado: 'jugando' } : g));
      if (game.userGameId) {
        await updateUserGame(game.userGameId, { estado: 'jugando' });
      } else {
        // If there's no userGame, create one with estado 'jugando' (adds to library)
        await upsertUserGame({ gameId: game._id, estado: 'jugando' });
      }
      success('Juego marcado como no completado');
    } catch (error) {
      console.error('Error updating userGame:', error);
      setGames(prevGames => prevGames.map(g => g._id === game._id ? { ...g, completado: true, estado: 'completado' } : g));
      showError('Error al actualizar el estado del juego');
    }
  };

  // Complete a game with validation of hours and update stats
  // Ahora acepta horas como argumento obligatorio si no existen
  const completeGame = async (game, horas) => {
    if (!game) return;
    if (game.completado) {
      showError('Este juego ya está marcado como completado');
      return;
    }

    // Prefer horas proporcionadas, luego las del juego (horasTotalesJugadas)
    let hours = (horas !== undefined && horas !== null) ? Number(horas)
      : (game.horasTotalesJugadas !== undefined && game.horasTotalesJugadas !== null) ? Number(game.horasTotalesJugadas)
      : null;

    if (hours === null || isNaN(hours) || hours < 0) {
      showError('Debes ingresar un número válido de horas para completar el juego.');
      return;
    }

    const payload = {
      estado: 'completado',
      horasTotalesJugadas: hours,
      fechaCompletado: new Date()
    };

    try {
      // Optimistic update
      setGames(prevGames => prevGames.map(g => g._id === game._id ? { ...g, horasTotalesJugadas: hours, completado: true, estado: 'completado', fechaCompletado: payload.fechaCompletado } : g));

      if (game.userGameId) {
        await updateUserGame(game.userGameId, payload);
      } else {
        await upsertUserGame({ gameId: game._id, ...payload });
      }

      // Refresh list to ensure consistency
      await loadGames();
      success('Juego marcado como completado y horas sumadas a tus estadísticas');
    } catch (err) {
      console.error('Error completing game:', err);
      // Revert optimistic change
      setGames(prevGames => prevGames.map(g => g._id === game._id ? { ...g, completado: false, estado: game.estado || 'jugando' } : g));
      showError('No se pudo marcar el juego como completado. Intenta de nuevo.');
    }
  };

  // Review operations
  const saveReview = async (reviewData, gameId) => {
    setLoadingStates(prev => ({ ...prev, saving: true }));
    setError(null);

    try {
      // Decide whether to post to user-owned game reviews or community reviews
      // Find the game in loaded games to check if it's an imported/global game
      const localGame = games.find(g => String(g._id) === String(gameId) || String(g.userGameId) === String(gameId));
      let useCommunity = false;
      if (localGame) {
        if (localGame.esJuegoImportado || !localGame.ownerId) useCommunity = true;
      } else {
        // If not found locally, try fetching game detail to inspect ownership
        try {
          const fetched = await getGame(gameId).catch(() => null);
          if (fetched && (fetched.esJuegoImportado || !fetched.ownerId)) useCommunity = true;
        } catch (e) {
          // ignore
        }
      }

      if (useCommunity) {
        await createCommunityReview(gameId, reviewData);
      } else {
        await createReview(gameId, reviewData);
      }
      await loadReviews();
      success('Reseña agregada correctamente');
    } catch (error) {
      console.error('Error saving review:', error);
      showError('Error al guardar la reseña. Por favor, inténtalo de nuevo.');
    } finally {
      setLoadingStates(prev => ({ ...prev, saving: false }));
    }
  };

  const deleteReview = async (id) => {
    const confirmed = await confirm('¿Eliminar esta reseña?');

    if (confirmed) {
      setLoadingStates(prev => ({ ...prev, deleting: true }));
      setError(null);

      try {
        await apiDeleteReview(id);
        await loadReviews();
        success('Reseña eliminada correctamente');
      } catch (error) {
        console.error('Error deleting review:', error);
        showError('Error al eliminar la reseña. Por favor, inténtalo de nuevo.');
      } finally {
        setLoadingStates(prev => ({ ...prev, deleting: false }));
      }
    }
  };

  // Update a single review in local state (used to reflect edits without reload)
  const updateReviewLocal = (updated) => {
    if (!updated || !updated._id) return;
    setReviews(prev => prev.map(r => (String(r._id) === String(updated._id) ? { ...r, ...updated } : r)));
  };

  // Utility functions
  const getGameReviews = (gameId) => {
    return reviews.filter(r => r.juegoId === gameId);
  };

  const getStats = () => {
    const completed = games.filter(g => g.completado).length;
    // Total hours: sum horasTotalesJugadas for completed games
    const totalHours = games.reduce((sum, g) => {
      if (!g.completado) return sum;
      const h = (g.horasTotalesJugadas !== undefined && g.horasTotalesJugadas !== null) ? Number(g.horasTotalesJugadas) : 0;
      return sum + (isNaN(h) ? 0 : h);
    }, 0);
    const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length).toFixed(1) : 0;
    return { completed, total: games.length, totalHours, avgRating };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGenre('');
    setFilterPlatform('');
    setFilterCompleted('');
  };

  const retryLoadData = async () => {
    setError(null);
    try {
      await Promise.all([loadGames(), loadReviews()]);
    } catch (error) {
      console.error('Retry load data error:', error);
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
    }
  };

  // Derived data
  const genres = [...new Set(games.map(g => g.genero).filter(Boolean))];
  const platforms = [...new Set(games.map(g => g.plataforma).filter(Boolean))];

  return {
    // State
    games,
    reviews,
    searchTerm,
    setSearchTerm,
    filterGenre,
    setFilterGenre,
    filterPlatform,
    setFilterPlatform,
    filterCompleted,
    setFilterCompleted,
    error,
    loadingStates,
    
    // Operations
    loadGames,
    loadReviews,
    saveGame,
    deleteGame,
  removeUserGame,
    toggleCompleted,
    saveReview,
    deleteReview,
    updateReviewLocal,
    
    // Utilities
    getGameReviews,
    getStats,
    clearFilters,
    retryLoadData,
    
    // Derived data
    genres,
    platforms
  };
};