import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

export default function AppointmentTracking({ patient, onNewAppointment = () => {}, onChatbot = () => {}, onChooseDoctor = () => {}, onProfile = () => {} }) {
  const [tab, setTab] = useState('upcoming')
  const [upcoming, setUpcoming] = useState([])
  const [past, setPast] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    if (!patient?.id) return

    const loadAppointments = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_URL}/api/patients/${patient.id}/appointments`)
        if (!response.ok) {
          throw new Error('Unable to load appointments')
        }
        const appointments = await response.json()

        // Split into upcoming and past based on date
        const now = new Date()
        const upcomingList = appointments.filter(a => new Date(a.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date))
        const pastList = appointments.filter(a => new Date(a.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date))

        setUpcoming(upcomingList)
        setPast(pastList)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Unable to load appointments')
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [patient?.id, API_URL])

  const list = tab === 'upcoming' ? upcoming : past

  const handleReschedule = (index) => {
    setUpcoming(prev => prev.map((appt, i) => i === index
      ? { ...appt, status: 'Reschedule requested' }
      : appt
    ))
    setStatusMessage('Reschedule request submitted.')
  }

  const handleCancel = (index) => {
    setUpcoming(prev => {
      const cancelled = { ...prev[index], status: 'Cancelled' }
      setPast(old => [cancelled, ...old])
      return prev.filter((_, i) => i !== index)
    })
    setStatusMessage('Appointment cancelled.')
  }

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={[
          { icon: 'ti-message-chatbot', label: 'Chatbot', onClick: onChatbot },
          { icon: 'ti-stethoscope',     label: 'Choose doctor', onClick: onChooseDoctor },
          { icon: 'ti-calendar',        label: 'Appointments', active: true },
          { icon: 'ti-user',            label: 'Profile', onClick: onProfile },
        ]}
        user={{ initials: patient?.name?.[0] || 'P', name: patient?.name || 'Patient', role: 'Patient' }}
      />

      <div className="main-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>My Appointments</div>
          <button type="button" className="btn-primary btn btn-sm" onClick={onNewAppointment}>
            <i className="ti ti-plus" /> New Appointment
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
          {[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past',     label: `Past (${past.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: tab === t.key ? '2px solid var(--teal)' : '2px solid transparent',
                background: 'none',
                color: tab === t.key ? 'var(--teal-dark)' : 'var(--text-3)',
                fontWeight: tab === t.key ? 500 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {statusMessage && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--r-md)', color: 'var(--text-2)' }}>
            {statusMessage}
          </div>
        )}

        {/* Appointment cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
              Loading appointments...
            </div>
          ) : list.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
              No {tab} appointments yet.
            </div>
          ) : (
            list.map((appt, i) => (
              <div key={i} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#E1F5EE', color: '#0F6E56',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600, flexShrink: 0,
                  }}>
                    {appt.doctor?.[0] || 'D'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.doctor}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{appt.doctor_specialty}</div>
                      </div>
                      <span className={`badge ${
                        appt.status === 'Confirmed' ? 'badge-green' :
                        appt.status === 'Pending' ? 'badge-amber' :
                        appt.status === 'Cancelled' ? 'badge-red' :
                        'badge-blue'
                      }`} style={{ fontSize: 11, marginLeft: 8 }}>
                        {appt.status}
                      </span>
                    </div>

                    {appt.clinic && (
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                        <span><i className="ti ti-map-pin" style={{ marginRight: 4 }} />{appt.clinic}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                      <span><i className="ti ti-calendar" style={{ marginRight: 4 }} />{appt.date}</span>
                      <span><i className="ti ti-clock" style={{ marginRight: 4 }} />{appt.time}</span>
                      <span><i className={`ti ${appt.type === 'Online' ? 'ti-device-laptop' : 'ti-users'}`} style={{ marginRight: 4 }} />{appt.type}</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace', marginBottom: tab === 'upcoming' ? 12 : 0 }}>
                      #{appt.id}
                    </div>

                    {appt.note && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: tab === 'upcoming' ? 12 : 0 }}>
                        <strong>Note:</strong> {appt.note}
                      </div>
                    )}

                    {/* Actions — upcoming only */}
                    {tab === 'upcoming' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-sm" style={{ fontSize: 12 }} onClick={() => handleReschedule(i)}>
                          <i className="ti ti-refresh" /> Reschedule
                        </button>
                        <button type="button" className="btn btn-sm" style={{ fontSize: 12, color: 'var(--red-text)' }} onClick={() => handleCancel(i)}>
                          <i className="ti ti-x" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
