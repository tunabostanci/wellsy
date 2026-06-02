import { useEffect, useState } from 'react'

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('overview')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form States
  const [accType, setAccType] = useState('doctor') 
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [clinic, setClinic] = useState('')

  const apiUrl = 'http://localhost:4000'

  const fetchData = async () => {
    try {
      setLoading(true)
      const docRes = await fetch(`${apiUrl}/api/doctors`)
      const patRes = await fetch(`${apiUrl}/api/patients`)
      setDoctors(await docRes.json())
      setPatients(await patRes.json())
    } catch (err) {
      setError('Veritabanı bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (!name || !email || !password) {
      setError('Lütfen tüm temel alanları doldurunuz.')
      return
    }

    try {
      let response;
      if (accType === 'doctor') {
        response = await fetch(`${apiUrl}/api/admin/create-doctor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, specialty, clinic, email, password, tags: [specialty || 'General'] }),
        })
      } else {
        response = await fetch(`${apiUrl}/api/admin/create-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: accType }),
        })
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Hesap oluşturulamadı.')

      setSuccess(`Şifreli yeni ${accType} yetkilisi başarıyla sisteme işlendi!`)
      setName(''); setEmail(''); setPassword(''); setSpecialty(''); setClinic('')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '14px 24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Üst Sekme Navigasyonu (Admin Alt Menüsü Olarak Kullanışlı Hale Getirildi) */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #eee', marginBottom: 20, paddingBottom: 8 }}>
        {[
          { id: 'overview', label: 'Sistem Özeti', icon: 'ti-chart-bar' },
          { id: 'create-account', label: 'Yeni Yetkili Tanımla', icon: 'ti-user-plus' },
          { id: 'doctors', label: 'Doktor Networkü', icon: 'ti-stethoscope' },
          { id: 'patients', label: 'Hasta & Personel Rehberi', icon: 'ti-address-book' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveSection(tab.id); setError(''); setSuccess('') }}
            style={{
              padding: '6px 14px', background: activeSection === tab.id ? '#2C2C2A' : 'transparent',
              color: activeSection === tab.id ? '#fff' : '#667781', border: 'none',
              borderRadius: '16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            <i className={`ti ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{success}</div>}

      {/* SUB-VIEWS */}
      {activeSection === 'overview' && (
        <div>
          <h3 style={{ fontSize: 17, marginBottom: 12 }}>Sistem Kaynak Özeti</h3>
          <div className="metrics-grid" style={{ display: 'flex', gap: 16 }}>
            <div className="metric-card" style={{ padding: 20, background: 'white', flex: 1, borderRadius: 12, border: '1px solid #e9edef' }}>
              <div style={{ fontSize: 13, color: '#667781' }}>Aktif Uzman Doktor Sayısı</div>
              <div style={{ fontSize: 24, fontWeight: '600', marginTop: 8, color: '#2C2C2A' }}>{loading ? '...' : doctors.length}</div>
            </div>
            <div className="metric-card" style={{ padding: 20, background: 'white', flex: 1, borderRadius: 12, border: '1px solid #e9edef' }}>
              <div style={{ fontSize: 13, color: '#667781' }}>Kayıtlı Toplam Kullanıcı</div>
              <div style={{ fontSize: 24, fontWeight: '600', marginTop: 8, color: '#2C2C2A' }}>{loading ? '...' : patients.length}</div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'create-account' && (
        <div className="card" style={{ padding: 24, maxWidth: 500, background: 'white', borderRadius: 12, border: '1px solid #e9edef' }}>
          <h4 style={{ margin: 0 }}>Yeni Sistem Yetkilisi Tanımla</h4>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Sadece yönetici rolü yeni doktor veya personel atama yetkisine sahiptir.</p>
          
          <form onSubmit={handleCreateAccount} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 4 }}>Hesap Yetki Türü</label>
              <select className="text-input" style={{ width: '100%', height: 38, borderRadius: 8 }} value={accType} onChange={e => setAccType(e.target.value)}>
                <option value="doctor">Doktor (Doctor)</option>
                <option value="Staff">Klinik Personeli (Staff)</option>
                <option value="admin">Sistem Yöneticisi (Admin)</option>
              </select>
            </div>

            <input type="text" className="text-input" style={{ height: 38, borderRadius: 8 }} placeholder="Adı Soyadı" value={name} onChange={e => setName(e.target.value)} required />
            <input type="email" className="text-input" style={{ height: 38, borderRadius: 8 }} placeholder="E-posta Adresi" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" className="text-input" style={{ height: 38, borderRadius: 8 }} placeholder="Sistem Giriş Şifresi" value={password} onChange={e => setPassword(e.target.value)} required />

            {accType === 'doctor' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input type="text" className="text-input" style={{ height: 38, borderRadius: 8 }} placeholder="Branş / Uzmanlık" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                <input type="text" className="text-input" style={{ height: 38, borderRadius: 8 }} placeholder="Atanacağı Klinik" value={clinic} onChange={e => setClinic(e.target.value)} />
              </div>
            )}

            <button type="submit" className="btn-primary btn" style={{ height: 40, background: '#2C2C2A', border: 'none', borderRadius: 20, cursor: 'pointer', marginTop: 6 }}>Sistem Hesabını Veritabanına İşle</button>
          </form>
        </div>
      )}

      {activeSection === 'doctors' && (
        <div className="card" style={{ padding: 20, background: 'white', borderRadius: 12 }}>
          <h4 style={{ marginBottom: 12 }}>Kayıtlı Doktorlar Listesi</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {doctors.map((d, i) => (
              <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <i className="ti ti-stethoscope" style={{ color: '#667781', marginRight: 8 }} />
                <strong style={{ color: '#111b21' }}>{d.name}</strong> — {d.specialty} <span style={{ color: '#667781' }}>({d.email})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeSection === 'patients' && (
        <div className="card" style={{ padding: 20, background: 'white', borderRadius: 12 }}>
          <h4 style={{ marginBottom: 12 }}>Kayıtlı Sistem Kullanıcıları</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {patients.map((p, i) => (
              <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                <i className="ti ti-user" style={{ color: '#667781', marginRight: 8 }} />
                <strong style={{ color: '#111b21' }}>{p.name}</strong> — Rol: <span className="badge" style={{ background: '#e1f5ee', color: '#0f6e56', padding: '2px 6px', borderRadius: '4px', fontSize: 11 }}>{p.role}</span> <span style={{ color: '#667781' }}>({p.email})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}