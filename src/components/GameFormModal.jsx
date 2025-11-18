import React, { useState } from 'react';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { searchImportedGames } from '../services/api.js';

export default function GameFormModal({ game, onSave, onClose }) {
  const [formData, setFormData] = useState({
    titulo: game?.titulo || '',
    genero: game?.genero || '',
    plataforma: game?.plataforma || '',
    añoLanzamiento: game?.añoLanzamiento || '',
    desarrollador: game?.desarrollador || '',
    imagenPortada: game?.imagenPortada || '',
    descripcion: game?.descripcion || '',
    completado: game?.completado || false
  });

  // ----- Import/search state -----
  const [importQuery, setImportQuery] = useState('');
  const [importResults, setImportResults] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedImport, setSelectedImport] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Trim title to avoid sending empty or whitespace-only titles
    const clean = { ...formData, titulo: (formData.titulo || '').trim() };
    if (!clean.titulo) return; // required input should prevent this, but double-check
    // If the user selected an imported result, include its external id so backend can link-or-create
    if (selectedImport) {
      const candidate = selectedImport.id || selectedImport.rawgId || selectedImport.externalId || null;
      const numeric = candidate !== null && candidate !== undefined && Number.isFinite(Number(candidate)) ? Number(candidate) : null;
      if (numeric) clean.rawgId = numeric;
    }
    onSave(clean);
  };

  const handleSearchImport = async () => {
    const q = (importQuery || '').trim();
    if (q.length < 2) return;
    setImportLoading(true);
    try {
      const results = await searchImportedGames(q, { limit: 8 });
      setImportResults(results || []);
    } catch (err) {
      console.error('Error buscando juegos importados:', err);
      setImportResults([]);
    } finally {
      setImportLoading(false);
    }
  };

  const handleUseImported = (g) => {
    setSelectedImport(g);
    setFormData({
      titulo: g.name || g.titulo || '',
      genero: (g.genres && g.genres.length) ? g.genres[0].name : (g.genero || ''),
      plataforma: (g.platforms && g.platforms.length) ? (g.platforms[0].platform?.name || g.platforms[0].name) : (g.plataforma || ''),
      añoLanzamiento: g.released ? new Date(g.released).getFullYear() : (g.añoLanzamiento || ''),
      desarrollador: (g.developers && g.developers.length) ? g.developers[0].name : (g.desarrollador || ''),
      imagenPortada: g.background_image || g.imagenPortada || '',
      descripcion: g.short_description || g.description || g.descripcion || '',
      completado: false
    });
    setImportResults([]);
  };

  const clearImportedSelection = () => {
    setSelectedImport(null);
    // Clear the entire form so user can start a manual entry
    setFormData({
      titulo: '',
      genero: '',
      plataforma: '',
      añoLanzamiento: '',
      desarrollador: '',
      imagenPortada: '',
      descripcion: '',
      completado: false
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{game ? 'Editar Juego' : 'Agregar Juego'}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="import-search" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Buscar en catálogo público (opcional)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="search"
                placeholder="Busca por título en el catálogo..."
                value={importQuery}
                onChange={(e) => setImportQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchImport(); } }}
                className="form-control"
                style={{ flex: 1 }}
              />
              <button type="button" className="btn-secondary" onClick={handleSearchImport} disabled={importLoading}>
                {importLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {selectedImport && (
              <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src={selectedImport.background_image || selectedImport.imagenPortada || ''} alt="cover" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{selectedImport.name || selectedImport.titulo}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{(selectedImport.genres && selectedImport.genres.map(g => g.name).join(', ')) || selectedImport.genero}</div>
                </div>
                <button type="button" className="btn-secondary" onClick={clearImportedSelection}>Limpiar formulario</button>
              </div>
            )}

            {importResults && importResults.length > 0 && (
              <div className="import-results">
                {importResults.map((r, idx) => (
                  <div key={r.id ?? r.slug ?? r.name ?? `import-${idx}`} className="import-item" onClick={() => handleUseImported(r)}>
                    <img src={r.background_image || r.imagenPortada || ''} alt="cover" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    <div className="import-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{r.name || r.titulo}</div>
                        <span className="import-badge">Catálogo</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{(r.genres && r.genres.map(g => g.name).join(', ')) || r.genero}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: The Legend of Zelda"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Género</label>
                <input
                  type="text"
                  placeholder="Ej: RPG, Acción, Aventura"
                  value={formData.genero}
                  onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Plataforma</label>
                <input
                  type="text"
                  placeholder="Ej: PC, PlayStation, Xbox, Nintendo Switch"
                  value={formData.plataforma}
                  onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Año de Lanzamiento</label>
                <input
                  type="number"
                  min="1950"
                  max="2100"
                  placeholder="Ej: 2024"
                  value={formData.añoLanzamiento}
                  onChange={(e) => setFormData({ ...formData, añoLanzamiento: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Desarrollador</label>
                <input
                  type="text"
                  placeholder="Ej: Nintendo, Sony, Rockstar"
                  value={formData.desarrollador}
                  onChange={(e) => setFormData({ ...formData, desarrollador: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Portada</label>
                <ImageUpload
                  currentImage={formData.imagenPortada}
                  onImageChange={(imageUrl) => setFormData({ ...formData, imagenPortada: imageUrl })}
                  onImageRemove={() => setFormData({ ...formData, imagenPortada: '' })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Descripción</label>
                <textarea
                  placeholder="Escribe una breve descripción del juego..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="completado"
                    checked={formData.completado}
                    onChange={(e) => setFormData({ ...formData, completado: e.target.checked })}
                  />
                  <label htmlFor="completado">Juego completado</label>
                </div>
              </div>

              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {game ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}