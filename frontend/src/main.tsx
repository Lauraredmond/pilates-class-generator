import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { registerServiceWorker } from './utils/registerServiceWorker'
import { initDebugConsole } from './utils/debug'
import './styles/design-tokens.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

// Register service worker for PWA support (battery-friendly)
registerServiceWorker()

// Initialize debug console (eruda) for on-device debugging
// Only loads in dev environment or when debug mode is explicitly enabled
initDebugConsole()
