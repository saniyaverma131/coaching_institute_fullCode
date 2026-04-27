import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setOk('')
    try {
      await register(form)
      setOk('Account created. You can log in.')
      setTimeout(() => nav('/login'), 1200)
    } catch (ex) {
      setErr(ex.message)
    }
  }

  return (
    <div className="auth">
      <div className="card">
        <h1>Student registration</h1>
        <p className="muted">Functional requirement: student registration & login</p>
        {err && <div className="err">{err}</div>}
        {ok && <div className="ok">{ok}</div>}
        <form onSubmit={onSubmit}>
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <button type="submit">Create account</button>
        </form>
        <p className="muted small">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
