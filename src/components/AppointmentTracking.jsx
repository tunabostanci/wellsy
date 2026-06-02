import { useEffect, useState } from 'react'

export default function AppointmentTracking({ patient, onNewAppointment = () => {}, onChatbot = () => {}, onChooseDoctor = () => {} }) {
  const [tab, setTab] = useState('upcoming')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:4000'

  const loadAppointments = async () => {
    if (!patient?.id) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/patients/${patient.id}/appointments`)
      if (!response.ok) throw new Error('Randevular yüklenemedi.')
      const appointments = await response.json()

      // Güvenli Tarih Karşılaştırması: Saatleri sıfırlayarak sadece güne bakıyoruz
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcomingList = appointments.filter(a => {
        const apptDate = new Date(a.date)
        apptDate.setHours(0, 0, 0, 0)
        return apptDate >= today
      }).sort((a, b) => new Date(a.date) - new Date(b.date))

      const pastList = appointments.filter(a => {
        const apptDate = new Date(a.date)
        apptDate.setHours(0, 0, 0, 0)
        return apptDate < today
      }).sort((a, b) => new Date(b.date) - new Date(a.date))

      setUpcoming(upcomingList)
      setPast(pastList)
    } catch (err) {
      console.error(err)
      setError('Randevu geçmişi veritabanından çekilirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [patient])

  const currentList = tab === 'upcoming' ? upcoming : past

  return (
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>Randevularım</h2>
          <p className="text-sm text-muted"> Wellsye kayıtlı güncel ve geçmiş randevu takibiniz.</p>
        </div>
        <button type="button" className="btn-primary btn" onClick={onNewAppointment} style={{ borderRadius: '20px', background: '#008069', border: 'none' }}>
          <i className="ti ti-plus" /> Yeni Randevu Al
        </button>
      </div>

      {/* Sekme Seçimi */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 8 }}>
        <button type="button" style={{ background: 'none', border: 'none', fontWeight: tab === 'upcoming' ? '600' : '400', color: tab === 'upcoming' ? '#008069' : '#667781', cursor: 'pointer', fontSize: '14px' }} onClick={() => setMode('upcoming') || setTab('upcoming')}>
          Yaklaşan Randevular ({upcoming.length})
        </button>
        <button type="button" style={{ background: 'none', border: 'none', fontWeight: tab === 'past' ? '600' : '400', color: tab === 'past' ? '#008069' : '#667781', cursor: 'pointer', fontSize: '14px' }} onClick={() => setTab('past')}>
          Geçmiş Randevular ({past.length})
        </button>
      </div>

      {loading && <div className="alert alert-info">Randevu kayıtlarınız PostgreSQL'den yükleniyor...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && currentList.length === 0 && (
        <div className="alert alert-warning">Bu kategoride henüz bir randevunuz bulunmamaktadır.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {currentList.map((appt) => (
          <div key={appt.id} className="card" style={{ padding: 16, background: 'white', borderRadius: 8, borderLeft: tab === 'upcoming' ? '4px solid #008069' : '4px solid #667781', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{appt.doctor}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{appt.doctor_specialty} • <span className="text-muted">{appt.clinic}</span></div>
              {appt.note && <div style={{ fontSize: 12, color: '#667781', marginTop: 6, italic: 'true' }}><strong>Notunuz:</strong> {appt.note}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 600, color: '#008069', fontSize: 14 }}><i className="ti ti-calendar" /> {appt.date}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}><i className="ti ti-clock" /> Saat: {appt.time}</div>
              <span className={`badge`} style={{ marginTop: 6, display: 'inline-block', background: appt.status === 'Confirmed' ? '#e1f5ee' : '#fff3cd', color: appt.status === 'Confirmed' ? '#0F6E56' : '#854F0B' }}>{appt.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}