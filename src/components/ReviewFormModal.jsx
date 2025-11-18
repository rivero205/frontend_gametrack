import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ReviewFormModal({ game, onSave, onClose }) {
  const [formData, setFormData] = useState({
    puntuacion: 5,
    textoResena: '',
    dificultad: 'Normal',
    recomendaria: true
  });

  const [selectedStars, setSelectedStars] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, puntuacion: selectedStars });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reseñar: {game?.titulo}</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Puntuación *</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= selectedStars ? 'active' : ''}`}
                  onClick={() => setSelectedStars(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Tu Reseña</label>
            <textarea
              placeholder="Comparte tu experiencia con este juego..."
              value={formData.textoResena}
              onChange={(e) => setFormData({ ...formData, textoResena: e.target.value })}
            />
          </div>

          {/* Eliminado: las horas ya no se registran desde la reseña. Se usan desde la modal al completar. */}

          <div className="form-group">
            <label>Dificultad</label>
            <select
              value={formData.dificultad}
              onChange={(e) => setFormData({ ...formData, dificultad: e.target.value })}
            >
              <option value="Fácil">Fácil</option>
              <option value="Normal">Normal</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="recomendaria"
                checked={formData.recomendaria}
                onChange={(e) => setFormData({ ...formData, recomendaria: e.target.checked })}
              />
              <label htmlFor="recomendaria">¿Recomendarías este juego?</label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Publicar Reseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
