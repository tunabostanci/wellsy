import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const API_URL = 'http://localhost:4000'

/* ── Veritabanından Dönene Kadar Geçici Mock Listeler ──────────────── */
const PATIENTS = [
  { name: 'Elif Korkmaz',   tc: '12345678901', email: 'elif@email.com',   phone: '0533 111 22 33' },
  { name: 'Can Özkan',      tc: '23456789012', email: 'can@email.com',    phone: '0532 222 33 44' }
]

const BRANCHES = ['Clinical Psychologist', 'Psychiatrist', 'Neurology', 'Internal Medicine']
const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

/* ── 1. DASHBOARD SUB-VIEW (DİNAMİK METRİKLER AKTİF) ──────────────────────────────── */
function StaffDashboard() {
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [cancellationCount, setCancellationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dashboard metriklerini canlı olarak beslemek için backend'den tüm randevuları ve talepleri sorguluyoruz
    const loadDashboardMetrics = async () => {
      try {
        setLoading(true)
        
        // 1. Tüm randevuları çekip toplam sayıyı buluyoruz
        const apptsRes = await fetch(`${API_URL}/api/admin/all-appointments`)
        if (apptsRes.ok) {
          const apptsData = await apptsRes.json()
          setTotalAppointments(apptsData.length)
          
          // Durumu 'Pending' olan onay bekleyen randevuların sayısını hesapla
          const pending = apptsData.filter(a => a.status?.toLowerCase() === 'pending').length
          setPendingCount(pending)
        }

        // 2. İptal istekleri sekmesini besleyen endpoint'ten aktif iptal talebi sayısını çekiyoruz
        const changesRes = await fetch(`${API_URL}/api/admin/change-requests`)
        if (changesRes.ok) {
          const changesData = await changesRes.json()
          setCancellationCount(changesData.length)
        }

      } catch (err) {
        console.error("Dashboard metrikleri yüklenirken hata oluştu:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardMetrics()
  }, [])

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Staff Panel</div>
      <div className="text-sm text-muted mb-4">Klinik günlük operasyon ve randevu takip paneli.</div>

      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { 
            label: "Toplam Klinik Randevusu", 
            val: loading ? "..." : totalAppointments, 
            icon: 'ti-users', 
            color: 'var(--teal)' 
          },
          { 
            label: 'Onay Bekleyen Talepler', 
            val: loading ? "..." : `${pendingCount} Randevu`, 
            icon: 'ti-clock', 
            color: '#854F0B' 
          },
          { 
            label: 'İptal / Değişiklik İstekleri', 
            val: loading ? "..." : `${cancellationCount} Talep`, 
            icon: 'ti-refresh-alert', 
            color: '#d9383a' 
          },
        ].map((m, i) => (
          <div key={i} className="metric-card" style={{ padding: 16, background: 'white', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="metric-label" style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{m.label}</div>
              <i className={`ti ${m.icon}`} style={{ color: m.color, fontSize: 20 }} />
            </div>
            <div className="metric-val" style={{ fontSize: 22, fontWeight: 600, marginTop: 10, color: '#111b21' }}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 2. ASSISTED BOOKING SUB-VIEW ────────────────────────────────── */
function AssistedBooking() {
  const [patientEmail, setPatientEmail] = useState('')
  const [symptomDescription, setSymptomDescription] = useState('')
  const [branch, setBranch] = useState('')
  const [doctor, setDoctor] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [visitType, setVisitType] = useState('Online')
  const [booked, setBooked] = useState(false)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/doctors`)
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(() => setErrorMessage('Klinik kaynakları backendden yüklenemedi.'))
  }, [])

  const availableDoctors = doctors.filter(d => !branch || d.specialty === branch)
  const canBook = patientEmail && doctor && date && slot

  const handleBook = async () => {
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_email: patientEmail,
          doctor_name: doctor,
          appointment_date: date,
          appointment_time: slot,
          type: visitType,
          note: symptomDescription
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Randevu oluşturulamadı.')
      setBookingInfo(body)
      setBooked(true)
    } catch (err) {
      setErrorMessage(err.message)
    }
  }

  if (booked && bookingInfo) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <i className="ti ti-circle-check" style={{ fontSize: 40, color: 'var(--teal)', marginBottom: 12 }} />
        <h4>Randevu Başarıyla Taleplere Eklendi</h4>
        <p className="text-sm text-muted mb-3">Oluşturulan randevu bekleme durumunda (Pending) sisteme işlenmiştir.</p>
        <button className="btn-primary btn" onClick={() => setBooked(false)}>Yeni Randevu Yaz</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Hasta Bilgileri</div>
        <input className="text-input w-full mb-2" placeholder="Hasta E-posta Adresi" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} />
        <textarea className="text-input w-full" placeholder="Şikayet / Belirtiler" value={symptomDescription} onChange={e => setSymptomDescription(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 10 }}>Branş & Doktor Seçimi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <select className="select-input" value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="">Branş Seçiniz</option>
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="select-input" value={doctor} onChange={e => setDoctor(e.target.value)}>
            <option value="">Doktor Seçiniz</option>
            {availableDoctors.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input type="date" className="text-input" value={date} onChange={e => setDate(e.target.value)} />
          <select className="select-input" value={slot} onChange={e => setSlot(e.target.value)}>
            <option value="">Saat Seçiniz</option>
            {SLOTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {errorMessage && <div className="alert alert-error mb-2">{errorMessage}</div>}
        <button className="btn-primary btn w-full" disabled={!canBook} onClick={handleBook}>Randevuyu Sisteme İşle</button>
      </div>
    </div>
  )
}

/* ── 3. APPOINTMENT MANAGEMENT SUB-VIEW (ONAYLAMA BUTONLARI DÜZELTİLDİ) ── */
function AppointmentManagement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadRealTimeAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/all-appointments`)
      if (!response.ok) throw new Error('Randevular veritabanından alınamadı.')
      const data = await response.json()
      
      const mapped = data.map(a => ({
        id: a.id,
        formattedId: `#APT-${a.id.toString().padStart(4, '0')}`,
        patient: a.patient_name || 'Bilinmeyen Hasta',
        doctor: a.doctor_name || 'Bilinmeyen Doktor',
        date: a.date,
        time: a.time,
        type: a.type || 'Online',
        status: a.status || 'Pending',
        statusCls: a.status === 'Confirmed' ? 'badge-green' : (a.status === 'Cancelled' || a.status === 'Cancellation Requested') ? 'badge-red' : 'badge-amber',
      }))
      setAppointments(mapped)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRealTimeAppointments()
  }, [])

  const handleApprove = async (numericId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${numericId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' })
      })
      if (!response.ok) throw new Error('Onaylama işlemi başarısız.')
      setMessage(`Randevu #${numericId} başarıyla onaylandı (Confirmed).`)
      loadRealTimeAppointments()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleReject = async (numericId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${numericId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      })
      if (!response.ok) throw new Error('İptal işlemi başarısız.')
      setMessage(`Randevu #${numericId} başarıyla iptal edildi (Cancelled).`)
      loadRealTimeAppointments()
    } catch (err) {
      setError(err.message)
    }
  }

  const filtered = appointments.filter(a => {
    const matchesSearch = a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase()) ||
      a.formattedId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || a.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Klinik Canlı Randevu Listesi</div>
      <div className="text-sm text-muted mb-4">Veritabanından çekilen gerçek zamanlı randevuları yönetin, onaylayın veya iptal edin.</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="text-input"
          style={{ flex: 1, minWidth: 250 }}
          placeholder="Hasta e-posta, doktor adı veya ID ile arama yapın..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">Tüm Durumlar</option>
          <option value="confirmed">Confirmed (Onaylı)</option>
          <option value="pending">Pending (Beklemede)</option>
          <option value="cancellation requested">Cancellation Requested (İptal İstendi)</option>
          <option value="cancelled">Cancelled (İptal Edildi)</option>
        </select>
      </div>

      {message && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{message}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Canlı veritabanı kayıtları yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }} className="text-muted">Canlı randevu bulunamadı.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Randevu ID', 'Hasta E-posta', 'Doktor', 'Tarih', 'Saat', 'Tip', 'Durum', 'Aksiyonlar'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: 'var(--text-3)' }}>{a.formattedId}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 500 }}>{a.patient}</td>
                  <td style={{ padding: '9px 14px' }}>{a.doctor}</td>
                  <td style={{ padding: '9px 14px' }}>{a.date}</td>
                  <td style={{ padding: '9px 14px' }}>{a.time}</td>
                  <td style={{ padding: '9px 14px' }}><span className="tag">{a.type}</span></td>
                  <td style={{ padding: '9px 14px' }}>
                    <span className={`badge ${a.statusCls}`}>
                      {a.status === 'Cancellation Requested' ? 'İptal İstendi' : a.status}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* ONAYLAMA BUTONU: Hem Pending hem de Cancellation Requested durumunda aktif çalışır */}
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#008069', border: 'none', color: 'white' }}
                        onClick={() => handleApprove(a.id)}
                        disabled={a.status !== 'Pending'}
                      >
                        Approve
                      </button>
                      
                      {/* REDDETME / İPTAL BUTONU: Durum 'Pending' veya 'Cancellation Requested' ise tıklanabilir */}
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px', color: 'white', background: '#d9383a', border: 'none' }}
                        onClick={() => handleReject(a.id)}
                        disabled={a.status !== 'Pending' && a.status !== 'Cancellation Requested'}
                      >
                        Reject / Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ── 4. CHANGE REQUESTS SUB-VIEW (DİNAMİK BAĞLANDI) ──────────────── */
function ChangeRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadChangeRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/admin/change-requests`)
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChangeRequests()
  }, [])

  const handleApproveCancel = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      })
      if (res.ok) {
        setMessage('Randevu iptal talebi başarıyla onaylandı ve veritabanından silindi.')
        loadChangeRequests()
      }
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Tarih / İptal Değişiklik Talepleri</div>
      <div className="text-sm text-muted mb-4">Hastaların gönderdiği aktif randevu iptal başvurularını inceleyin.</div>

      {message && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{message}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Talepler yükleniyor...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 20 }} className="text-muted">Şu an sistemde onay bekleyen aktif bir iptal başvurusu bulunmuyor.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                {['Randevu ID', 'Hasta E-posta', 'Doktor', 'Mevcut Tarih', 'Durum', 'Aksiyon'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '9px 14px', fontFamily: 'monospace' }}>#APT-{r.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 500 }}>{r.patient_name}</td>
                  <td style={{ padding: '9px 14px' }}>{r.doctor_name}</td>
                  <td style={{ padding: '9px 14px' }}>{r.date} - {r.time}</td>
                  <td style={{ padding: '9px 14px' }}><span className="badge badge-red" style={{ background: '#fff1f1', color: '#d9383a' }}>İptal İstendi</span></td>
                  <td style={{ padding: '9px 14px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ padding: '4px 8px', fontSize: '11px', background: '#d9383a', border: 'none', color: 'white', cursor: 'pointer' }}
                      onClick={() => handleApproveCancel(r.id)}
                    >
                      İptali Onayla (Approve)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ── MAIN STAFF PANEL KAPSAYICISI ───────────────────────────────── */
const NAV = [
  { icon: 'ti-layout-dashboard', label: 'Dashboard',     view: 'dashboard' },
  { icon: 'ti-user-plus',        label: 'Create Booking',view: 'booking'   },
  { icon: 'ti-calendar',         label: 'Appointments',  view: 'appts'     },
  { icon: 'ti-refresh-alert',    label: 'Change Requests',view: 'changes'  },
]

export default function StaffPanel({ defaultView = 'dashboard' }) {
  const [activeView, setActiveView] = useState(defaultView)

  useEffect(() => {
    setActiveView(defaultView)
  }, [defaultView])

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={NAV.map(n => ({ ...n, active: n.view === activeView, onClick: () => setActiveView(n.view) }))}
        user={{ initials: 'MM', name: 'Mustafa Mert Cemil', role: 'Clinic Staff' }}
      />
      <div className="main-area" style={{ overflowY: 'auto', height: '100vh', padding: 24, width: '100%' }}>
        {activeView === 'dashboard' && <StaffDashboard />}
        {activeView === 'booking'   && <AssistedBooking />}
        {activeView === 'appts'     && <AppointmentManagement />}
        {activeView === 'changes'   && <ChangeRequests />}
      </div>
    </div>
  )
}