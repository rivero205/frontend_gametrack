import React, { useState } from 'react';
import '../styles/dashboard.css';
import { Gamepad2 } from 'lucide-react';
import Toolbar from '../components/Toolbar';
import GameGrid from '../components/GameGrid';
import GameFormModal from '../components/GameFormModal';
import ReviewFormModal from '../components/ReviewFormModal';
import HoursInputModal from '../components/HoursInputModal';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../hooks/useAuth';
import { useGameOperations } from '../hooks/useGameOperations';
import { usePDFExport } from '../hooks/usePDFExport';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const {
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
    genres,
    platforms,
    loadingStates,
    error,
    retryLoadData,
    saveGame,
    saveReview,
    deleteGame,
    removeUserGame,
    toggleCompleted,
    getGameReviews,
    getStats,
    clearFilters
  } = useGameOperations(isAuthenticated);

  const { exportGamesToPDF } = usePDFExport();
  const { currentUser } = useAuth();
  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewGame, setReviewGame] = useState(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [hoursGame, setHoursGame] = useState(null);
  // Handler to trigger hours modal when needed
  const handleRequestHours = (game) => {
    setHoursGame(game);
    setShowHoursModal(true);
  };

  // Handler to confirm hours and complete the game
  const handleConfirmHours = async (hours) => {
    if (!hoursGame) return;
    await toggleCompleted(hoursGame, hours);
    setShowHoursModal(false);
    setHoursGame(null);
  };

  const handleCancelHours = () => {
    setShowHoursModal(false);
    setHoursGame(null);
  };

  const handleSaveGame = async (gameData) => {
    await saveGame(gameData, editingGame);
    setShowGameForm(false);
    setEditingGame(null);
  };

  const handleSaveReview = async (reviewData) => {
    if (!reviewGame) return;
    await saveReview(reviewData, reviewGame._id);
    setShowReviewModal(false);
    setReviewGame(null);
  };

  const handleExportPDF = async () => {
    if (games.length === 0) {
      alert('No hay juegos en tu biblioteca para exportar');
      return;
    }
    const stats = getStats();
    await exportGamesToPDF(games, reviews, stats, currentUser);
  };

  if (error) {
    return (
      <div className="dashboard-page">
        <ErrorMessage
          title="Error de conexión"
          message={error}
          onRetry={retryLoadData}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="library-view">
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
          onClearFilters={clearFilters}
          onSearch={(val) => setSearchTerm(val)}
          onAddGame={() => {
            setEditingGame(null);
            setShowGameForm(true);
          }}
          onExportPDF={handleExportPDF}
        />

        {loadingStates.games ? (
          <Loader message="Cargando juegos..." />
        ) : (
          <GameGrid
            games={
              // Client-side filtering by search term and selected filters
              games.filter(g => {
                const q = (searchTerm || '').trim().toLowerCase();
                if (q) {
                  if (!(g.titulo || '').toLowerCase().includes(q)) return false;
                }
                if (filterGenre && g.genero !== filterGenre) return false;
                if (filterPlatform && g.plataforma !== filterPlatform) return false;
                if (filterCompleted === 'true' && !g.completado) return false;
                if (filterCompleted === 'false' && g.completado) return false;
                return true;
              })
            }
            reviewsMap={Object.fromEntries(games.map(g => [g._id, getGameReviews(g._id)]))}
            onEdit={(game) => {
              setEditingGame(game);
              setShowGameForm(true);
            }}
            onDelete={(game) => {
              if (game && game._deletedGame) {
                // remove the stale userGame entry
                removeUserGame(game.userGameId);
              } else if (game && game.userGameId) {
                // This is a library item: remove the user-specific entry instead of deleting the global Game
                removeUserGame(game.userGameId);
              } else {
                // No userGameId -> assume the current user created the Game and intends to delete the global record
                deleteGame(game._id);
              }
            }}
            onToggleCompleted={(game) => {
              // Si requiere horas (no existe horasTotalesJugadas), abrir modal
              if (!game.completado && (game.horasTotalesJugadas === undefined || game.horasTotalesJugadas === null)) {
                handleRequestHours(game);
              } else {
                toggleCompleted(game);
              }
            }}
            onAddReview={(game) => {
              setReviewGame(game);
              setShowReviewModal(true);
            }}
          />
        )}
      {showHoursModal && hoursGame && (
        <HoursInputModal
          open={showHoursModal}
      initialHours={hoursGame.horasTotalesJugadas || ''}
          onConfirm={handleConfirmHours}
          onCancel={handleCancelHours}
        />
      )}

        {!loadingStates.games && games.length === 0 && (
          <div className="empty-state">
            <Gamepad2 size={64} />
            <h2>No hay juegos en tu biblioteca</h2>
            <p>¡Comienza agregando tu primer juego!</p>
          </div>
        )}
      </div>

      {showGameForm && (
        <GameFormModal
          game={editingGame}
          onSave={handleSaveGame}
          onClose={() => {
            setShowGameForm(false);
            setEditingGame(null);
          }}
        />
      )}

      {showReviewModal && reviewGame && (
        <ReviewFormModal
          game={reviewGame}
          onSave={handleSaveReview}
          onClose={() => { setShowReviewModal(false); setReviewGame(null); }}
        />
      )}
    </div>
  );
};

export default Dashboard;