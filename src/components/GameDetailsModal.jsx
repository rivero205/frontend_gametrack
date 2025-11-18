import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { createGame, upsertUserGame, linkOrCreateGame } from '../services/api';

export default function GameDetailsModal({ open, game, onClose, onAdded }) {
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const [adding, setAdding] = useState(false);

  const handleAddToLibrary = async () => {
    if (!isAuthenticated) {
      showError('Debes iniciar sesión para agregar juegos a tu biblioteca');
      return;
    }
    setAdding(true);
    try {
      // Map incoming data
      const raw = {
        titulo: game.titulo || game.name || '',
        genero: (game.genres && game.genres.length) ? game.genres[0].name : (game.genero || ''),
        plataforma: (game.platforms && game.platforms.length) ? (game.platforms[0].platform?.name || game.platforms[0].name) : (game.plataforma || ''),
        añoLanzamiento: game.released ? new Date(game.released).getFullYear() : (game.añoLanzamiento || null),
        desarrollador: (game.developers && game.developers.length) ? game.developers[0].name : (game.desarrollador || ''),
        imagenPortada: game.imagenPortada || game.background_image || '',
        descripcion: game.descripcion || game.short_description || game.description || '',
        completado: false
      };

      // Sanitize according to backend validators
      const now = new Date().getFullYear();
      const sanitize = (str, max) => (typeof str === 'string' ? str.trim().slice(0, max) : '');

      const payload = {
        titulo: sanitize(raw.titulo, 200) || undefined,
        genero: sanitize(raw.genero, 100) || undefined,
        plataforma: sanitize(raw.plataforma, 100) || undefined,
        añoLanzamiento: (raw.añoLanzamiento && Number.isFinite(Number(raw.añoLanzamiento))) ? Math.max(1950, Math.min(Number(raw.añoLanzamiento), now + 5)) : undefined,
        desarrollador: sanitize(raw.desarrollador, 200) || undefined,
        imagenPortada: undefined,
        descripcion: sanitize(raw.descripcion, 1000) || undefined,
        completado: false
      };

      // Validate portada: allow data URL or valid URL, otherwise omit
      try {
        if (payload.imagenPortada === undefined) {
          const candidate = (raw.imagenPortada || '').trim();
          if (candidate) {
            if (candidate.startsWith('data:image/')) {
              payload.imagenPortada = candidate;
            } else {
              // try URL
              try { new URL(candidate); payload.imagenPortada = candidate; } catch { /* invalid URL -> omit */ }
            }
          }
        }
      } catch {
        // ignore
      }

      // Remove undefined fields so backend receives only provided values
      const finalPayload = Object.fromEntries(Object.entries(payload).filter(([, v]) => typeof v !== 'undefined'));

      console.log('[GameDetailsModal] add -> raw:', raw);
      console.log('[GameDetailsModal] add -> finalPayload (sanitized):', finalPayload);

      // If this game comes from the global catalog (has _id and rawgId/esJuegoImportado),
      // create a userGames entry instead of duplicating a Game document.
      // Determine whether provided game._id looks like a real Mongo ObjectId
      const maybeId = game && game._id ? String(game._id) : null;
      const isValidObjectId = maybeId ? /^[a-fA-F0-9]{24}$/.test(maybeId) : false;

      if (game && isValidObjectId) {
        // Game has a local real Mongo _id -> link by its id
        const gameId = maybeId;
        console.log('[GameDetailsModal] upsert payload (existing local game):', { gameId, estado: 'pendiente' });
        await upsertUserGame({ gameId, estado: 'pendiente' });
        success('Juego agregado a tu biblioteca');
        // Notify parent to refresh library view if provided
        try { if (typeof onAdded === 'function') await onAdded(); } catch (e) { console.warn('onAdded callback failed', e); }
      } else if (game && (game.rawgId || game.esJuegoImportado || maybeId)) {
        // Game comes from external catalog but we don't have a local _id yet.
        // Use link-or-create endpoint to avoid duplicating the game document.
        // Try several candidate fields for an external RAWG id
        const rawgIdCandidate = (game && (game.rawgId ?? game.id ?? game.externalId ?? game.external_id ?? game._rawgId)) || null;
        const linkPayload = {
          rawgId: rawgIdCandidate,
          titulo: finalPayload.titulo,
          genero: finalPayload.genero,
          plataforma: finalPayload.plataforma,
          añoLanzamiento: finalPayload.añoLanzamiento,
          desarrollador: finalPayload.desarrollador,
          imagenPortada: finalPayload.imagenPortada || game.imagenPortada || game.background_image,
          descripcion: finalPayload.descripcion || game.descripcion || game.short_description || '',
        };

        if (!linkPayload.rawgId) {
          console.warn('[GameDetailsModal] No rawgId found for catalog item, falling back to createGame to avoid 400');
          const created = await createGame(finalPayload);
          const createdIdRaw = created && (created._id || created.id) ? (created._id || created.id) : null;
          const createdId = createdIdRaw ? String(createdIdRaw) : null;
          if (!createdId) throw new Error('Failed to create local game record');
          await upsertUserGame({ gameId: createdId, estado: 'pendiente' });
        } else {
          const linked = await linkOrCreateGame(linkPayload);
          const linkedId = linked && (linked._id || linked.id);
          const linkedIdStr = linkedId ? String(linkedId) : null;
          if (!linkedIdStr) {
            throw new Error('Failed to link or create game record');
          }
          await upsertUserGame({ gameId: linkedIdStr, estado: 'pendiente' });
        }
        success('Juego agregado a tu biblioteca');
        try { if (typeof onAdded === 'function') await onAdded(); } catch (e) { console.warn('onAdded callback failed', e); }
      } else {
        // Fallback: create as a new game owned by the user
        const res = await createGame(finalPayload);
        console.log('[GameDetailsModal] createGame response:', res);
        success('Juego agregado a tu biblioteca');
      }
  try { onClose(); } catch (e) { console.warn('onClose failed', e); }
    } catch (err) {
      console.error('[GameDetailsModal] Error añadiendo juego desde catálogo:', err);
      try {
        if (err && err.body) console.error('[GameDetailsModal] API error body:', err.body);
      } catch (logErr) {
        console.error('[GameDetailsModal] Error logging err.body', logErr);
      }
      // If backend sent array of validation errors, present them joined
      const apiErrors = err?.body?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const msgs = apiErrors.map(e => e.msg || e.message || JSON.stringify(e)).join('\n');
        showError(msgs);
      } else {
        const userMessage = err?.body?.message || err?.message || 'No se pudo agregar el juego. Intenta de nuevo.';
        showError(userMessage);
      }
    } finally {
      setAdding(false);
    }
  };

  if (!open || !game) return null;

  const backdropStyle = { zIndex: 999999, position: 'fixed', inset: 0 };
  const modalStyle = { zIndex: 1000000 };

  const modalJsx = (
    <div className="modal-backdrop modal-top" onClick={onClose} style={backdropStyle}>
      <div className="modal modal-lg modal-top" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <div className="modal-header">
          <h3 className="modal-title">{game.titulo}</h3>
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body game-details">
          <div className="game-details-grid">
            <div className="game-details-cover">
              {game.imagenPortada ? (
                <img src={game.imagenPortada} alt={game.titulo} className="game-cover modal-cover" />
              ) : (
                <div className="game-cover placeholder" />
              )}
            </div>

            <div className="game-details-info">
              {/* Badges: Plataforma / Género / Puntuación / Lanzamiento / Desarrollador */}
              <div className="info-badges" aria-hidden="false">
                <span className="badge"><strong>Plataforma:</strong> {game.plataforma || '–'}</span>
                <span className="badge"><strong>Género:</strong> {game.genero || '–'}</span>
                {(() => {
                  const score = game.metacritic ?? game.puntuacion;
                  const scoreDisplay = score ?? '–';
                  let scoreClass = 'badge badge--score';
                  if (typeof score === 'number') {
                    if (score >= 85) scoreClass += ' score--high';
                    else if (score >= 70) scoreClass += ' score--med';
                    else scoreClass += ' score--low';
                  }
                  return (
                    <span className={scoreClass}><strong>Puntuación:</strong> {scoreDisplay}</span>
                  );
                })()}
                <span className="badge"><strong>Lanzamiento:</strong> {game.released || game.añoLanzamiento || '–'}</span>
                <span className="badge"><strong>Desarrollador:</strong> {game.desarrollador || '–'}</span>
              </div>


              {game.descripcion && (
                <div className="game-details-desc">
                  <h4>Descripción</h4>
                  <div dangerouslySetInnerHTML={{ __html: game.descripcion }} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          {isAuthenticated && (
            <button className="btn-primary" onClick={handleAddToLibrary} disabled={adding}>
              {adding ? 'Agregando...' : 'Agregar a mi biblioteca'}
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, document.body);

}
