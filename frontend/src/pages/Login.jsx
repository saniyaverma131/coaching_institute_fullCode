import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Signed in successfully.')
      nav('/dashboard', { replace: true })
    } catch (ex) {
      toast.error(ex.message)
    }
  }

  return (
    <div className="auth auth-page">
      <div className="auth-backdrop" aria-hidden />
      <div className="auth-grid">
        <aside className="auth-side">
          <div className="auth-side-inner">
            <span className="auth-logo" aria-hidden>
              SC
            </span>
            <h2 className="auth-tagline">Learn without limits.</h2>
            <p className="auth-side-text">
              Smart Coaching Institute — courses, attendance, fees, and progress in one calm workspace
              for admins, teachers, and students.
            </p>
          </div>
        </aside>
        <div className="auth-card-wrap">
          <div className="card card-elevated">
            <h1>Welcome back</h1>
            <p className="muted">
              Use the account your institute gave you. After sign-in, the left menu shows only what your role can do.
            </p>
            <form onSubmit={onSubmit}>
              <label>
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoComplete="email" />
              </label>
              <label>
                Password
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <button type="submit">Sign in</button>
            </form>
            <p className="muted small">
              New student? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
