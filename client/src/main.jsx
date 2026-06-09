import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Register the service worker on app load for every visitor so the browser
// can offer "Install app" / "Add to Home Screen" without requiring sign-in or
// push permission. Push subscription is still gated behind sign-in in Chat.jsx.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[sw] registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
