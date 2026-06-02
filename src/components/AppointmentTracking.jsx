import { useEffect, useState } from 'react'

const SLOTS = ['09:00', '10:00', '11:00', '11:30', '13:30', '14:00', '15:30', '16:00']

export default function AppointmentTracking({ patient, onNewAppointment = () => {} }) {
  const [tab, setTab] = useState('upcoming')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestMsg, setRequestMsg] = useState('')
  const [rescheduleFor, setRescheduleFor] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

  const submitCancellation = async (appt) => {
    setRequestMsg('')
    try {
      const response = await fetch(`${API_URL}/api/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appt.id, type: 'Cancellation' }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Talep gönderilemedi.')
      setRequestMsg('İptal talebiniz kliniğe iletildi. Onay bekleniyor.')
    } catch (err) {
      setRequestMsg(err.message)
    }
  }

  const submitReschedule = async (appt) => {
    if (!newDate || !newTime) return
    setRequestMsg('')
    try {
      const response = await fetch(`${API_URL}/api/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appt.id, type: 'Reschedule', requested_date: newDate, requested_time: newTime }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Talep gönderilemedi.')
      setRequestMsg('Erteleme talebiniz kliniğe iletildi. Onay bekleniyor.')
      setRescheduleFor(null); setNewDate(''); setNewTime('')
    } catch (err) {
      setRequestMsg(err.message)
    }
  }

  const currentList = tab === 'upcoming' ? upcoming : past

  return (
    <div className="page" style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2>Randevularım</h2>
          <p className="text-sm text-muted"> Wellsye kayıtlı güncel ve geçmiş randevu takibiniz.</p>
        </div>
        <button type="button" className="btn-primary btn" onClick={onNewAppointment} style={{ borderRadius: '20px', background: 'var(--teal)', border: 'none' }}>
          <i className="ti ti-plus" /> Yeni Randevu Al
        </button>
      </div>

      {/* Sekme Seçimi */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', marginBottom: 20, paddingBottom: 8 }}>
        <button type="button" style={{ background: 'none', border: 'none', fontWeight: tab === 'upcoming' ? '600' : '400', color: tab === 'upcoming' ? 'var(--teal)' : 'var(--text-2)', cursor: 'pointer', fontSize: '14px' }} onClick={() => setTab('upcoming')}>
          Yaklaşan Randevular ({upcoming.length})
        </button>
        <button type="button" style={{ background: 'none', border: 'none', fontWeight: tab === 'past' ? '600' : '400', color: tab === 'past' ? 'var(--teal)' : 'var(--text-2)', cursor: 'pointer', fontSize: '14px' }} onClick={() => setTab('past')}>
          Geçmiş Randevular ({past.length})
        </button>
      </div>

      {loading && <div className="alert alert-info">Randevu kayıtlarınız PostgreSQL'den yükleniyor...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {requestMsg && <div className="alert alert-info" style={{ marginBottom: 12 }}>{requestMsg}</div>}

      {!loading && !error && currentList.length === 0 && (
        <div className="alert alert-warning">Bu kategoride henüz bir randevunuz bulunmamaktadır.</div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {currentList.map((appt) => (
          <div key={appt.id} className="card" style={{ padding: 16, background: 'white', borderRadius: 8, borderLeft: tab === 'upcoming' ? '4px solid var(--teal)' : '4px solid var(--text-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{appt.doctor}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{appt.doctor_specialty} • <span className="text-muted">{appt.clinic}</span></div>
                {appt.note && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, fontStyle: 'italic' }}><strong>Notunuz:</strong> {appt.note}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--teal)', fontSize: 14 }}><i className="ti ti-calendar" /> {appt.date}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}><i className="ti ti-clock" /> Saat: {appt.time}</div>
                <span className={`badge`} style={{ marginTop: 6, display: 'inline-block', background: appt.status === 'Confirmed' ? 'var(--teal-light)' : appt.status === 'Cancelled' ? 'var(--red-bg)' : 'var(--amber-bg)', color: appt.status === 'Confirmed' ? 'var(--teal-dark)' : appt.status === 'Cancelled' ? 'var(--red-text)' : 'var(--amber-text)' }}>{appt.status}</span>
              </div>
            </div>

            {tab === 'upcoming' && appt.status !== 'Cancelled' && (
              <div style={{ marginTop: 12, borderTop: '1px solid var(--bg-surface)', paddingTop: 10 }}>
                {rescheduleFor === appt.id ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" className="text-input" value={newDate} min="2026-06-02" onChange={e => setNewDate(e.target.value)} style={{ height: 34 }} />
                    <select className="text-input" value={newTime} onChange={e => setNewTime(e.target.value)} style={{ height: 34 }}>
                      <option value="">Saat seç</option>
                      {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" className="btn-primary btn btn-sm" onClick={() => submitReschedule(appt)} disabled={!newDate || !newTime}>Talep Gönder</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setRescheduleFor(null); setNewDate(''); setNewTime('') }}>Vazgeç</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-sm" onClick={() => { setRescheduleFor(appt.id); setNewDate(''); setNewTime(''); setRequestMsg('') }}>
                      <i className="ti ti-clock" /> Erteleme Talebi
                    </button>
                    <button type="button" className="btn btn-sm" style={{ color: 'var(--red-text)' }} onClick={() => submitCancellation(appt)}>
                      <i className="ti ti-x" /> İptal Talebi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}