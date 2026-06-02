import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const API_URL = 'http://localhost:4000'

/* ── Veritabanından Dönene Kadar Geçici Mock Listeler (Randevular Hariç) ──────────────── */
const CHANGE_REQUESTS = [
  {
    type: 'Cancellation',   typeCls: 'badge-red',
    patient: 'Selin Aydın', doctor: 'Dr. Ayşe Kaya',
    date: '18 Nisan 14:00',  newDate: null,    status: 'Pending', statusCls: 'badge-amber',
  },
  {
    type: 'Reschedule',    typeCls: 'badge-blue',
    patient: 'Can Özkan',  doctor: 'Dr. Mehmet Yılmaz',
    date: '17 Nisan 11:00', newDate: '18 Nisan 10:00', status: 'Pending', statusCls: 'badge-amber',
  }
]

const PATIENTS = [
  { name: 'Elif Korkmaz',   tc: '12345678901', email: 'elif@email.com',   phone: '0533 111 22 33' },
  { name: 'Can Özkan',      tc: '23456789012', email: 'can@email.com',    phone: '0532 222 33 44' }
]

const DOCTORS = [
  { name: 'Dr. Ayşe Kaya', branch: 'Clinical Psychologist' },
  { name: 'Dr. Mehmet Yılmaz', branch: 'Psychiatrist' },
  { name: 'Dr. Zeynep Demir', branch: 'Clinical Psychologist' }
]

const BRANCHES = ['Clinical Psychologist', 'Psychiatrist', 'Neurology', 'Internal Medicine']
const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

function calculateUrgency(description) {
  const text = (description || '').toLowerCase()
  if (!text.trim()) return { label: 'Belirlenmedi', badge: 'badge-amber' }
  const urgentWords = ['şiddetli', 'acı', 'şok', 'nefes', 'kanama', 'bayıl', 'kalp', 'göğüs', 'göğüs ağrısı']
  if (urgentWords.some(word => text.includes(word))) return { label: 'Acil', badge: 'badge-red' }
  return { label: 'Normal', badge: 'badge-blue' }
}

/* ── 1. DASHBOARD SUB-VIEW ──────────────────────────────────────── */
function StaffDashboard() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Staff Panel</div>
      <div className="text-sm text-muted mb-4">Klinik günlük operasyon ve randevu takip paneli.</div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: "Bugünün Klinik İşlemleri", val: '12', icon: 'ti-users',           color: 'var(--teal)' },
          { label: 'Onay Bekleyen Talepler',        val: 'Önizleme',  icon: 'ti-clock',           color: 'var(--amber-text)' },
          { label: 'Değişiklik İstekleri',             val: '2',  icon: 'ti-refresh-alert',   color: 'var(--blue-text)' },
        ].map((m, i) => (
          <div key={i} className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="metric-label">{m.label}</div>
              <i className={`ti ${m.icon}`} style={{ color: m.color, fontSize: 18 }} />
            </div>
            <div className="metric-val">{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 2. ASSISTED BOOKING SUB-VIEW ────────────────────────────────── */
function AssistedBooking() {
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientTc, setPatientTc] = useState('')
  const [symptomDescription, setSymptomDescription] = useState('')
  const [branch, setBranch] = useState('')
  const [doctor, setDoctor] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [visitType, setVisitType] = useState('Online')
  const [note, setNote] = useState('')
  const [booked, setBooked] = useState(false)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/doctors`).then(res => res.json()),
      fetch(`${API_URL}/api/patients`).then(res => res.json())
    ]).then(([docData, patData]) => {
      setDoctors(docData)
      setPatients(patData)
    }).catch(() => setErrorMessage('Klinik kaynakları backendden yüklenemedi.'))
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
        <textarea className="text-input w-full" placeholder="Şikayet / Belirtiler (Triage Öncelik Belirleme İçin)" value={symptomDescription} onChange={e => setSymptomDescription(e.target.value)} />
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

/* ── 3. APPOINTMENT MANAGEMENT SUB-VIEW (DİNAMİK ONAYLAMA & REDDETME AKTİF) ── */
function AppointmentManagement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Canlı randevuları veritabanından çeken fonksiyon
  const loadRealTimeAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/admin/all-appointments`)
      if (!response.ok) throw new Error('Randevular veritabanından alınamadı.')
      const data = await response.json()
      
      // Gelen verileri tabloya uygun formata map'liyoruz
      const mapped = data.map(a => ({
        id: a.id,
        formattedId: `#APT-${a.id.toString().padStart(4, '0')}`,
        patient: a.patient_name || 'Bilinmeyen Hasta',
        doctor: a.doctor_name || 'Bilinmeyen Doktor',
        date: a.date,
        time: a.time,
        type: a.type || 'Online',
        status: a.status || 'Pending',
        statusCls: a.status?.toLowerCase() === 'confirmed' ? 'badge-green' : a.status?.toLowerCase() === 'cancelled' ? 'badge-red' : 'badge-amber',
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

  // CANLI ONAYLAMA (APPROVE) FONKSİYONU
  const handleApprove = async (numericId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${numericId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' })
      })
      if (!response.ok) throw new Error('Onaylama işlemi başarısız.')
      setMessage(`Randevu #${numericId} başarıyla onaylandı (Confirmed).`)
      loadRealTimeAppointments() // Listeyi canlı olarak yeniler
    } catch (err) {
      setError(err.message)
    }
  }

  // CANLI REDDETME / İPTAL (REJECT) FONKSİYONU
  const handleReject = async (numericId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${numericId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      })
      if (!response.ok) throw new Error('Reddetme işlemi başarısız.')
      setMessage(`Randevu #${numericId} personel tarafından iptal edildi (Cancelled).`)
      loadRealTimeAppointments() // Listeyi canlı olarak yeniler
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
          <option value="cancelled">Cancelled (İptal)</option>
        </select>
      </div>

      {message && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{message}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}>Canlı veritabanı kayıtları yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20 }} className="text-muted">Eşleşen veya veritabanında kayıtlı canlı randevu bulunamadı.</div>
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
                  <td style={{ padding: '9px 14px' }}><span className={`badge ${a.statusCls}`}>{a.status}</span></td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#008069', border: 'none', color: 'white' }}
                        onClick={() => handleApprove(a.id)}
                        disabled={a.status.toLowerCase() !== 'pending'}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--red-text)', background: 'var(--red-bg)', border: 'none' }}
                        onClick={() => handleReject(a.id)}
                        disabled={a.status.toLowerCase() !== 'pending'}
                      >
                        Reject
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

/* ── 4. CHANGE REQUESTS SUB-VIEW ────────────────────────────────── */
function ChangeRequests() {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Tarih Değişiklik Talepleri</div>
      <div className="text-sm text-muted mb-4">Hastaların iptal ve güncelleme başvurularını inceleyin.</div>
      <div className="card" style={{ padding: 16 }} className="text-muted">Aktif değişiklik başvurusu bulunmamaktadır.</div>
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