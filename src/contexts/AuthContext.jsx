import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';
import { getCurrentUser } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un token guardado al cargar la app. Si hay token,
  // intentar refrescar el usuario desde la API para obtener campos completos (p.ej. createdAt).
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Seed with stored user to avoid UI flicker
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        try {
          // Try to fetch fresh user profile from backend (auth/me)
          const fresh = await getCurrentUser();
          if (fresh) {
            setUser(fresh);
            localStorage.setItem('user', JSON.stringify(fresh));
          }
        } catch (err) {
          console.warn('Could not refresh current user from API', err);
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  // Flexible login: accept (userObj, token) or a single payload object { user, token }
  const login = (userPayload, tokenArg) => {
    let newUser = null;
    let token = tokenArg;

    if (tokenArg === undefined) {
      // Possibly a single payload
      const payload = userPayload || {};
      if (payload.user) {
        newUser = payload.user;
      } else {
        // If payload looks like user object (has email/nombre/name), use it as user
        const hasUserProps = payload.nombre || payload.name || payload.email || payload.username;
        if (hasUserProps) newUser = payload;
      }
      if (payload.token) token = payload.token;
    } else {
      newUser = userPayload;
    }

    // Fallback: if still no user but payload had token and user stored server-side, we'll store token only
    setUser(newUser);
    if (token) localStorage.setItem('token', token);
    if (newUser) localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    // keep original `user` prop
    user,
    // backward-compat: many components expect `currentUser`
    currentUser: user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};