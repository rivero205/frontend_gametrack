import React from 'react';
import { Search, X, Download, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Toolbar({
  searchTerm, setSearchTerm,
  filterGenre, setFilterGenre, genres = [],
  filterPlatform, setFilterPlatform, platforms = [],
  filterCompleted, setFilterCompleted,
  onClearFilters, onExportPDF, onSearch, onAddGame,
  // community variant
  variant, // when 'community' shows community-specific controls
  sort, setSort
}) {
  const { isAuthenticated } = useAuth();
  return (
    <div className={`toolbar ${variant === 'community' ? 'toolbar--community' : ''}`}>
      <div className="search-box">
        <form onSubmit={(e) => { e.preventDefault(); if (onSearch) onSearch(searchTerm); }} className="search-form">
          <Search size={20} />
          <input
            type="text"
            placeholder={variant === 'community' ? 'Busca un juego y descubre reseñas de la comunidad...' : 'Buscar juegos...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-search" aria-label="Buscar">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div className="filters">
        {variant === 'community' ? (
          // Community-specific filtering/sorting: sort by recientes/mejores/likes
          <>
            <label style={{ marginRight: 8 }}>Ordenar:</label>
            <select value={sort || 'recientes'} onChange={(e) => setSort && setSort(e.target.value)}>
              <option value="recientes">Más recientes</option>
              <option value="mejores">Mejor puntuación</option>
              <option value="likes">Más likes</option>
            </select>
          </>
        ) : (
          // Default toolbar with genres/platforms/completed
          <>
            <select value={filterGenre} onChange={(e) => setFilterGenre && setFilterGenre(e.target.value)}>
              <option value="">Todos los géneros</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select value={filterPlatform} onChange={(e) => setFilterPlatform && setFilterPlatform(e.target.value)}>
              <option value="">Todas las plataformas</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {isAuthenticated && (
              <select value={filterCompleted} onChange={(e) => setFilterCompleted && setFilterCompleted(e.target.value)}>
                <option value="">Todos los juegos</option>
                <option value="true">Completados</option>
                <option value="false">Por completar</option>
              </select>
            )}

            {(searchTerm || filterGenre || filterPlatform || filterCompleted) && (
              <button className="clear-filters" onClick={onClearFilters}>
                <X size={16} /> Limpiar
              </button>
            )}
          </>
        )}
      </div>

      <div className="toolbar-actions">
        {onAddGame && (
          <button className="btn-primary" onClick={onAddGame} aria-label="Agregar juego">
            <Plus size={18} /> Agregar Juego
          </button>
        )}
        {onExportPDF && (
          <button className="btn-secondary" onClick={onExportPDF}>
            <Download size={18} /> Exportar PDF
          </button>
        )}
      </div>
    </div>
  );
}
