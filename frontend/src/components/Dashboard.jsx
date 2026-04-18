import { useState, useEffect, useCallback } from 'react'
import './Dashboard.css'

const API = 'http://localhost:5001'

export default function Dashboard({ loggedInUser, onLogout }) {
  const [logs, setLogs]           = useState([])
  const [integrity, setIntegrity] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [toast, setToast]         = useState(null)
  const [resetting, setResetting] = useState(false)
  const [selectedIdx, setSelectedIdx]   = useState(null)   // which row user clicked
  const [tamperResult, setTamperResult] = useState(null)   // stores diff info
  const [tamperedIdx, setTamperedIdx]   = useState(null)   // highlights row
  const [activeTamper, setActiveTamper] = useState(null)   // which button is loading

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`${API}/api/logs`)
      const data = await res.json()
      setLogs(data)
    } catch {
      showToast('Cannot reach backend. Is Flask running on port 5001?', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function verify() {
    setVerifying(true)
    setIntegrity(null)
    try {
      const res  = await fetch(`${API}/api/verify`)
      const data = await res.json()
      setIntegrity(data)
      showToast(data.result, data.intact ? 'success' : 'error')
    } catch {
      showToast('Verification failed — backend error.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  async function tamper(type) {
    if (selectedIdx === null) {
      showToast('Click a row in the table first to select the target entry!', 'error')
      return
    }
    setActiveTamper(type)
    setTamperResult(null)
    try {
      const res  = await fetch(`${API}/api/tamper/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_index: selectedIdx })
      })
      const data = await res.json()
      if (data.error) { showToast(data.error, 'error'); return }
      setTamperResult(data)
      setTamperedIdx(data.entry_index)
      setSelectedIdx(null)
      setIntegrity(null)
      fetchLogs()
    } catch {
      showToast('Tamper simulation failed.', 'error')
    } finally {
      setActiveTamper(null)
    }
  }

  async function reset() {
    setResetting(true)
    setTamperResult(null)
    setTamperedIdx(null)
    setSelectedIdx(null)
    setIntegrity(null)
    try {
      await fetch(`${API}/api/reset`, { method: 'POST' })
      setLogs([])
      showToast('Chain cleared — log in again to create new entries.', 'info')
    } catch {
      showToast('Reset failed.', 'error')
    } finally {
      setResetting(false)
    }
  }

  function getBadge(event_type) {
    if (event_type === 'LOGIN_SUCCESS') return <span className="badge badge-success">✓ Login OK</span>
    if (event_type === 'LOGIN_FAILED')  return <span className="badge badge-fail">✕ Login Fail</span>
    return <span className="badge badge-system">⚙ System</span>
  }

  function shortHash(h) {
    if (!h) return '—'
    return h.slice(0, 10) + '…' + h.slice(-6)
  }

  function fmtTime(ts) {
    const d = new Date(ts * 1000)
    return d.toLocaleTimeString('en-IN', { hour12: false }) + ' ' +
           d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const intact           = integrity?.intact
  const chainStatusClass = integrity === null ? '' : intact ? 'status-intact' : 'status-broken'
  const chainStatusLabel = integrity === null
    ? 'Not Verified'
    : intact ? '✓ CHAIN INTACT' : '✕ TAMPERED'

  return (
    <div className="dash-root">
      <div className="bg-grid" />

      {/* ── NAVBAR ── */}
      <nav className="dash-nav glass">
        <div className="nav-brand">
          <span className="nav-icon">🔒</span>
          <span>SecureLog <b>Dashboard</b></span>
        </div>
        <div className="nav-right">
          {loggedInUser && <span className="nav-user">👤 {loggedInUser}</span>}
          <button className="btn btn-ghost" style={{padding:'8px 16px', fontSize:'13px'}} onClick={onLogout}>
            ← Back to Login
          </button>
        </div>
      </nav>

      <div className="dash-body">

        {/* ── STATS ROW ── */}
        <div className="stats-row">
          <div className="stat-card glass">
            <div className="stat-value">{logs.length}</div>
            <div className="stat-label">Total Log Entries</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value green">{logs.filter(l => l.event_type === 'LOGIN_SUCCESS').length}</div>
            <div className="stat-label">Successful Logins</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-value red">{logs.filter(l => l.event_type === 'LOGIN_FAILED').length}</div>
            <div className="stat-label">Failed Attempts</div>
          </div>
          <div className={`stat-card glass chain-status-card ${chainStatusClass}`}>
            <div className="stat-value" style={{fontSize:'15px'}}>{chainStatusLabel}</div>
            <div className="stat-label">Chain Integrity</div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="main-grid">

          {/* ── LEFT: LOG TABLE ── */}
          <div className="left-col">
            <div className="log-section glass">
              <div className="section-header">
                <div className="section-title">
                  <span className="pulse-dot pulse-green" />
                  Cryptographic Log Chain
                  {tamperedIdx !== null && (
                    <span className="tampered-badge">⚠ Entry #{tamperedIdx} tampered</span>
                  )}
                </div>
                <button className="btn btn-ghost" style={{padding:'7px 13px', fontSize:'12px'}} onClick={fetchLogs} disabled={loading}>
                  {loading ? <div className="spinner" /> : '⟳ Refresh'}
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="empty-state">
                  <div style={{fontSize:'44px', marginBottom:'12px'}}>📋</div>
                  <p>No log entries yet.</p>
                  <p style={{fontSize:'12px', marginTop:'6px', color:'var(--muted)'}}>Go to the login page and sign in to create chain entries.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Timestamp</th>
                        <th>Event</th>
                        <th>Description</th>
                        <th>Prev Hash</th>
                        <th>Hash (Stamp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, idx) => (
                        <tr
                          key={idx}
                          className={[
                            idx === 0 ? 'genesis-row' : 'clickable-row',
                            idx === selectedIdx ? 'selected-row' : '',
                            idx === tamperedIdx ? 'tampered-row' : ''
                          ].filter(Boolean).join(' ')}
                          onClick={() => idx > 0 && setSelectedIdx(idx === selectedIdx ? null : idx)}
                          title={idx > 0 ? 'Click to select this entry as tamper target' : 'Genesis block cannot be tampered'}
                        >
                          <td className="idx-cell">
                            {idx === selectedIdx ? '🎯' : idx}
                          </td>
                          <td className="mono ts-cell">{fmtTime(log.timestamp)}</td>
                          <td>{getBadge(log.event_type)}</td>
                          <td className="desc-cell">{log.description}</td>
                          <td className="mono hash-cell">{shortHash(log.prev_hash)}</td>
                          <td className="mono hash-cell hash-current">{shortHash(log.hash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── DIFF PANEL (appears after tamper) ── */}
            {tamperResult && (
              <div className="diff-panel glass">
                <div className="diff-header">
                  <span className="diff-icon">🔬</span>
                  <span className="diff-title">What the Attacker Changed — <b>Entry #{tamperResult.entry_index}</b></span>
                  <button className="diff-close" onClick={() => { setTamperResult(null); setTamperedIdx(null) }}>✕</button>
                </div>

                <div className="diff-explanation">{tamperResult.explanation}</div>

                {tamperResult.type === 'alter' && (
                  <div className="diff-compare">
                    <div className="diff-col before">
                      <div className="diff-col-label">📄 BEFORE (Original)</div>
                      <div className="diff-field">
                        <span className="diff-key">Description:</span>
                        <span className="diff-val green">{tamperResult.before.description}</span>
                      </div>
                      <div className="diff-field">
                        <span className="diff-key">Hash (stamp):</span>
                        <span className="diff-val green mono">{shortHash(tamperResult.before.hash)}</span>
                      </div>
                    </div>
                    <div className="diff-arrow">→</div>
                    <div className="diff-col after">
                      <div className="diff-col-label">🔥 AFTER (Hacker edits)</div>
                      <div className="diff-field">
                        <span className="diff-key">Description:</span>
                        <span className="diff-val red">{tamperResult.after.description}</span>
                      </div>
                      <div className="diff-field">
                        <span className="diff-key">Hash (stamp):</span>
                        <span className="diff-val red mono">{shortHash(tamperResult.after.hash)} ← still old! won't match recomputed</span>
                      </div>
                    </div>
                  </div>
                )}

                {tamperResult.type === 'delete' && (
                  <div className="diff-compare">
                    <div className="diff-col before">
                      <div className="diff-col-label">📄 DELETED Entry</div>
                      <div className="diff-field">
                        <span className="diff-key">Description:</span>
                        <span className="diff-val green">{tamperResult.before.description}</span>
                      </div>
                      <div className="diff-field">
                        <span className="diff-key">Hash:</span>
                        <span className="diff-val green mono">{shortHash(tamperResult.before.hash)}</span>
                      </div>
                    </div>
                    <div className="diff-arrow">🗑</div>
                    {tamperResult.next_entry && (
                      <div className="diff-col after">
                        <div className="diff-col-label">⚠️ Next Entry (now orphaned)</div>
                        <div className="diff-field">
                          <span className="diff-key">Description:</span>
                          <span className="diff-val">{tamperResult.next_entry.description}</span>
                        </div>
                        <div className="diff-field">
                          <span className="diff-key">prev_hash still points to:</span>
                          <span className="diff-val red mono">{shortHash(tamperResult.next_entry.prev_hash)} ← entry deleted, this is now broken!</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tamperResult.type === 'reorder' && (
                  <div className="diff-compare">
                    <div className="diff-col before">
                      <div className="diff-col-label">📄 Position #1 BEFORE</div>
                      <div className="diff-field">
                        <span className="diff-key">Was:</span>
                        <span className="diff-val green">{tamperResult.before.description}</span>
                      </div>
                    </div>
                    <div className="diff-arrow">🔀</div>
                    <div className="diff-col after">
                      <div className="diff-col-label">🥔 Position #1 AFTER swap</div>
                      <div className="diff-field">
                        <span className="diff-key">Now:</span>
                        <span className="diff-val red">{tamperResult.after.description}</span>
                      </div>
                      <div className="diff-field">
                        <span className="diff-key">prev_hash still points to:</span>
                        <span className="diff-val red mono">{shortHash(tamperResult.after.prev_hash)} ← no longer matches the entry above it!</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="diff-action-hint">
                  👆 Now click <b>Run Verification</b> on the right → it will catch this tampering!
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-panel">

            {/* Verify */}
            <div className="panel-card glass">
              <div className="panel-title">🔍 Verify Chain</div>
              <p className="panel-desc">
                Re-computes SHA-256 for all entries and checks every link. Catches any alteration, deletion, or reorder.
              </p>
              {integrity && (
                <div className={`integrity-result ${intact ? 'res-intact' : 'res-broken'}`}>
                  {integrity.result}
                </div>
              )}
              <button className="btn btn-verify" onClick={verify} disabled={verifying}>
                {verifying ? <><div className="spinner" /> Verifying...</> : '🔍 Run Verification'}
              </button>
            </div>

            {/* Tamper Simulations */}
            <div className="panel-card glass">
              <div className="panel-title">⚠️ Tamper Simulations</div>
              <p className="panel-desc">
                👆 First <b>click any row</b> in the table to select the target entry. Then pick an attack type below.
              </p>
              {selectedIdx !== null ? (
                <div className="selected-indicator">
                  🎯 Target: <b>Entry #{selectedIdx}</b> selected
                  <button className="clear-sel" onClick={() => setSelectedIdx(null)}>✕ Clear</button>
                </div>
              ) : (
                <div className="no-selection-hint">← Click a row in the table to pick a target</div>
              )}
              <div className="tamper-grid">
                <TamperBtn
                  icon="✏️"
                  label="Alter Entry Text"
                  sub="Rewrites a log entry's text"
                  cls="btn-warn"
                  active={activeTamper === 'alter'}
                  onClick={() => tamper('alter')}
                />
                <TamperBtn
                  icon="🗑"
                  label="Delete an Entry"
                  sub="Removes a log from the file"
                  cls="btn-danger"
                  active={activeTamper === 'delete'}
                  onClick={() => tamper('delete')}
                />
                <TamperBtn
                  icon="🔀"
                  label="Swap Entry Order"
                  sub="Reorders two log entries"
                  cls="btn-cyan"
                  active={activeTamper === 'reorder'}
                  onClick={() => tamper('reorder')}
                />
              </div>
            </div>

            {/* Reset */}
            <div className="panel-card glass">
              <div className="panel-title">🔄 Reset Demo</div>
              <p className="panel-desc">Clears the entire log chain so you can start a fresh demo.</p>
              <button className="btn btn-danger" onClick={reset} disabled={resetting} style={{width:'100%'}}>
                {resetting ? <><div className="spinner" /> Resetting...</> : '🗑 Clear All Logs'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span style={{flex:1}}>{toast.msg}</span>
          <button onClick={() => setToast(null)}
            style={{background:'none',border:'none',cursor:'pointer',color:'inherit',opacity:0.6,fontSize:'16px',padding:'0 0 0 8px',flexShrink:0}}>✕</button>
        </div>
      )}
    </div>
  )
}

function TamperBtn({ icon, label, sub, cls, active, onClick }) {
  return (
    <button className={`tamper-btn btn ${cls}`} onClick={onClick} disabled={active}>
      <span className="tb-icon">{active ? <div className="spinner" /> : icon}</span>
      <span className="tb-text">
        <span className="tb-label">{label}</span>
        <span className="tb-sub">{sub}</span>
      </span>
    </button>
  )
}
