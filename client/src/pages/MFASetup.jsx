import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function MfaSetup({ token, onComplete }) {
  const [step, setStep] = useState('intro') // 'intro' | 'scan' | 'verify' | 'backup'
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/setup-mfa`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep('scan')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/enable-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBackupCodes(data.backupCodes)
      setStep('backup')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#0f1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, system-ui, sans-serif'
  }

  const cardStyle = {
    backgroundColor: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
  }

  const btnStyle = {
    width: '100%',
    padding: '11px',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.7 : 1,
    fontFamily: 'Inter, system-ui, sans-serif',
    marginTop: '8px'
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {step === 'intro' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔐</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px' }}>
              Set up two-factor authentication
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 24px', lineHeight: '1.5' }}>
              Protect your account with an authenticator app like Google Authenticator or Authy.
              You'll need it every time you sign in.
            </p>
            {error && <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '12px' }}>{error}</p>}
            <button onClick={handleSetup} style={btnStyle} disabled={loading}>
              {loading ? 'Setting up...' : 'Get started'}
            </button>
            <button
              onClick={() => onComplete && onComplete()}
              style={{ ...btnStyle, backgroundColor: 'transparent', border: '1px solid #2d3148', color: '#6b7280', marginTop: '8px' }}
            >
              Skip for now
            </button>
          </>
        )}

        {step === 'scan' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px' }}>
              Scan the QR code
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px' }}>
              Open your authenticator app and scan this code
            </p>
            {qrCode && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '16px' }}>
                <img src={qrCode} alt="MFA QR Code" style={{ width: '180px', height: '180px' }} />
              </div>
            )}
            <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '20px' }}>
              Or enter this code manually:
              <code style={{ display: 'block', backgroundColor: '#0f1117', padding: '8px 12px', borderRadius: '6px', marginTop: '6px', fontSize: '13px', color: '#6366f1', letterSpacing: '0.1em' }}>
                {secret}
              </code>
            </p>
            <button onClick={() => setStep('verify')} style={btnStyle}>
              I've scanned it →
            </button>
          </>
        )}

        {step === 'verify' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px' }}>
              Verify your code
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 24px' }}>
              Enter the 6-digit code from your authenticator app to confirm setup
            </p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#0f1117',
                  border: '1px solid #2d3148',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
                maxLength={6}
              />
              {error && <p style={{ fontSize: '12px', color: '#ef4444', margin: '8px 0' }}>{error}</p>}
              <button type="submit" style={btnStyle} disabled={loading || code.length !== 6}>
                {loading ? 'Verifying...' : 'Enable MFA'}
              </button>
            </form>
          </>
        )}

        {step === 'backup' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px' }}>
              Save your backup codes
            </h2>
            <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 16px', lineHeight: '1.5' }}>
              ⚠️ Save these codes now. They won't be shown again. Each code can only be used once.
            </p>
            <div style={{
              backgroundColor: '#0f1117',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {backupCodes.map(code => (
                <code key={code} style={{ fontSize: '13px', color: '#6366f1', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join('\n'))
              }}
              style={{ ...btnStyle, backgroundColor: '#2d3148', marginTop: 0, marginBottom: '8px' }}
            >
              Copy codes
            </button>
            <button onClick={() => onComplete && onComplete()} style={btnStyle}>
              I've saved my codes — continue
            </button>
          </>
        )}
      </div>
    </div>
  )
} 