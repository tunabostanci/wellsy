import { useState } from 'react'
import Sidebar from './Sidebar.jsx'

/* ── Mock data ───────────────────────────────────────────────────── */
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
  },
  {
    type: 'Reschedule',    typeCls: 'badge-blue',
    patient: 'Ahmet Yıldız', doctor: 'Dr. Ayşe Kaya',
    date: '16 Nisan 09:00', newDate: '18 Nisan 10:00', status: 'Approved', statusCls: 'badge-green',
  },
  {
    type: 'Cancellation',  typeCls: 'badge-red',
    patient: 'Mehmet Arslan', doctor: 'Dr. Zeynep Demir',
    date: '18 Nisan 12:00', newDate: null,   status: 'Cancelled', statusCls: '',
  },
]

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

const DOCTORS = ['Dr. Ayşe Kaya', 'Dr. Mehmet Yılmaz', 'Dr. Zeynep Demir', 'Dr. Selin Aydın']
const BRANCHES = ['Clinical Psychology', 'Psychiatry', 'Neurology', 'Internal Medicine']
const SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']

/* ── Sub-views ───────────────────────────────────────────────────── */
function StaffDashboard() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Staff Panel</div>
      <div className="text-sm text-muted mb-4">Patient operations for today, Saturday 30 May 2026</div>

      {/* Metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { label: "Today's Patient Operations", val: '24', icon: 'ti-users',           color: 'var(--teal)' },
          { label: 'Pending Appointments',        val: '7',  icon: 'ti-clock',           color: 'var(--amber-text)' },
          { label: 'Change Requests',             val: '4',  icon: 'ti-refresh-alert',   color: 'var(--blue-text)' },
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

      {/* Recent activities */}
      <div className="card">
        <div className="card-header">Recent Activities</div>
        {[
          { icon: 'ti-circle-check', color: 'var(--green-text)', text: 'Appointment created for Ahmet Y. with Dr. Kaya' },
          { icon: 'ti-refresh',      color: 'var(--blue-text)',  text: 'Elif K. appointment rescheduled' },
          { icon: 'ti-circle-check', color: 'var(--green-text)', text: 'Can Ö. appointment cancelled' },
          { icon: 'ti-circle-check', color: 'var(--green-text)', text: 'Appointment created for Selin A. with Dr. Yılmaz' },
        ].map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
            borderBottom: i < 3 ? '0.5px solid var(--border)' : 'none',
            fontSize: 13,
          }}>
            <i className={`ti ${a.icon}`} style={{ color: a.color, fontSize: 16 }} />
            <span style={{ flex: 1 }}>{a.text}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{['5 min ago', '23 min ago', '1 hour ago', '2 hours ago'][i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssistedBooking() {
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [branch, setBranch] = useState('')
  const [doctor, setDoctor] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [visitType, setVisitType] = useState('')
  const [note, setNote] = useState('')
  const [booked, setBooked] = useState(false)

  const filteredPatients = patientSearch.length > 1
    ? PATIENTS.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.tc.includes(patientSearch))
    : []

  const canBook = selectedPatient && branch && doctor && date && slot && visitType

  if (booked) {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <i className="ti ti-circle-check" style={{ fontSize: 40, color: 'var(--teal)', marginBottom: 12 }} />
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Appointment Created Successfully</div>
          <div className="text-sm text-muted mb-4">The appointment details have been sent to the patient.</div>
          <div style={{
            background: 'var(--bg-surface)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', textAlign: 'left', marginBottom: 16, fontSize: 13,
          }}>
            <div><strong>Patient:</strong> {selectedPatient?.name}</div>
            <div><strong>Doctor:</strong> {doctor}</div>
            <div><strong>Date:</strong> {date} {slot}</div>
            <div><strong>Type:</strong> {visitType}</div>
          </div>
          <button className="btn-primary btn btn-sm" onClick={() => {
            setBooked(false); setSelectedPatient(null); setPatientSearch('')
            setBranch(''); setDoctor(''); setDate(''); setSlot(''); setVisitType(''); setNote('')
          }}>
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
        {/* Patient search */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">Patient Search</div>
          <div style={{ padding: 14 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="text-input"
                style={{ width: '100%', borderRadius: 'var(--r-md)', padding: '8px 12px', border: '1px solid var(--border-md)', fontSize: 13 }}
                placeholder="Search by TC ID or name..."
                value={patientSearch}
                onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null) }}
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
                      onClick={() => { setSelectedPatient(p); setPatientSearch(p.name) }}
                    >
                      <strong>{p.name}</strong>
                      <span style={{ color: 'var(--text-3)', marginLeft: 10 }}>{p.tc} · {p.phone}</span>
                    </div>
                  ))}
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

        {/* Appointment details */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">Appointment Details</div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Branch</label>
                <select className="select-input" style={{ width: '100%' }} value={branch} onChange={e => setBranch(e.target.value)}>
                  <option value="">Select branch</option>
                  {BRANCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Doctor</label>
                <select className="select-input" style={{ width: '100%' }} value={doctor} onChange={e => setDoctor(e.target.value)}>
                  <option value="">Select doctor</option>
                  {DOCTORS.map(d => <option key={d}>{d}</option>)}
                </select>
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

            <button
              className="btn-primary btn"
              disabled={!canBook}
              onClick={() => canBook && setBooked(true)}
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

  const filtered = APPOINTMENTS.filter(a =>
    a.patient.toLowerCase().includes(search.toLowerCase()) ||
    a.doctor.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Appointment Management</div>
      <div className="text-sm text-muted mb-4">Search, filter, and update appointment records</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input
          className="text-input"
          style={{ flex: 1, borderRadius: 'var(--r-md)', padding: '7px 12px', border: '1px solid var(--border-md)', fontSize: 13 }}
          placeholder="Search by patient, doctor or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="select-input"><option>All statuses</option><option>Confirmed</option><option>Pending</option><option>Cancelled</option></select>
        <input type="date" className="select-input" />
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '3px 7px' }}><i className="ti ti-edit" /> Edit</button>
                    <button className="btn btn-sm" style={{ fontSize: 11, padding: '3px 7px', color: 'var(--red-text)' }}><i className="ti ti-x" /> Cancel</button>
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

function ChangeRequests() {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Change Requests</div>
      <div className="text-sm text-muted mb-4">Process cancellation and rescheduling requests</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHANGE_REQUESTS.map((req, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${req.typeCls}`} style={{ fontSize: 11 }}>{req.type}</span>
                <span className={`badge ${req.statusCls}`} style={{ fontSize: 11 }}>{req.status}</span>
              </div>
              {req.status === 'Pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary btn btn-sm" style={{ fontSize: 11 }}>
                    <i className="ti ti-check" /> Approve
                  </button>
                  <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--red-text)' }}>
                    <i className="ti ti-x" /> Reject
                  </button>
                  {req.type === 'Reschedule' && (
                    <button className="btn btn-sm" style={{ fontSize: 11, color: 'var(--teal)' }}>
                      <i className="ti ti-clock" /> Set New Time
                    </button>
                  )}
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

export default function StaffPanel() {
  const [activeView, setActiveView] = useState('dashboard')

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
