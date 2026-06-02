import { useState } from 'react'

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('role') // 'role' | 'login-form' | 'register-form'
  const [selectedRole, setSelectedRole] = useState('') 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('') // Yeni şifre state'i
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Kayıt form verileri
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setMode('login-form')
    setError('')
    setSuccess('')
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Lütfen e-posta ve şifrenizi giriniz.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password, role: selectedRole }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Giriş başarısız.')

      onLoginSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Tüm alanlar zorunludur.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Kayıt başarısız.')

      setSuccess('Hesabınız oluşturuldu! Şifreniz ile giriş yapabilirsiniz.')
      setMode('role')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-page)' }}>
      <div className="card" style={{ width: 400, padding: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--teal-dark)' }}>Wellsy</h2>
        
        {error && <div className="alert alert-error" style={{ margin: '12px 0' }}>{error}</div>}
        {success && <div className="alert alert-info" style={{ margin: '12px 0' }}>{success}</div>}

        {mode === 'role' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button className="btn" onClick={() => handleRoleSelect('patient')}>Hasta Girişi</button>
            <button className="btn" onClick={() => handleRoleSelect('doctor')}>Doktor Girişi</button>
            <button className="btn" onClick={() => handleRoleSelect('staff')}>Klinik Personeli Girişi</button>
            <button className="btn" onClick={() => handleRoleSelect('admin')}>Sistem Yöneticisi Girişi</button>
            <button className="btn-primary btn" onClick={() => { setMode('register-form'); setError(''); setSuccess('') }}>Kayıt Ol (Sign Up)</button>
          </div>
        )}

        {mode === 'login-form' && (
          <div style={{ marginTop: 16 }}>
            <span className="badge badge-teal" style={{ marginBottom: 12 }}>{selectedRole.toUpperCase()} PANELİ</span>
            <input type="email" className="text-input" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
            <input type="password" className="text-input" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', marginBottom: 16 }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" onClick={() => setMode('role')}>Geri</button>
              <button className="btn-primary btn" onClick={handleLogin} disabled={loading}>Giriş Yap</button>
            </div>
          </div>
        )}

        {mode === 'register-form' && (
          <form onSubmit={handleRegister} style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            <input type="text" className="text-input" placeholder="Ad Soyad" value={regName} onChange={e => setRegName(e.target.value)} required />
            <input type="email" className="text-input" placeholder="E-posta" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
            <input type="password" className="text-input" placeholder="Şifre" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn" onClick={() => setMode('role')}>İptal</button>
              <button type="submit" className="btn-primary btn">Kayıt Ol</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}