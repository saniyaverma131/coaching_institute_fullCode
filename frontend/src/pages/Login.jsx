import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    try {
      await login(email, password)
      nav('/dashboard', { replace: true })
    } catch (ex) {
      setErr(ex.message)
    }
  }

  return (
    <div className="auth">
      <div className="card">
        <h1>Coaching Institute</h1>
        <p className="muted">Sign in (Admin / Teacher / Student)</p>
        {err && <div className="err">{err}</div>}
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <button type="submit">Login</button>
        </form>
        <p className="muted small">
          New student? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
