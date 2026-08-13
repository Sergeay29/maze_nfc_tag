import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { ClientAuthProvider } from './auth/client/ClientAuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ClientAuthProvider>
        <App />
      </ClientAuthProvider>
    </AuthProvider>
  </StrictMode>
);
