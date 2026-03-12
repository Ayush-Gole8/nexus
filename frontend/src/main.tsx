import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Overwrite console.warn to suppress known Three.js deprecation warnings caused by React Three Fiber
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('THREE.Clock: This module has been deprecated') ||
     args[0].includes('PCFSoftShadowMap has been deprecated'))
  ) {
    return;
  }
  originalWarn(...args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
