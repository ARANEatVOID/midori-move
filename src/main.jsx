import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ThemeProvider } from './hooks/useTheme.js'
import './styles/globals.css'
import 'leaflet/dist/leaflet.css'

window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('dynamically imported module')) {
    window.location.reload()
  }
})

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.name === 'ChunkLoadError') {
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
