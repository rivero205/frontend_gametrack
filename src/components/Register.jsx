import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { registerUser, uploadImage } from '../services/api';
import { useToast } from '../hooks/useToast';
import '../styles/auth.css';

export default function Register({ onSuccess }) {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    nombre: '',
    nickname: '',
    fechaNacimiento: '',
    plataformaFavorita: '',
    avatarUrl: '',
    pais: '',
    preferenciasJuego: [],
    nivelExperiencia: 'Casual',
    email: '',
    password: ''
  });
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let payload = null;
    try {
      payload = { ...formData };

      // If avatar file selected, upload it first and use returned URL
      if (avatarFile) {
        try {
          const uploadRes = await uploadImage(avatarFile);
          if (uploadRes && uploadRes.url) {
            payload.avatarUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          // Don't block registration if avatar upload fails
          console.warn('Avatar upload failed', uploadErr);
        }
      } else if (formData.avatarUrl && typeof formData.avatarUrl === 'string' && formData.avatarUrl.trim() !== '') {
        payload.avatarUrl = formData.avatarUrl.trim();
      }

      // normalizar preferencias: asegurar arreglo de strings
      payload.preferenciasJuego = Array.isArray(formData.preferenciasJuego)
        ? formData.preferenciasJuego
        : String(formData.preferenciasJuego || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

      const { user } = await registerUser(payload);
      success('Registro exitoso');
      onSuccess && onSuccess({ user });
    } catch (err) {
      // Log full error and payload for debugging server 400/413 responses
      try {
        console.error('[Register] payload:', payload, 'error:', err, 'err.body:', err?.body);
      } catch (logErr) {
        console.error('[Register] error logging failed', logErr);
      }
      showError(err?.body?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarPreviewUrl('');
      return;
    }
    // Crear vista previa inmediata y mantener el fichero para subir
    const objUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(objUrl);
    setAvatarFile(file);
  };

  return (
    <div className="auth">
      <div className="auth-header">
        <div className="auth-icon"><UserPlus size={18} /></div>
        <h2 className="auth-title">Registro</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            className="form-control"
            type="text"
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Apodo (nickname)</label>
          <input
            className="form-control"
            type="text"
            placeholder="Opcional"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Fecha de nacimiento</label>
          <input
            className="form-control"
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Plataforma favorita</label>
          <input
            className="form-control"
            type="text"
            placeholder="PC, PlayStation, Xbox, Switch..."
            value={formData.plataformaFavorita}
            onChange={(e) => setFormData({ ...formData, plataformaFavorita: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Avatar</label>
          <div className="avatar-upload">
            {avatarPreviewUrl ? (
              <div className="avatar-preview" aria-label="Vista previa del avatar">
                <img src={avatarPreviewUrl} alt="Vista previa del avatar" />
              </div>
            ) : (
              <div className="avatar-placeholder">Selecciona una imagen PNG/JPG (máx. 2MB)</div>
            )}
            <label className="upload-btn" htmlFor="avatarInput">Adjuntar imagen</label>
            <input
              id="avatarInput"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>País</label>
          <input
            className="form-control"
            type="text"
            value={formData.pais}
            onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Preferencias de juego</label>
          <input
            className="form-control"
            type="text"
            placeholder="Acción, RPG, Deportes"
            value={Array.isArray(formData.preferenciasJuego) ? formData.preferenciasJuego.join(', ') : formData.preferenciasJuego}
            onChange={(e) => setFormData({ ...formData, preferenciasJuego: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Nivel de experiencia</label>
          <select
            className="experience-select"
            value={formData.nivelExperiencia}
            onChange={(e) => setFormData({ ...formData, nivelExperiencia: e.target.value })}
          >
            <option value="Beginner">Beginner</option>
            <option value="Casual">Casual</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Hardcore">Hardcore</option>
            <option value="Pro">Pro</option>
          </select>
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            className="form-control"
            type="email"
            required
            placeholder="tu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Contraseña *</label>
          <input
            className="form-control"
            type="password"
            required
            minLength={6}
            placeholder="••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </div>
      </form>
    </div>
  );
}
