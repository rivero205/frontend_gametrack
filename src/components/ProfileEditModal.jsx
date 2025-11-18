import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ImageUpload from './ImageUpload.jsx';
import { updateProfile } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';

export default function ProfileEditModal({ user, onClose }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    nickname: '',
    fechaNacimiento: '',
    plataformaFavorita: '',
    avatarUrl: '',
    pais: '',
    preferenciasJuego: [],
    nivelExperiencia: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      nombre: user.nombre || '',
      nickname: user.nickname || '',
      fechaNacimiento: user.fechaNacimiento ? new Date(user.fechaNacimiento).toISOString().slice(0,10) : '',
      plataformaFavorita: user.plataformaFavorita || '',
      avatarUrl: user.avatarUrl || '',
      pais: user.pais || '',
      preferenciasJuego: Array.isArray(user.preferenciasJuego) ? user.preferenciasJuego : (user.preferenciasJuego ? [user.preferenciasJuego] : []),
      nivelExperiencia: user.nivelExperiencia || 'Casual',
      email: user.email || '',
      password: ''
    });
  }, [user]);

  const handleImageChange = (url) => {
    setForm(f => ({ ...f, avatarUrl: url }));
  };

  const handleImageRemove = () => setForm(f => ({ ...f, avatarUrl: '' }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // prepare payload. If preferenciasJuego provided as comma-separated string, ensure array
      const payload = {
        nombre: form.nombre || undefined,
        nickname: form.nickname || undefined,
        fechaNacimiento: form.fechaNacimiento || undefined,
        plataformaFavorita: form.plataformaFavorita || undefined,
        avatarUrl: form.avatarUrl || undefined,
        pais: form.pais || undefined,
        preferenciasJuego: Array.isArray(form.preferenciasJuego) ? form.preferenciasJuego : (typeof form.preferenciasJuego === 'string' ? form.preferenciasJuego.split(',').map(s=>s.trim()).filter(Boolean) : undefined),
        nivelExperiencia: form.nivelExperiencia || undefined,
        email: form.email || undefined,
      };
      if (form.password && form.password.trim() !== '') payload.password = form.password;

      const res = await updateProfile(payload);
      // update auth context
      if (res && (res.user || res.token)) {
        login(res);
      }

      setMessage('Perfil actualizado');
      setTimeout(() => { onClose && onClose(); }, 700);
    } catch (err) {
      console.error('update profile error', err);
      setMessage(err?.body?.message || err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar perfil</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" value={form.nombre} onChange={e=>setForm({...form, nombre: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Apodo (nickname)</label>
                <input type="text" value={form.nickname} onChange={e=>setForm({...form, nickname: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Fecha de nacimiento</label>
                <input type="date" value={form.fechaNacimiento} onChange={e=>setForm({...form, fechaNacimiento: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Plataforma favorita</label>
                <input type="text" placeholder="Ej: PC, PlayStation, Xbox, Switch" value={form.plataformaFavorita} onChange={e=>setForm({...form, plataformaFavorita: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Avatar</label>
                <ImageUpload currentImage={form.avatarUrl} onImageChange={handleImageChange} onImageRemove={handleImageRemove} maxSize={2 * 1024 * 1024} label="Avatar" />
              </div>

              <div className="form-group">
                <label>País</label>
                <input type="text" value={form.pais} onChange={e=>setForm({...form, pais: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Preferencias de juego (coma-separadas)</label>
                <input type="text" value={Array.isArray(form.preferenciasJuego) ? form.preferenciasJuego.join(', ') : (form.preferenciasJuego || '')} onChange={e=>setForm({...form, preferenciasJuego: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Nivel de experiencia</label>
                <select value={form.nivelExperiencia} onChange={e=>setForm({...form, nivelExperiencia: e.target.value})}>
                  <option value="Beginner">Beginner</option>
                  <option value="Casual">Casual</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Hardcore">Hardcore</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Contraseña (dejar en blanco para no cambiar)</label>
                <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} />
              </div>

              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>

              {message && <div style={{ gridColumn: '1 / -1', marginTop: '0.6rem' }} className="toast-message">{message}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
