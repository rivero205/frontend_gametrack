import React, { useState } from 'react';
import { X } from 'lucide-react';
import { updateReview } from '../services/api.js';

export default function ReviewEditModal({ review, onClose, onSaved }) {
  const [texto, setTexto] = useState(review?.textoResena || '');
  const [puntuacion, setPuntuacion] = useState(review?.puntuacion || 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateReview(review._id, { textoResena: texto, puntuacion });
      if (onSaved) onSaved(updated);
      onClose();
    } catch (e) {
      console.error('Error saving review', e);
      setError('No se pudo guardar la reseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Editar reseña</h3>
          <button className="icon-btn btn-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Puntuación</label>
              <div className="star-rating">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" className={`star-btn ${s <= puntuacion ? 'active' : ''}`} onClick={() => setPuntuacion(s)}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Tu reseña</label>
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} />
            </div>
            {error && <div className="form-error">{error}</div>}
          </div>
          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ minWidth: 100 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ minWidth: 100 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
