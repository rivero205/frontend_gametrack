import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const next = params.get('next');

  if (isAuthenticated) {
    return <Navigate to={next || "/dashboard"} replace />;
  }

  const handleSuccess = (data) => {
    login(data);
    if (next) {
      navigate(next, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-view">
        <Login onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default LoginPage;
