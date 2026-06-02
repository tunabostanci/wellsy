import { useState } from 'react'

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('role') // 'role' | 'login-form'
  const [selectedRole, setSelectedRole] = useState('') // 'patient' | 'doctor' | 'staff' | 'admin'
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL =  'http://localhost:4000'

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('login-form')
    setError('')
  }

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Lütfen e-posta adresinizi giriniz.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role: selectedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Giriş bilgileri hatalı.')
      }

      // Başarılı giriş verisini saf haliyle App.jsx'e uçurur
      onLoginSuccess(data.user)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Sunucu bağlantı hatası oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f6' }}>
      <div className="card" style={{ width: 400, padding: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--teal-dark)' }}>Wellsy</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Null Pointers Akıllı Sağlık Sistemi</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, padding: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        {mode === 'role' ? (
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 12, textAlign: 'center' }}>
              Giriş Yapacağınız Rolü Seçiniz:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button type="button" className="btn" onClick={() => handleRoleSelect('patient')}>
                <i className="ti ti-user" /> Hasta Girişi
              </button>
              <button type="button" className="btn" onClick={() => handleRoleSelect('doctor')}>
                <i className="ti ti-stethoscope" /> Doktor Girişi
              </button>
              <button type="button" className="btn" onClick={() => handleRoleSelect('staff')}>
                <i className="ti ti-users" /> Klinik Personeli (Staff) Girişi
              </button>
              <button type="button" className="btn" onClick={() => handleRoleSelect('admin')}>
                <i className="ti ti-shield-check" /> Sistem Yöneticisi (Admin) Girişi
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span className="badge badge-teal" style={{ marginBottom: 12, textTransform: 'uppercase' }}>
                {selectedRole} Giriş Alanı
              </span>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
                E-posta Adresi
              </label>
              <input
                type="email"
                className="text-input"
                style={{ width: '100%', fontSize: 14 }}
                placeholder={`${selectedRole}@wellsy.com`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setMode('role')} disabled={loading}>
                Geri
              </button>
              <button type="button" className="btn-primary btn" style={{ flex: 2 }} onClick={handleLogin} disabled={loading}>
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}