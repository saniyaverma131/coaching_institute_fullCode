import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { ToastProvider } from './ToastContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import './App.css'

function PrivateRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready)
    return (
      <div className="auth auth-page">
        <div className="auth-backdrop" aria-hidden />
        <div className="auth-grid auth-grid--solo">
          <div className="loading-screen">
            <div className="loading-logo" aria-hidden>
              SC
            </div>
            <p className="muted">Loading your workspace…</p>
          </div>
        </div>
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
