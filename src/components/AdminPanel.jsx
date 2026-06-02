import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const ADMIN_NAV = [
  { icon: 'ti-layout-dashboard', label: 'Overview', view: 'overview' },
  { icon: 'ti-user-plus', label: 'Create Account', view: 'create-account' }, // Sadece admin hesap açabilir
  { icon: 'ti-stethoscope', label: 'Doctors Network', view: 'doctors' },
  { icon: 'ti-user-heart', label: 'Patients Directory', view: 'patients' },
]

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('overview')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form State Değişkenleri
  const [accType, setAccType] = useState('doctor') // doctor | staff | admin
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

  // Hesap Oluşturma Tetikleyicisi
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

      setSuccess(`Şifreli ${accType} hesabı başarıyla veritabanına işlendi!`)
      setName(''); setEmail(''); setPassword(''); setSpecialty(''); setClinic('')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={ADMIN_NAV.map(item => ({
          ...item,
          active: item.view === activeSection,
          onClick: () => { setActiveSection(item.view); setError(''); setSuccess('') },
        }))}
        user={{ initials: 'AD', name: 'Sistem Yöneticisi', role: 'Admin' }}
      />
      <div className="main-area" style={{ overflowY: 'auto', height: '100vh', padding: 24 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56' }}>{success}</div>}

        {activeSection === 'overview' && (
          <div>
            <h3>Sistem Özeti</h3>
            <div className="metrics-grid" style={{ display: 'flex', gap: 14, marginTop: 14 }}>
              <div className="metric-card" style={{ padding: 20, background: 'white', flex: 1, borderRadius: 8 }}>
                <div className="metric-label">Aktif Doktor Sayısı</div>
                <div className="metric-val">{doctors.length}</div>
              </div>
              <div className="metric-card" style={{ padding: 20, background: 'white', flex: 1, borderRadius: 8 }}>
                <div className="metric-label">Kayıtlı Kullanıcı/Hasta</div>
                <div className="metric-val">{patients.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN ÖZEL: HESAP OLUŞTURMA PANELİ */}
        {activeSection === 'create-account' && (
          <div className="card" style={{ padding: 24, maxWidth: 500, background: 'white', borderRadius: 8 }}>
            <h4>Yeni Yetkili Hesabı Tanımla</h4>
            <p className="text-sm text-muted">Sadece admin rolü yeni doktor, staff veya admin oluşturma yetkisine sahiptir.</p>
            
            <form onSubmit={handleCreateAccount} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Hesap Tipi</label>
                <select className="text-input" style={{ width: '100%' }} value={accType} onChange={e => setAccType(e.target.value)}>
                  <option value="doctor">Doktor (Doctor)</option>
                  <option value="Staff">Klinik Personeli (Staff)</option>
                  <option value="admin">Sistem Yöneticisi (Admin)</option>
                </select>
              </div>

              <input type="text" className="text-input" placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} required />
              <input type="email" className="text-input" placeholder="E-posta Adresi" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" className="text-input" placeholder="Güvenli Şifre" value={password} onChange={e => setPassword(e.target.value)} required />

              {accType === 'doctor' && (
                <>
                  <input type="text" className="text-input" placeholder="Uzmanlık Alanı (Branş)" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                  <input type="text" className="text-input" placeholder="Klinik Adı" value={clinic} onChange={e => setClinic(e.target.value)} />
                </>
              )}

              <button type="submit" className="btn-primary btn" style={{ marginTop: 10 }}>Sistem Hesabını Oluştur</button>
            </form>
          </div>
        )}

        {activeSection === 'doctors' && (
          <div className="card" style={{ padding: 16, background: 'white' }}>
            <h4>Kayıtlı Doktorlar Listesi</h4>
            <ul>{doctors.map((d, i) => <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}><strong>{d.name}</strong> - {d.specialty} ({d.email})</li>)}</ul>
          </div>
        )}

        {activeSection === 'patients' && (
          <div className="card" style={{ padding: 16, background: 'white' }}>
            <h4>Kayıtlı Hastalar ve Personeller</h4>
            <ul>{patients.map((p, i) => <li key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}><strong>{p.name}</strong> - Rol: <span className="badge">{p.role}</span> ({p.email})</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  )
}