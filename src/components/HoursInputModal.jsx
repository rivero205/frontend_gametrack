import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function HoursInputModal({ open, initialHours, onConfirm, onCancel }) {
  const [hours, setHours] = useState(initialHours !== undefined && initialHours !== null ? String(initialHours) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    // reset local state when opening/closing
    if (open) {
      setHours(initialHours !== undefined && initialHours !== null ? String(initialHours) : '');
      setError('');
    }
  }, [open, initialHours]);

  const handleConfirm = useCallback(() => {
    const value = parseFloat(String(hours).replace(',', '.'));
    if (isNaN(value) || value < 0 || value > 10000) {
      setError('Ingresa un número válido de horas (0–10000)');
      return;
    }
    setError('');
    onConfirm(value);
  }, [hours, onConfirm]);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleConfirm, onCancel]);

  if (!open) return null;

  

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hours-modal-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="hours-modal-title" className="modal-title">Horas jugadas</h2>
          <button className="modal-close" aria-label="Cerrar" onClick={onCancel}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div style={{ maxWidth: 520 }}>
            <label htmlFor="hours-input" className="font-semibold text-base" style={{ display: 'block', marginBottom: 6, color: 'var(--text-primary)' }}>Cantidad de horas</label>
            <input
              id="hours-input"
              className="form-control"
              type="number"
              inputMode="decimal"
              min="0"
              max="10000"
              step="0.1"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="Ej: 42.5"
              autoFocus
              aria-describedby={error ? 'hours-error' : undefined}
              style={{ fontSize: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
              <small className="text-tertiary">Puedes usar decimales (p. ej. 12.5)</small>
              {error ? <small id="hours-error" className="text-error" style={{ fontWeight: 600 }}>{error}</small> : null}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn" style={{ background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)' }} onClick={handleConfirm}>Guardar horas</button>
        </div>
      </div>
    </div>
  );
}
