import React, { useState } from 'react';
import '../styles/auth.css';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { loginUser } from '../services/api';
import { useToast } from '../hooks/useToast';

export default function Login({ onSuccess }) {
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  const { user } = await loginUser(formData);
  // Guardamos solo información pública del usuario en el provider via login()
  success('Ingreso exitoso');
  onSuccess && onSuccess({ user });
    } catch (err) {
      console.error('Login error:', err);
      showError(err?.body?.message || 'Error al ingresar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-header">
        <div className="auth-icon"><LogIn size={18} /></div>
        <h2 className="auth-title">Iniciar sesión</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
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
          <label>Contraseña</label>
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
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register" className="link-register">Regístrate</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
