import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })

  async function onSubmit(e) {
    e.preventDefault()
    try {
      await register(form)
      toast.success('Account created. You can sign in now.')
      setTimeout(() => nav('/login'), 1200)
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
            <h2 className="auth-tagline">Start your journey.</h2>
            <p className="auth-side-text">
              Register as a student to access your timetable, study materials, assignments, and fee
              payments in one place.
            </p>
          </div>
        </aside>
        <div className="auth-card-wrap">
          <div className="card card-elevated">
            <h1>Create your account</h1>
            <p className="muted">
              Students register here once, then sign in on the login page. You will use Home and the sidebar for fees,
              notes, and timetable.
            </p>
            <form onSubmit={onSubmit}>
              <label>
                Full name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  autoComplete="tel"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </label>
              <button type="submit">Create account</button>
            </form>
            <p className="muted small">
              <Link to="/login">Already have an account? Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
