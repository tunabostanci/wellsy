import { useState } from 'react'

export default function Login({ onDoctorLogin = () => {}, onPatientLogin = () => {} }) {
  const [mode, setMode] = useState('role') // 'role' | 'doctor-login' | 'patient-login'
  const [doctorEmail, setDoctorEmail] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const handleDoctorLogin = async () => {
    if (!doctorEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/doctor-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: doctorEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Doctor not found')
      }

      // Pass doctor info to parent
      onDoctorLogin(data.doctor)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePatientLogin = async () => {
    if (!patientEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/patient-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patientEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Patient not found')
      }

      // Pass patient info to parent
      onPatientLogin(data.patient)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'role') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
        padding: '20px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-1)',
              marginBottom: 8,
            }}>
              Wellsy
            </div>
            <div style={{
              fontSize: 14,
              color: 'var(--text-3)',
              lineHeight: 1.5,
            }}>
              Intelligent Healthcare Appointment System
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <button
              type="button"
              className="btn-primary btn"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
              }}
              onClick={() => {
                setMode('patient-login')
                setError('')
                setPatientEmail('')
              }}
            >
              <i className="ti ti-user" style={{ marginRight: 8 }} />
              Login as Patient
            </button>

            <button
              type="button"
              className="btn"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-md)',
              }}
              onClick={() => {
                setMode('doctor-login')
                setError('')
                setDoctorEmail('')
              }}
            >
              <i className="ti ti-stethoscope" style={{ marginRight: 8 }} />
              Login as Doctor
            </button>

            <button
              type="button"
              className="btn"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-md)',
              }}
            >
              <i className="ti ti-shield-check" style={{ marginRight: 8 }} />
              Admin Panel
            </button>

            <button
              type="button"
              className="btn"
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-md)',
              }}
            >
              <i className="ti ti-users" style={{ marginRight: 8 }} />
              Clinic Staff
            </button>
          </div>

          <div style={{
            marginTop: 24,
            padding: '16px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--r-md)',
            fontSize: 12,
            color: 'var(--text-3)',
            lineHeight: 1.6,
          }}>
            <strong>Demo Credentials:</strong>
            <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 11 }}>
              Patient: elif.k@example.com
              <br />
              Doctor: ayse.kaya@wellsy.com
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'patient-login') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
        padding: '20px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => {
                setMode('role')
                setError('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal)',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ti ti-arrow-left" />
              Back
            </button>

            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Patient Login
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Enter your email to access your appointments
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: '#FFE6E6',
              border: '1px solid #FFA8A8',
              borderRadius: 'var(--r-md)',
              color: '#C30000',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              className="text-input"
              style={{ width: '100%', fontSize: 14 }}
              placeholder="your@email.com"
              value={patientEmail}
              onChange={e => setPatientEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePatientLogin()}
            />
          </div>

          <button
            type="button"
            className="btn-primary btn"
            style={{
              width: '100%',
              height: 44,
              fontSize: 14,
              fontWeight: 500,
            }}
            onClick={handlePatientLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'doctor-login') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
        padding: '20px',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--r-lg)',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => {
                setMode('role')
                setError('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal)',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ti ti-arrow-left" />
              Back
            </button>

            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
              Doctor Login
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Enter your email to access your dashboard
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: '#FFE6E6',
              border: '1px solid #FFA8A8',
              borderRadius: 'var(--r-md)',
              color: '#C30000',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              className="text-input"
              style={{ width: '100%', fontSize: 14 }}
              placeholder="your@wellsy.com"
              value={doctorEmail}
              onChange={e => setDoctorEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleDoctorLogin()}
            />
          </div>

          <button
            type="button"
            className="btn-primary btn"
            style={{
              width: '100%',
              height: 44,
              fontSize: 14,
              fontWeight: 500,
            }}
            onClick={handleDoctorLogin}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
