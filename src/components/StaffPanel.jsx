import { useEffect, useState } from 'react'
import PatientProfile from './PatientProfile.jsx' // Profil düzenleme bileşeni entegre edildi

const API_URL = 'http://localhost:4000'
const BRANCHES = ['Clinical Psychologist', 'Psychiatrist', 'Neurology', 'Internal Medicine']
const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

/* ── 1. DASHBOARD SUB-VIEW ──────────────────────────────── */
function StaffDashboard() {
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [cancellationCount, setCancellationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardMetrics = async () => {
      try {
        setLoading(true)
        const apptsRes = await fetch(`${API_URL}/api/admin/all-appointments`)
        if (apptsRes.ok) {
          const apptsData = await apptsRes.json()
          setTotalAppointments(apptsData.length)
          const pending = apptsData.filter(a => a.status?.toLowerCase() === 'pending').length
          setPendingCount(pending)
        }
        const changesRes = await fetch(`${API_URL}/api/admin/change-requests`)
        if (changesRes.ok) {
          const changesData = await changesRes.json()
          setCancellationCount(changesData.length)
        }
      } catch (err) {
        console.error("Metrics error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardMetrics()
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4, color: '#111b21' }}>Staff Panel Operasyon Merkezi</div>
      <div className="text-sm text-muted mb-4">Klinik günlük operasyon ve randevu takip paneli.</div>

      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: "Toplam Klinik Randevusu", val: loading ? "..." : totalAppointments, icon: 'ti-users', color: 'var(--teal)' },
          { label: 'Onay Bekleyen Talepler', val: loading ? "..." : `${pendingCount} Randevu`, icon: 'ti-clock', color: '#854F0B' },
          { label: 'İptal / Değişiklik İstekleri', val: loading ? "..." : `${cancellationCount} Talep`, icon: 'ti-refresh-alert', color: '#d9383a' },
        ].map((m, i) => (
          <div key={i} className="metric-card" style={{ padding: 16, background: 'white', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: '#667781', fontWeight: 500 }}>{m.label}</div>
              <i className={`ti ${m.icon}`} style={{ color: m.color, fontSize: 20 }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 10, color: '#111b21' }}>{m.val}</div>
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
      <div className="card" style={{ padding: 24, textAlign: 'center', maxWidth: 500, margin: '40px auto', background: 'white', borderRadius: 12 }}>
        <i className="ti ti-circle-check" style={{ fontSize: 40, color: '#008069', marginBottom: 12 }} />
        <h4>Randevu Başarıyla Taleplere Eklendi</h4>
        <p className="text-sm text-muted mb-3">Oluşturulan randevu bekleme durumunda (Pending) sisteme işlenmiştir.</p>
        <button className="btn-primary btn" style={{ background: '#008069', border: 'none', padding: '8px 16px', borderRadius: 20 }} onClick={() => setBooked(false)}>Yeni Randevu Yaz</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, width: '100%' }}>
      <div className="card" style={{ padding: 20, marginBottom: 16, background: 'white', borderRadius: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Hasta Bilgileri</div>
        <input className="text-input w-full mb-3" style={{ height: 40, borderRadius: 8 }} placeholder="Hasta E-posta Adresi" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} />
        <textarea className="text-input w-full" style={{ height: 80, borderRadius: 8, resize: 'none' }} placeholder="Şikayet / Belirtiler" value={symptomDescription} onChange={e => setSymptomDescription(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 20, background: 'white', borderRadius: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Branş & Doktor Seçimi</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <select className="select-input" style={{ height: 40, borderRadius: 8 }} value={branch} onChange={e => setBranch(e.target.value)}>
            <option value="">Branş Seçiniz</option>
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </select>
          <select className="select-input" style={{ height: 40, borderRadius: 8 }} value={doctor} onChange={e => setDoctor(e.target.value)}>
            <option value="">Doktor Seçiniz</option>
            {availableDoctors.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <input type="date" className="text-input" style={{ height: 40, borderRadius: 8 }} value={date} onChange={e => setDate(e.target.value)} />
          <select className="select-input" style={{ height: 40, borderRadius: 8 }} value={slot} onChange={e => setSlot(e.target.value)}>
            <option value="">Saat Seçiniz</option>
            {SLOTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {errorMessage && <div className="alert alert-error mb-2">{errorMessage}</div>}
        <button className="btn-primary btn w-full" style={{ height: 42, background: '#008069', border: 'none', borderRadius: 21 }} disabled={!canBook} onClick={handleBook}>Randevuyu Sisteme İşle</button>
      </div>
    </div>
  )
}

/* ── 3. APPOINTMENT MANAGEMENT SUB-VIEW ────────────────── */
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

  useEffect(() => { loadRealTimeAppointments() }, [])

  const handleApprove = async (numericId) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${numericId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' })
      })
      if (!response.ok) throw new Error('Onaylama işlemi başarısız.')
      setMessage(`Randevu #${numericId} başarıyla onaylandı (Confirmed) ve bildirim mailleri gönderildi.`)
      loadRealTimeAppointments()
    } catch (err) { setError(err.message) }
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
    } catch (err) { setError(err.message) }
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
      <div className="text-sm text-muted mb-4">Gerçek zamanlı randevuları yönetin, onaylayın veya iptal edin.</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input className="text-input" style={{ flex: 1, minWidth: 250, height: 40, borderRadius: 8 }} placeholder="Hasta adı, doktor veya ID aratın..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 140, height: 40, borderRadius: 8 }}>
          <option value="">Tüm Durumlar</option>
          <option value="confirmed">Confirmed (Onaylı)</option>
          <option value="pending">Pending (Beklemede)</option>
          <option value="cancellation requested">İptal İstendi</option>
          <option value="cancelled">Cancelled (İptal Edildi)</option>
        </select>
      </div>

      {message && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{message}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ background: 'white', borderRadius: 12, padding: 8, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              {['Randevu ID', 'Hasta Adı', 'Doktor', 'Tarih', 'Saat', 'Tip', 'Durum', 'Aksiyonlar'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#667781', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#667781' }}>{a.formattedId}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{a.patient}</td>
                <td style={{ padding: '12px 14px' }}>{a.doctor}</td>
                <td style={{ padding: '12px 14px' }}>{a.date}</td>
                <td style={{ padding: '12px 14px' }}>{a.time}</td>
                <td style={{ padding: '12px 14px' }}><span className="tag">{a.type}</span></td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={`badge ${a.statusCls}`}>
                    {a.status === 'Cancellation Requested' ? 'İptal İstendi' : a.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '11px', background: '#008069', border: 'none', color: 'white', borderRadius: 12, cursor: 'pointer' }} onClick={() => handleApprove(a.id)} disabled={a.status !== 'Pending'}>Approve</button>
                    <button type="button" className="btn btn-sm" style={{ padding: '4px 10px', fontSize: '11px', color: 'white', background: '#d9383a', border: 'none', borderRadius: 12, cursor: 'pointer' }} onClick={() => handleReject(a.id)} disabled={a.status !== 'Pending' && a.status !== 'Cancellation Requested'}>Reject / Cancel</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── 4. CHANGE REQUESTS SUB-VIEW ──────────────────────────────── */
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
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadChangeRequests() }, [])

  const handleApproveCancel = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled' })
      })
      if (res.ok) {
        setMessage('Randevu iptal talebi başarıyla onaylandı.')
        loadChangeRequests()
      }
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>İptal & Değişiklik Talepleri</div>
      <div className="text-sm text-muted mb-4">Hastaların gönderdiği aktif randevu iptal başvurularını inceleyin.</div>

      {message && <div className="alert alert-info" style={{ background: '#E1F5EE', color: '#0F6E56', marginBottom: 12 }}>{message}</div>}

      <div className="card" style={{ background: 'white', borderRadius: 12, padding: 8 }}>
        {loading ? (
          <div style={{ padding: 20 }}>Talepler yükleniyor...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 20 }} className="text-muted">Şu an onay bekleyen aktif bir iptal başvurusu bulunmuyor.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                {['Randevu ID', 'Hasta Adı', 'Doktor', 'Mevcut Tarih', 'Durum', 'Aksiyon'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#667781' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace' }}>#APT-{r.id.toString().padStart(4, '0')}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.patient_name}</td>
                  <td style={{ padding: '12px 14px' }}>{r.doctor_name}</td>
                  <td style={{ padding: '12px 14px' }}>{r.date} - {r.time}</td>
                  <td style={{ padding: '12px 14px' }}><span className="badge badge-red" style={{ background: '#fff1f1', color: '#d9383a' }}>İptal İstendi</span></td>
                  <td style={{ padding: '12px 14px' }}>
                    <button type="button" className="btn btn-sm" style={{ padding: '5px 12px', fontSize: '11px', background: '#d9383a', border: 'none', color: 'white', borderRadius: 12, cursor: 'pointer' }} onClick={() => handleApproveCancel(r.id)}>İptali Onayla</button>
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

/* ── MAIN STAFF PANEL KAPSAYICISI (EŞLEŞMELER VE PROFİL DÜZELTİLDİ) ── */
export default function StaffPanel({ defaultView = 'dashboard', user, onUserUpdate }) {
  const [activeView, setActiveView] = useState(defaultView)

  useEffect(() => {
    setActiveView(defaultView)
  }, [defaultView])

  return (
    <div style={{ padding: '14px 24px', width: '100%', boxSizing: 'border-box' }}>
      {activeView === 'dashboard' && <StaffDashboard />}
      {activeView === 'booking'   && <AssistedBooking />}
      {activeView === 'appts'     && <AppointmentManagement />} {/* CRITICAL FIX: appts eşleşmesi kurtarıldı */}
      {activeView === 'changes'   && <ChangeRequests />}
      {activeView === 'profile'   && <PatientProfile user={user} onUserUpdate={onUserUpdate} />} {/* Staff Profil Yetkisi Aktif */}
    </div>
  )
}