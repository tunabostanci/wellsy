import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const SLOTS = [
  { t: '09:00', booked: true  },
  { t: '10:00', booked: true  },
  { t: '11:00', booked: false },
  { t: '13:00', booked: true  },
  { t: '14:00', booked: true  },
  { t: '15:00', booked: false },
  { t: '16:00', booked: true  },
  { t: '17:00', booked: false },
  { t: '18:00', booked: false },
]

export default function DoctorDashboard({ doctor }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    if (!doctor?.id) return

    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        // Fetch doctor's patients
        const patientsRes = await fetch(`${API_URL}/api/doctors/${doctor.id}/patients`)
        if (!patientsRes.ok) throw new Error('Unable to load patients')
        const patientsData = await patientsRes.json()
        setPatients(patientsData)

        // Fetch doctor's appointments
        const apptsRes = await fetch(`${API_URL}/api/doctors/${doctor.id}/appointments`)
        if (!apptsRes.ok) throw new Error('Unable to load appointments')
        const apptsData = await apptsRes.json()
        setAppointments(apptsData)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Unable to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [doctor?.id, API_URL])

  const appointmentCount = appointments.length
  const pendingCount = appointments.filter(a => a.status === 'Pending').length
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length
  const nextAppointment = appointments.length > 0 ? appointments[0] : null

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={[
          { icon: 'ti-layout-dashboard', label: 'Dashboard',   active: activeSection === 'dashboard', onClick: () => setActiveSection('dashboard') },
          { icon: 'ti-clock',            label: 'Availability', active: activeSection === 'availability', onClick: () => setActiveSection('availability') },
          { icon: 'ti-calendar',         label: 'Appointments', active: activeSection === 'appointments', onClick: () => setActiveSection('appointments') },
          { icon: 'ti-notes-medical',    label: 'Patient notes', active: activeSection === 'notes', onClick: () => setActiveSection('notes') },
        ]}
        user={{
          initials: doctor?.initials || 'DR',
          name: doctor?.name || 'Doctor',
          role: doctor?.specialty || 'Healthcare Provider',
        }}
      />

      <div className="main-area">
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              Good morning, Dr. {doctor?.name?.split(' ').pop()}
            </div>
            <div className="text-sm text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <button className="btn-primary btn btn-sm">
            <i className="ti ti-plus" aria-hidden="true" /> Add slot
          </button>
        </div>

        {/* Metrics */}
        <div className="metrics-grid">
          {[
            { label: "Today's appointments", val: appointmentCount.toString(), sub: `${confirmedCount} confirmed`, subClass: 'up' },
            { label: 'Pending confirmation', val: pendingCount.toString(), sub: pendingCount === 0 ? 'All set' : 'Require action', subClass: '' },
            { label: 'Total patients', val: patients.length.toString(), sub: 'In your care', subClass: '' },
            { label: 'AI match rate', val: '94%', sub: 'Specialty accuracy', subClass: 'up' },
          ].map((m, i) => (
            <div key={i} className="metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-val">{m.val}</div>
              <div className={`metric-sub ${m.subClass}`}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Main two-col */}
        <div className="dash-two-col">
          {/* Schedule */}
          <div className="card">
            <div className="card-header">
              Your appointments
              {appointments.length > 5 && <span className="card-header-action">View all</span>}
            </div>
            {loading ? (
              <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>No appointments scheduled.</div>
            ) : (
              appointments.slice(0, 5).map((a, i) => (
                <div key={i} className="appt-row">
                  <span className="text-xs" style={{ color: 'var(--text-3)', minWidth: 38 }}>
                    {a.time}
                  </span>
                  <div className={`appt-dot ${a.status === 'Confirmed' ? 'teal' : a.status === 'Pending' ? 'amber' : 'gray'}`} />
                  <span className="flex-1 font-medium" style={{ fontSize: 13 }}>{a.patient}</span>
                  <span className="tag">{a.type}</span>
                  <span className={`badge ${a.status === 'Confirmed' ? 'badge-green' : a.status === 'Pending' ? 'badge-amber' : 'badge-blue'}`}>
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Right col */}
          <div className="flex-col gap-3">
            {/* Availability */}
            <div className="card">
              <div className="card-header" style={{ fontSize: 13 }}>
                Slots – today
              </div>
              <div className="slot-grid">
                {SLOTS.map((s, i) => (
                  <div key={i} className={`slot${s.booked ? ' booked' : ''}`}>{s.t}</div>
                ))}
              </div>
            </div>

            {/* Patient preview */}
            {nextAppointment && (
              <div className="card">
                <div className="card-header" style={{ fontSize: 13 }}>
                  Next: {nextAppointment.patient}
                  <span className="card-header-action">{nextAppointment.time}</span>
                </div>
                <div className="p-3">
                  <div className="section-label">Appointment Details</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                    <div><strong>Patient:</strong> {nextAppointment.patient}</div>
                    <div><strong>Type:</strong> {nextAppointment.type}</div>
                    <div><strong>Date:</strong> {nextAppointment.date}</div>
                    <div><strong>Time:</strong> {nextAppointment.time}</div>
                    {nextAppointment.note && (
                      <div style={{
                        marginTop: 10,
                        padding: '8px 10px',
                        background: 'var(--teal-light)',
                        borderRadius: 'var(--r-md)',
                        color: 'var(--teal-dark)',
                      }}>
                        <strong>Note:</strong> {nextAppointment.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patients list */}
            <div className="card">
              <div className="card-header" style={{ fontSize: 13 }}>
                Your patients ({patients.length})
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>Loading...</div>
                ) : patients.length === 0 ? (
                  <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13 }}>No patients yet.</div>
                ) : (
                  patients.slice(0, 10).map((p, i) => (
                    <div key={i} style={{
                      padding: '10px 12px',
                      borderBottom: i < Math.min(patients.length, 10) - 1 ? '0.5px solid var(--border)' : 'none',
                      fontSize: 13,
                    }}>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.email}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}