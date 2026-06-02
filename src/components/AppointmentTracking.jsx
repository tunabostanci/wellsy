import { useEffect, useState } from 'react'

export default function AppointmentTracking({ patient, onNewAppointment = () => {}, onChatbot = () => {}, onChooseDoctor = () => {} }) {
  const [tab, setTab] = useState('upcoming')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:4000'

  // Güvenli Tarih Formatlama Fonksiyonu (ISO string'i temiz Türkçe tarihe dönüştürür)
  const formatTurkishDate = (dateStr) => {
    if (!dateStr) return ''
    // Sadece YYYY-MM-DD kısmını alarak zaman dilimi (T00:00:00.000Z) karmaşasını önleriz
    const pureDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
    const [year, month, day] = pureDateStr.split('-')
    
    // Geçerli bir JavaScript Date objesi oluşturuyoruz (Yerel saatle)
    const localDate = new Date(year, month - 1, day)
    
    return localDate.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const loadAppointments = async () => {
    if (!patient?.id) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/patients/${patient.id}/appointments`)
      if (!response.ok) throw new Error('Randevular yüklenemedi.')
      const appointments = await response.json()

      // Bugünün tarihini sadece YYYY-MM-DD olarak string formatında alıyoruz (Zaman diliminden bağımsız)
      const now = new Date()
      const todayStr = now.getFullYear() + '-' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(now.getDate()).padStart(2, '0')

      // Randevuları zaman dilimi uyuşmazlığı olmadan sadece string bazında güvenle filtreliyoruz
      const upcomingList = appointments.filter(a => {
        const apptDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date
        return apptDateStr >= todayStr
      }).sort((a, b) => {
        const dateA = a.date.includes('T') ? a.date.split('T')[0] : a.date
        const dateB = b.date.includes('T') ? b.date.split('T')[0] : b.date
        return dateA.localeCompare(dateB)
      })

      const pastList = appointments.filter(a => {
        const apptDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date
        return apptDateStr < todayStr
      }).sort((a, b) => {
        const dateA = a.date.includes('T') ? a.date.split('T')[0] : a.date
        const dateB = b.date.includes('T') ? b.date.split('T')[0] : b.date
        return dateB.localeCompare(dateA) // Geçmiş randevular en yeniden en eskiye sıralanır
      })

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
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: '100%', width: '100%', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>Randevu Takip Merkezi</h2>
          <p className="text-sm text-muted">Mevcut sağlık randevularınızı ve klinik ziyaret geçmişinizi kontrol edin.</p>
        </div>
        <button 
          className="btn-primary btn" 
          onClick={onNewAppointment}
          style={{ height: '36px', borderRadius: '18px', padding: '0 16px', fontSize: '13px', background: '#008069', border: 'none' }}
        >
          <i className="ti ti-plus" /> Yeni Randevu Al
        </button>
      </div>

      {/* Tab Navigasyon Alanı */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 4 }}>
        <button 
          type="button"
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '6px 4px',
            fontWeight: tab === 'upcoming' ? '600' : '400', 
            color: tab === 'upcoming' ? '#008069' : '#667781', 
            borderBottom: tab === 'upcoming' ? '3px solid #008069' : '3px solid transparent',
            cursor: 'pointer', 
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }} 
          onClick={() => setTab('upcoming')}
        >
          Yaklaşan Randevular ({upcoming.length})
        </button>
        <button 
          type="button"
          style={{ 
            background: 'none', 
            border: 'none', 
            padding: '6px 4px',
            fontWeight: tab === 'past' ? '600' : '400', 
            color: tab === 'past' ? '#008069' : '#667781', 
            borderBottom: tab === 'past' ? '3px solid #008069' : '3px solid transparent',
            cursor: 'pointer', 
            fontSize: '14px',
            transition: 'all 0.15s ease'
          }} 
          onClick={() => setTab('past')}
        >
          Geçmiş Ziyaretler ({past.length})
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      {loading && <div className="alert alert-info" style={{ marginBottom: 12 }}>Randevu kayıtları veritabanından doğrulanıyor...</div>}

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
      borderLeft: appt.status === 'Confirmed' ? '4px solid #008069' : appt.status === 'Cancellation Requested' ? '4px solid #d9383a' : '4px solid #854F0B', 
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
      
      {/* CANLI İPTAL ETME BUTONU: Sadece Onaylı veya Bekleyen randevularda çıkar */}
      {tab === 'upcoming' && appt.status !== 'Cancellation Requested' && appt.status !== 'Cancelled' && (
        <button
          type="button"
          style={{
            marginTop: 10, padding: '4px 10px', background: '#fff1f1', color: '#d9383a',
            border: '1px solid #fccfcf', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', fontWeight: '500'
          }}
          onClick={async () => {
            if(confirm('Bu randevu için iptal talebi oluşturmak istediğinize emin misiniz?')) {
              try {
                const res = await fetch(`${API_URL}/api/appointments/${appt.id}/request-cancel`, { method: 'PUT' });
                if(res.ok) {
                  alert('İptal talebiniz klinik personeline iletildi.');
                  loadAppointments(); // Listeyi canlı yeniler
                }
              } catch(e) { alert('Talep iletilemedi.'); }
            }
          }}
        >
          <i className="ti ti-trash" /> Randevuyu İptal Et
        </button>
      )}
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontWeight: 600, color: '#008069', fontSize: 14 }}>
        <i className="ti ti-calendar" /> {formatTurkishDate(appt.date)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
        <i className="ti ti-clock" /> Saat: {appt.time}
      </div>
      <span className={`badge ${appt.status === 'Confirmed' ? 'badge-green' : appt.status === 'Cancellation Requested' ? 'badge-red' : 'badge-amber'}`} style={{ marginTop: 6, display: 'inline-block' }}>
        {appt.status === 'Cancellation Requested' ? 'İptal Bekliyor' : appt.status}
      </span>
    </div>
  </div>
))}
      </div>
    </div>
  )
}