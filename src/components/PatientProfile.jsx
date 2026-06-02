import { useState } from 'react'

export default function PatientProfile({ user, onUserUpdate }) {
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const API_URL = 'http://localhost:4000'

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_URL}/api/patients/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: phone,
          password: password ? password : null // Şifre boşsa backend eskisini korur
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Profil güncellenemedi.')

      setMessage({ type: 'success', text: 'Profil bilgileriniz başarıyla güncellendi!' })
      setPassword('') // Güvenlik için şifre alanını temizle
      
      // Üst bileşendeki (App.jsx) session/user state'ini canlı tazelemek için tetikliyoruz
      if (onUserUpdate) {
        onUserUpdate(data.user)
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#f4f7f6' }}>
      <div style={{ maxWidth: 550, margin: '0 auto' }}>
        
        <div style={{ marginBottom: 20 }}>
          <h2>Hesap Ayarlarım</h2>
          <p className="text-sm text-muted">Kişisel bilgilerinizi inceleyin ve profil özelliklerinizi güncelleyin.</p>
        </div>

        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16, borderRadius: 8 }}>
            {message.type === 'success' ? '➔ ' : '⚠️ '} {message.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="card" style={{ padding: 24, background: 'white', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Avatar Alanı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#E1F5EE', color: '#008069', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 'bold' }}>
              {name ? name.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#111b21' }}>{name}</h4>
              <span style={{ fontSize: 12, color: '#667781' }}>{user?.role || 'Hasta Hesap Profili'}</span>
            </div>
          </div>

          {/* Değiştirilemeyen Kilitli Alanlar (TC & E-posta) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#667781', display: 'block', marginBottom: 4 }}>T.C. Kimlik Numarası (Kilitli)</label>
              <input type="text" className="text-input" value={user?.tc || '12345678901'} disabled style={{ width: '100%', background: '#f4f7f6', color: '#888', cursor: 'not-allowed', height: 38, borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#667781', display: 'block', marginBottom: 4 }}>E-posta Adresi (Kilitli)</label>
              <input type="text" className="text-input" value={user?.email || ''} disabled style={{ width: '100%', background: '#f4f7f6', color: '#888', cursor: 'not-allowed', height: 38, borderRadius: 8 }} />
            </div>
          </div>

          {/* Değiştirilebilir Alanlar */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 6 }}>Adınız ve Soyadınız</label>
            <input 
              type="text" className="text-input" required value={name} 
              onChange={e => setName(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8 }} 
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 6 }}>Telefon Numaranız</label>
            <input 
              type="text" className="text-input" placeholder="05xx xxx xx xx" value={phone} 
              onChange={e => setPhone(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8 }} 
              disabled={loading}
            />
          </div>

          <div style={{ borderTop: '1px dashed #eee', paddingTop: 16, marginTop: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 2 }}>Yeni Şifre Belirle</label>
            <span style={{ fontSize: 11, color: '#667781', display: 'block', marginBottom: 6 }}>Şifrenizi değiştirmek istemiyorsanız bu alanı boş bırakabilirsiniz.</span>
            <input 
              type="password" className="text-input" placeholder="••••••••" value={password} 
              onChange={e => setPassword(e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8 }} 
              disabled={loading}
            />
          </div>

          {/* Kaydetme Butonu */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              className="btn-primary btn"
              style={{ height: 40, padding: '0 24px', borderRadius: 20, background: '#008069', border: 'none', fontWeight: '600', cursor: 'pointer' }}
              disabled={loading}
            >
              {loading ? 'Değişiklikler Kaydediliyor...' : 'Değişiklikleri Güvenle Kaydet'}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}