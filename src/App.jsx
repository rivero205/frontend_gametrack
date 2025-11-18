import React from 'react';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import AppRouter from './router/AppRouter';
import ToastContainer from './components/ToastContainer';
import './App.css';

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;