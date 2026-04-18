import { useState } from 'react'
import './LoginPage.css'

const API = 'http://localhost:5001'

export default function LoginPage({ onLoginSuccess, onViewDashboard }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (data.success) {
        onLoginSuccess(username)
      } else {
        setShake(true)
        setError('Invalid credentials. This attempt has been cryptographically logged.')
        setTimeout(() => setShake(false), 600)
      }
    } catch {
      setError('Cannot connect to server. Is the Flask backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="bg-grid" />

      {/* Floating orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />

      <div className={`login-card glass ${shake ? 'shake' : ''}`}>

        {/* Header */}
        <div className="login-header">
          <div className="shield-icon">🔒</div>
          <h1 className="login-title">SecureLog <span>Auth Portal</span></h1>
          <p className="login-subtitle">Tamper-Evident Audit System — Task 1</p>
        </div>

        {/* Hint */}
        <div className="hint-box">
          <span className="hint-label">Demo Creds:</span>
          <span className="mono">admin</span> / <span className="mono">admin123</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field-wrap">
            <label className="field-label">Username</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                className="field-input"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-wrap">
            <label className="field-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔑</span>
              <input
                className="field-input"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-box">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? <><div className="spinner" /> Authenticating...</> : '🔐 Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <span>Every login attempt — success or failure — is cryptographically chained.</span>
        </div>

        <button className="btn btn-ghost view-dash-btn" onClick={onViewDashboard}>
          📊 View Log Dashboard →
        </button>
      </div>
    </div>
  )
}
