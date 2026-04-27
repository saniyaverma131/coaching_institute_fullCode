import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { api, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = getToken()
    if (!t) {
      setReady(true)
      return
    }
    api('/api/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  const login = async (email, password) => {
    const data = await api('/api/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    await api('/api/auth/register', { method: 'POST', body: payload })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const refreshUser = () => api('/api/auth/me').then(setUser)

  const value = useMemo(
    () => ({ user, ready, login, register, logout, refreshUser }),
    [user, ready]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
