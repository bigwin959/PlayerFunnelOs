'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      localStorage.setItem('pf_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Wrong password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #0f0f1a 0%, #0a0a0f 70%)',
      padding: '24px',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'fixed', top: '20%', left: '15%', width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(16,185,129,0.06)', filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '20%', right: '15%', width: 300, height: 300,
        borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
            marginBottom: 16,
          }}>
            <TrendingUp size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
            Player Funnel <span className="gradient-text">OS</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Acquisition intelligence dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Lock size={16} color="#64748b" />
            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Secure Access</span>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Dashboard Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your passphrase"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !password}
              style={{ width: '100%', marginTop: 4, padding: '12px 20px', fontSize: 15 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Verifying…
                </span>
              ) : 'Access Dashboard'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#334155', fontSize: 12 }}>
          Player Funnel OS · Internal Use Only
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
