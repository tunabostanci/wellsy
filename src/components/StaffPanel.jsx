import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/* ── Mock data ───────────────────────────────────────────────────── */
const APPOINTMENTS = [
  { id: '#APT-2026-8412', patient: 'Elif K.', doctor: 'Dr. Ayşe Kaya',     date: '13 May 2026', time: '14:00', type: 'Online',     status: 'Confirmed', statusCls: 'badge-green' },
  { id: '#APT-2026-8398', patient: 'Can Ö.',  doctor: 'Dr. Mehmet Yılmaz', date: '20 May 2026', time: '10:30', type: 'In-person',  status: 'Pending',   statusCls: 'badge-amber' },
  { id: '#APT-2026-8380', patient: 'Selin A.',doctor: 'Dr. Zeynep Demir',  date: '22 May 2026', time: '09:00', type: 'Online',     status: 'Confirmed', statusCls: 'badge-green' },
  { id: '#APT-2026-8370', patient: 'Murat D.',doctor: 'Dr. Ayşe Kaya',     date: '25 May 2026', time: '11:00', type: 'In-person',  status: 'Pending',   statusCls: 'badge-amber' },
]

const PATIENTS = [
  { name: 'Elif Korkmaz',   tc: '12345678901', email: 'elif@email.com',   phone: '0533 111 22 33' },
  { name: 'Can Özkan',      tc: '23456789012', email: 'can@email.com',    phone: '0532 222 33 44' },
  { name: 'Selin Aydın',    tc: '34567890123', email: 'selin@email.com',  phone: '0534 333 44 55' },
  { name: 'Murat Demir',    tc: '45678901234', email: 'murat@email.com',  phone: '0535 444 55 66' },
]

const DOCTORS = [
  { name: 'Dr. Ayşe Kaya', branch: 'Clinical Psychologist' },
  { name: 'Dr. Mehmet Yılmaz', branch: 'Psychiatrist' },
  { name: 'Dr. Zeynep Demir', branch: 'Clinical Psychologist' },
  { name: 'Dr. Selin Aydın', branch: 'Neurology' },
]
const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

function calculateUrgency(description) {
  const text = (description || '').toLowerCase()
  if (!text.trim()) {
    return { label: 'Belirlenmedi', badge: 'badge-amber' }
  }

  const urgentWords = ['şiddetli', 'acı', 'şok', 'nefes', 'kanama', 'bayıl', 'kalp', 'angina', 'göğüs', 'hızlı', 'solunum', 'şuur', 'bilinç', 'göğüs ağrısı']
  const highWords = ['sürekli', 'yüksek ateş', 'ateş', 'şişlik', 'ağrı', 'kusma', 'baş dönmesi', 'baş ağrısı', 'nefes darlığı']
  const moderateWords = ['hafif', 'yavaş', 'uzun süren', 'rahatsızlık', 'halsizlik', 'yorgunluk']

  if (urgentWords.some(word => text.includes(word))) {
    return { label: 'Acil', badge: 'badge-red' }
  }

  if (highWords.some(word => text.includes(word))) {
    return { label: 'Yüksek', badge: 'badge-amber' }
  }

  if (moderateWords.some(word => text.includes(word))) {
    return { label: 'Orta', badge: 'badge-blue' }
  }

  return { label: 'Düşük', badge: 'badge-green' }
}

/* ── Sub-views ───────────────────────────────────────────────────── */
function StaffDashboard() {
  const [appointments, setAppointments] = useState([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          fetch(`${API_URL}/api/appointments`),
          fetch(`${API_URL}/api/change-requests`),
        ])
        const appts = aRes.ok ? await aRes.json() : []
        const reqs = cRes.ok ? await cRes.json() : []
        setAppointments(appts)
        setPendingRequests(reqs.filter(r => r.status === 'Pending').length)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pending = appointments.filter(a => a.status === 'Pending').length
  const metrics = [
    { label: 'Toplam Randevu',    val: appointments.length, icon: 'ti-users',         color: 'var(--teal)' },
    { label: 'Bekleyen Randevu',  val: pending,             icon: 'ti-clock',         color: 'var(--amber-text)' },
    { label: 'Bekleyen Talepler', val: pendingRequests,     icon: 'ti-refresh-alert', color: 'var(--blue-text)' },
  ]
  const recent = appointments.slice(0, 5)
  const badgeFor = (s) => s === 'Confirmed' ? 'badge-green' : s === 'Cancelled' ? 'badge-red' : 'badge-amber'

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Staff Panel</div>
      <div className="text-sm text-muted mb-4">Klinik randevu operasyonları özeti</div>

      {/* Metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="metric-label">{m.label}</div>
              <i className={`ti ${m.icon}`} style={{ color: m.color, fontSize: 18 }} />
            </div>
            <div className="metric-val">{loading ? '…' : m.val}</div>
          </div>
        ))}
      </div>

      {/* Recent appointments */}
      <div className="card">
        <div className="card-header">Son Randevular</div>
        {loading ? (
          <div style={{ padding: '10px 16px', fontSize: 13 }}>Yükleniyor...</div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '10px 16px', fontSize: 13 }} className="text-muted">Henüz randevu kaydı yok.</div>
        ) : recent.map((a, i) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
            borderBottom: i < recent.length - 1 ? '0.5px solid var(--border)' : 'none',
            fontSize: 13,
          }}>
            <i className="ti ti-calendar-event" style={{ color: 'var(--teal)', fontSize: 16 }} />
            <span style={{ flex: 1 }}><strong>{a.patient}</strong> → {a.doctor}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.date} {a.time}</span>
            <span className={`badge ${badgeFor(a.status)}`} style={{ fontSize: 11 }}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
  const [visitType, setVisitType] = useState('')
  const [note, setNote] = useState('')
  const [booked, setBooked] = useState(false)
  const [bookingInfo, setBookingInfo] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docRes, patRes] = await Promise.all([
          fetch(`${API_URL}/api/doctors`),
          fetch(`${API_URL}/api/patients`),
        ])

        if (!docRes.ok || !patRes.ok) {
          throw new Error('Unable to load doctors or patients from the backend.')
        }

        setDoctors(await docRes.json())
        setPatients(await patRes.json())
      } catch (err) {
        console.error(err)
        setErrorMessage('Unable to load doctors or patients. Please refresh or try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const patientOptions = patients.length > 0 ? patients : PATIENTS
  const filteredPatients = patientSearch.length > 1
    ? patientOptions.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.tc?.includes(patientSearch))
    : []

  const doctorOptions = doctors.length > 0
    ? doctors.map(d => ({ name: d.name, branch: d.specialty || 'General' }))
    : DOCTORS

  const availableDoctors = doctorOptions.filter(d => !branch || d.branch === branch)
  const branchOptions = [...new Set(doctorOptions.map(d => d.branch).filter(Boolean))].sort()
  const activePatient = selectedPatient || (filteredPatients.length === 1 ? filteredPatients[0] : null)
  const activePatientName = activePatient ? activePatient.name : patientSearch
  const activePatientEmail = activePatient ? activePatient.email : patientEmail
  const activePatientPhone = activePatient ? activePatient.phone : patientPhone
  const activePatientTc = activePatient ? activePatient.tc : patientTc
  const urgency = calculateUrgency(symptomDescription)
  const canBook = activePatientName && activePatientEmail && branch && doctor && date && slot && visitType && symptomDescription.trim()

  const resetForm = () => {
    setBooked(false)
    setBookingInfo(null)
    setSelectedPatient(null)
    setPatientSearch('')
    setPatientEmail('')
    setPatientPhone('')
    setPatientTc('')
    setBranch('')
    setDoctor('')
    setDate('')
    setSlot('')
    setVisitType('')
    setNote('')
    setErrorMessage('')
  }

  const handleBook = async () => {
    if (!canBook) {
      setErrorMessage('Please select a patient and complete all required fields.')
      return
    }

    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: activePatientName,
          patient_tc: activePatientTc || '',
          patient_email: activePatientEmail,
          patient_phone: activePatientPhone || '',
          doctor_name: doctor,
          appointment_date: date,
          appointment_time: slot,
          type: visitType,
          note: symptomDescription.trim() ? `${symptomDescription.trim()}${note ? ' — ' + note.trim() : ''}` : note,
        }),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error || 'Unable to create appointment')
      }

      setBookingInfo(body)
      setBooked(true)
      setSelectedPatient(null)
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message || 'Unable to create appointment.')
    }
  }

  if (loading) {
    return <div className="card" style={{ padding: 24 }}>Loading clinic resources...</div>
  }

  if (booked && bookingInfo) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 40, color: 'var(--teal)', marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Appointment Created Successfully</div>
          <div className="text-sm text-muted mb-4">The appointment has been saved to the clinic system.</div>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', textAlign: 'left', marginBottom: 16, fontSize: 13,
          }}>
            <div><strong>Appointment ID:</strong> {bookingInfo.id}</div>
            <div><strong>Patient:</strong> {bookingInfo.patient}</div>
            <div><strong>Doctor:</strong> {bookingInfo.doctor}</div>
            <div><strong>Date:</strong> {bookingInfo.date} {bookingInfo.time}</div>
            <div><strong>Type:</strong> {bookingInfo.type}</div>
            <div><strong>Status:</strong> {bookingInfo.status}</div>
          </div>
          <button className="btn-primary btn btn-sm" onClick={resetForm}>
            Create New Appointment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Create Appointment for Patient</div>
      <div className="text-sm text-muted mb-4">Create a new appointment on behalf of the patient</div>

      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">Patient Information</div>
          <div style={{ padding: 14, display: 'grid', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="text-input"
                style={{ width: '100%', borderRadius: 'var(--r-md)', padding: '8px 12px', border: '1px solid var(--border-md)', fontSize: 13 }}
                placeholder="Search existing patient by TC or name..."
                value={patientSearch}
                onChange={e => {
                  const value = e.target.value
                  setPatientSearch(value)
                  setSelectedPatient(null)
                  const exactMatch = patientOptions.find(p => p.name.toLowerCase() === value.toLowerCase() || p.tc === value)
                  if (exactMatch) {
                    setSelectedPatient(exactMatch)
                    setPatientEmail(exactMatch.email || '')
                    setPatientPhone(exactMatch.phone || '')
                    setPatientTc(exactMatch.tc || '')
                  }
                }}
              />
              {filteredPatients.length > 0 && !selectedPatient && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: '#fff', border: '1px solid var(--border-md)',
                  borderRadius: 'var(--r-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  marginTop: 4,
                }}>
                  {filteredPatients.map((p, i) => (
                    <div
                      key={i}
                      style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, borderBottom: i < filteredPatients.length - 1 ? '0.5px solid var(--border)' : 'none' }}
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientSearch(p.name)
                        setPatientEmail(p.email || '')
                        setPatientPhone(p.phone || '')
                        setPatientTc(p.tc || '')
                      }}
                    >
                      <strong>{p.name}</strong>
                      <span style={{ color: 'var(--text-3)', marginLeft: 10 }}>{p.tc || p.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Patient Name</label>
                <input
                  className="text-input"
                  style={{ width: '100%' }}
                  value={activePatientName}
                  onChange={e => {
                    setPatientSearch(e.target.value)
                    setSelectedPatient(null)
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>TC / National ID</label>
                <input
                  className="text-input"
                  style={{ width: '100%' }}
                  value={activePatientTc || ''}
                  onChange={e => {
                    setPatientTc(e.target.value)
                    setSelectedPatient(null)
                  }}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  className="text-input"
                  style={{ width: '100%' }}
                  value={activePatientEmail || ''}
                  onChange={e => {
                    setPatientEmail(e.target.value)
                    setSelectedPatient(null)
                  }}
                  placeholder="Required"
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Phone</label>
                <input
                  className="text-input"
                  style={{ width: '100%' }}
                  value={activePatientPhone || ''}
                  onChange={e => {
                    setPatientPhone(e.target.value)
                    setSelectedPatient(null)
                  }}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Hastalık / Şikayet Açıklaması</label>
              <textarea
                className="text-input"
                style={{ width: '100%', minHeight: 96, resize: 'vertical' }}
                placeholder="Hasta durumu ne kadar acil? Örneğin: şiddetli baş ağrısı, nefes darlığı, ateş..."
                value={symptomDescription}
                onChange={e => setSymptomDescription(e.target.value)}
              />
              {symptomDescription.trim() && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Triage seviyesi:</span>
                  <span className={`badge ${urgency.badge}`}>{urgency.label}</span>
                </div>
              )}
            </div>

            {selectedPatient && (
              <div style={{
                marginTop: 10, padding: '10px 12px', background: 'var(--teal-light)',
                borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--teal-dark)',
              }}>
                <i className="ti ti-user-check" style={{ marginRight: 8 }} />
                <strong>{selectedPatient.name}</strong> · {selectedPatient.email} · {selectedPatient.phone}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">Appointment Details</div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Branch</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={branch}
                  onChange={e => {
                    setBranch(e.target.value)
                    if (doctor) {
                      const valid = doctorOptions.some(d => d.name === doctor && d.branch === e.target.value)
                      if (!valid) setDoctor('')
                    }
                  }}
                >
                  <option value="">Select branch</option>
                  {branchOptions.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Doctor</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={doctor}
                  onChange={e => setDoctor(e.target.value)}
                  disabled={!branch}
                >
                  <option value="">{branch ? 'Select doctor' : 'Choose branch first'}</option>
                  {availableDoctors.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                {branch && availableDoctors.length === 0 && (
                  <div className="text-sm text-muted" style={{ marginTop: 6 }}>No providers available for this branch yet.</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Date</label>
                <input type="date" className="select-input" style={{ width: '100%' }} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Time Slot</label>
                <select className="select-input" style={{ width: '100%' }} value={slot} onChange={e => setSlot(e.target.value)}>
                  <option value="">Select slot</option>
                  {SLOTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Visit Type</label>
              <select className="select-input" style={{ width: '100%' }} value={visitType} onChange={e => setVisitType(e.target.value)}>
                <option value="">Select type</option>
                <option>Online</option>
                <option>In-person</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Note (optional)</label>
              <textarea
                style={{ width: '100%', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: '8px 12px', fontSize: 13, minHeight: 72, resize: 'vertical', fontFamily: 'var(--font)' }}
                placeholder="Add a note for the appointment..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div style={{ color: 'var(--red-text)', fontSize: 13, marginBottom: 10 }}>{errorMessage}</div>
            )}
            <button
              type="button"
              className="btn-primary btn"
              disabled={!canBook}
              onClick={handleBook}
              style={{ opacity: canBook ? 1 : 0.5 }}
            >
              <i className="ti ti-calendar-plus" /> Create Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppointmentManagement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [appointments, setAppointments] = useState(APPOINTMENTS)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/appointments`)
        if (!response.ok) {
          throw new Error('Unable to load appointments.')
        }
        const rows = await response.json()
        setAppointments(rows.map(a => ({
          id: `#APT-${a.id.toString().padStart(4, '0')}`,
          dbId: a.id,
          patient: a.patient,
          doctor: a.doctor,
          date: a.date,
          time: a.time,
          type: a.type,
          status: a.status,
          statusCls: a.status.toLowerCase() === 'confirmed' ? 'badge-green' : a.status.toLowerCase() === 'cancelled' ? 'badge-red' : 'badge-amber',
        })))
      } catch (err) {
        console.error(err)
        setError('Unable to load appointments. Showing local history only.')
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [])

  const filtered = appointments.filter(a => {
    const matchesSearch = a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || a.status.toLowerCase() === statusFilter
    const matchesDate = !dateFilter || a.date === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const statusClass = (status) =>
    status === 'Confirmed' ? 'badge-green' : status === 'Cancelled' ? 'badge-red' : 'badge-amber'

  const updateStatus = async (appt, newStatus) => {
    // Backend erişilemediğinde (yerel mock veri) sadece arayüzü güncelle
    if (!appt.dbId) {
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: newStatus, statusCls: statusClass(newStatus) } : a))
      setMessage(newStatus === 'Confirmed' ? 'Appointment approved (yerel — kaydedilmedi).' : 'Appointment rejected (yerel — kaydedilmedi).')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/appointments/${appt.dbId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Durum güncellenemedi.')

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: body.status, statusCls: statusClass(body.status) } : a))
      setMessage(newStatus === 'Confirmed' ? 'Appointment approved.' : 'Appointment rejected.')
    } catch (err) {
      console.error(err)
      setMessage(err.message || 'Durum güncellenemedi.')
    }
  }

  const handleApprove = (appt) => updateStatus(appt, 'Confirmed')
  const handleReject = (appt) => updateStatus(appt, 'Cancelled')

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Appointment Management</div>
      <div className="text-sm text-muted mb-4">Search, filter, and update appointment records</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="text-input"
          style={{ flex: 1, minWidth: 250, borderRadius: 'var(--r-md)', padding: '7px 12px', border: '1px solid var(--border-md)', fontSize: 13 }}
          placeholder="Search by patient, doctor or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="select-input"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="select-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} title="Tarihe göre filtrele" />
        {dateFilter && (
          <button type="button" className="btn btn-sm" onClick={() => setDateFilter('')} title="Tarih filtresini temizle">
            <i className="ti ti-x" />
          </button>
        )}
      </div>

      {message && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', color: 'var(--text-2)' }}>
          {message}
        </div>
      )}
      <div className="card">
        <div className="table-scroll">
        <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Appt. ID', 'Patient', 'Doctor', 'Date', 'Type', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-3)' }}>{a.id}</td>
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{a.patient}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-2)' }}>{a.doctor}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-2)' }}>{a.date} {a.time}</td>
                <td style={{ padding: '9px 14px' }}><span className="tag">{a.type}</span></td>
                <td style={{ padding: '9px 14px' }}><span className={`badge ${a.statusCls}`} style={{ fontSize: 11 }}>{a.status}</span></td>
                <td style={{ padding: '9px 14px' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ fontSize: 11, padding: '3px 7px' }}
                      onClick={() => handleApprove(a)}
                      disabled={a.status !== 'Pending'}
                    >
                      <i className="ti ti-check" /> Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ fontSize: 11, padding: '3px 7px', color: 'var(--red-text)' }}
                      onClick={() => handleReject(a)}
                      disabled={a.status !== 'Pending'}
                    >
                      <i className="ti ti-x" /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

function ChangeRequests() {
  const [requests, setRequests] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const typeCls = (type) => type === 'Cancellation' ? 'badge-red' : 'badge-blue'
  const statusCls = (status) => status === 'Approved' ? 'badge-green' : status === 'Rejected' ? 'badge-red' : 'badge-amber'

  const mapRow = (r) => ({
    id: r.id,
    type: r.type,
    typeCls: typeCls(r.type),
    patient: r.patient,
    doctor: r.doctor,
    date: `${r.current_date} ${r.current_time}`,
    newDate: r.type === 'Reschedule' && r.requested_date ? `${r.requested_date} ${r.requested_time}` : null,
    status: r.status,
    statusCls: statusCls(r.status),
  })

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`${API_URL}/api/change-requests`)
      if (!response.ok) throw new Error('Talepler yüklenemedi.')
      const rows = await response.json()
      setRequests(rows.map(mapRow))
    } catch (err) {
      console.error(err)
      setError('Değişiklik talepleri yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  const updateRequest = async (id, status) => {
    setStatusMessage('')
    try {
      const response = await fetch(`${API_URL}/api/change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Talep güncellenemedi.')

      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: body.status, statusCls: statusCls(body.status) } : req))
      setStatusMessage(status === 'Approved' ? 'Talep onaylandı ve randevuya uygulandı.' : 'Talep reddedildi.')
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Change Requests</div>
      <div className="text-sm text-muted mb-4">Process cancellation and rescheduling requests</div>

      {statusMessage && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', color: 'var(--text-2)' }}>
          {statusMessage}
        </div>
      )}

      {loading && <div className="alert alert-info">Talepler yükleniyor...</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && !error && requests.length === 0 && (
        <div className="alert alert-warning">Şu anda bekleyen veya işlenmiş bir değişiklik talebi yok.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {requests.map((req) => (
          <div key={req.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${req.typeCls}`} style={{ fontSize: 11 }}>{req.type}</span>
                <span className={`badge ${req.statusCls}`} style={{ fontSize: 11 }}>{req.status}</span>
              </div>
              {req.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary btn btn-sm" style={{ fontSize: 11 }} onClick={() => updateRequest(req.id, 'Approved')}>
                    <i className="ti ti-check" /> Approve
                  </button>
                  <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--red-text)' }} onClick={() => updateRequest(req.id, 'Rejected')}>
                    <i className="ti ti-x" /> Reject
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Patient</div>
                <div style={{ fontWeight: 500 }}>{req.patient}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Doctor</div>
                <div>{req.doctor}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Current Date</div>
                <div>{req.date}</div>
              </div>
              {req.newDate && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>New Date</div>
                  <div style={{ color: 'var(--teal-dark)', fontWeight: 500 }}>{req.newDate}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────── */
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
        user={{ initials: 'AA', name: 'Ayşe A.', role: 'Clinic Staff' }}
      />
      <div className="main-area">
        {activeView === 'dashboard' && <StaffDashboard />}
        {activeView === 'booking'   && <AssistedBooking />}
        {activeView === 'appts'     && <AppointmentManagement />}
        {activeView === 'changes'   && <ChangeRequests />}
      </div>
    </div>
  )
}
