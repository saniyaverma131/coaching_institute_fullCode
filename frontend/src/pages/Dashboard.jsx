import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { navForRole } from '../dashboard/navConfig'
import { AdminPanel, TeacherPanel, StudentPanel } from '../dashboard/Panels'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [section, setSection] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = navForRole(user?.role)

  useEffect(() => {
    setSection('home')
  }, [user?.role])

  useEffect(() => {
    if (!logoutConfirmOpen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setLogoutConfirmOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [logoutConfirmOpen])

  function goTo(id) {
    setSection(id)
    setSidebarOpen(false)
  }

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''

  return (
    <div className="dashboard-bg">
      <div className="app-layout">
        <aside
          id="dashboard-sidebar"
          className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}
          aria-label="Main navigation"
        >
          <div className="app-sidebar-brand">
            <span className="app-sidebar-logo" aria-hidden>
              SC
            </span>
            <div>
              <div className="app-sidebar-title">Coaching</div>
              <div className="app-sidebar-sub">{roleLabel} portal</div>
            </div>
          </div>
          <nav className="app-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-nav-btn ${section === item.id ? 'active' : ''}`}
                onClick={() => goTo(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="app-main">
          <header className="topbar">
            <div className="topbar-row">
              <button
                type="button"
                className="nav-burger"
                aria-expanded={sidebarOpen}
                aria-controls="dashboard-sidebar"
                onClick={() => setSidebarOpen((o) => !o)}
              >
                <span className="nav-burger-bar" />
                <span className="nav-burger-bar" />
                <span className="nav-burger-bar" />
              </button>
              <div className="topbar-brand">
                <span className="topbar-mark" aria-hidden>
                  SC
                </span>
                <div>
                  <h1>Smart Coaching Institute</h1>
                  <p className="muted">
                    {user?.name} <span aria-hidden>·</span> <span className="role">{roleLabel}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="topbar-meta">
              <button type="button" className="ghost" onClick={() => setLogoutConfirmOpen(true)}>
                Log out
              </button>
            </div>
          </header>

          <main className="app-content" id="dashboard-main">
            {user?.role === 'admin' && (
              <AdminPanel section={section} onNavigate={goTo} />
            )}
            {user?.role === 'teacher' && (
              <TeacherPanel section={section} onNavigate={goTo} />
            )}
            {user?.role === 'student' && (
              <StudentPanel section={section} onNavigate={goTo} />
            )}
          </main>
        </div>
      </div>

      {logoutConfirmOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-dialog-title">Log out?</h2>
            <p id="logout-dialog-desc">Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setLogoutConfirmOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm"
                onClick={() => {
                  setLogoutConfirmOpen(false)
                  logout()
                  nav('/login', { replace: true })
                }}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
