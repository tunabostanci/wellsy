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
      setError('Geçmiş veya gelecek randevu verileri veritabanından çekilemedi.')
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
          <h2>Randevu Takip Merkezi</h2>
          <p className="text-sm text-muted">Mevcut sağlık randevularınızı ve klinik ziyaret geçmişinizi kontrol edin.</p>
        </div>
        <button className="btn-primary btn" onClick={onNewAppointment}><i className="ti ti-plus" /> Yeni Randevu Al</button>
      </div>

      {/* Tab Navigasyon Çubuğu */}
      <div className="flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <button 
          className={`btn ${tab === 'upcoming' ? 'btn-primary' : ''}`} 
          onClick={() => setTab('upcoming')}
        >
          Yaklaşan Randevular ({upcoming.length})
        </button>
        <button 
          className={`btn ${tab === 'past' ? 'btn-primary' : ''}`} 
          onClick={() => setTab('past')}
        >
          Geçmiş Ziyaretler ({past.length})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="alert alert-info">Randevu kayıtları veritabanından doğrulanıyor...</div>}

      {!loading && currentList.length === 0 && (
        <div className="card text-muted" style={{ padding: 30, textAlign: 'center', background: '#fff', borderRadius: 8 }}>
          Seçili kategoride henüz bir randevunuz bulunmamaktadır.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {currentList.map((appt) => (
          <div 
            key={appt.id} 
            className="card" 
            style={{ 
              padding: 16, 
              background: 'white', 
              borderRadius: 8, 
              borderLeft: tab === 'upcoming' ? '4px solid #008069' : '4px solid #667781', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{appt.doctor}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                {appt.doctor_specialty} • <span className="text-muted">{appt.clinic}</span>
              </div>
              {appt.note && (
                <div style={{ fontSize: 12, color: '#667781', marginTop: 6, fontStyle: 'italic' }}>
                  <strong>Notunuz:</strong> {appt.note}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 600, color: '#008069', fontSize: 14 }}>
                <i className="ti ti-calendar" /> {appt.date}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                <i className="ti ti-clock" /> Saat: {appt.time}
              </div>
              <span className={`badge ${appt.status === 'Confirmed' ? 'badge-green' : 'badge-amber'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                {appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}