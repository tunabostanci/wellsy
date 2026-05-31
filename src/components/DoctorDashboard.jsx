import Sidebar from './Sidebar.jsx'

const APPOINTMENTS = [
  { time: '09:00', name: 'Ahmet T.',  type: 'Online',    dot: 'teal',  status: 'Confirmed', statusClass: 'badge-green' },
  { time: '10:30', name: 'Elif K.',   type: 'In-person', dot: 'amber', status: 'Pending',   statusClass: 'badge-amber' },
  { time: '13:00', name: 'Mehmet A.', type: 'Online',    dot: 'teal',  status: 'Confirmed', statusClass: 'badge-green' },
  { time: '14:00', name: 'Tuna B.',   type: 'Online',    dot: 'teal',  status: 'New',       statusClass: 'badge-blue'  },
  { time: '16:00', name: 'Zeynep D.', type: 'In-person', dot: 'gray',  status: 'Pending',   statusClass: 'badge-amber' },
]

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

const SYMPTOMS = ['Anxiety – 3 wks', 'Insomnia', 'Racing heartbeat', 'Poor focus']

export default function DoctorDashboard() {
  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={[
          { icon: 'ti-layout-dashboard', label: 'Dashboard',   active: true },
          { icon: 'ti-clock',            label: 'Availability' },
          { icon: 'ti-calendar',         label: 'Appointments' },
          { icon: 'ti-notes-medical',    label: 'Patient notes'},
        ]}
        user={{ initials: 'AK', name: 'Dr. Ayşe Kaya', role: 'Psychologist' }}
      />

      <div className="main-area">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Good morning, Dr. Kaya</div>
            <div className="text-sm text-muted">Saturday, 30 May 2026</div>
          </div>
          <button className="btn-primary btn btn-sm">
            <i className="ti ti-plus" aria-hidden="true" /> Add slot
          </button>
        </div>

        {/* Metrics */}
        <div className="metrics-grid">
          {[
            { label: "Today's appointments", val: '8',  sub: '↑ 2 from yesterday', subClass: 'up' },
            { label: 'Pending confirmation',  val: '3',  sub: 'Require action',      subClass: ''   },
            { label: 'Reschedule requests',   val: '2',  sub: '+1 from last week',   subClass: 'down'},
            { label: 'AI match rate',         val: '94%', sub: 'Specialty accuracy',  subClass: 'up' },
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
              Today's schedule
              <span className="card-header-action">View all</span>
            </div>
            {APPOINTMENTS.map((a, i) => (
              <div key={i} className="appt-row">
                <span className="text-xs" style={{ color: 'var(--text-3)', minWidth: 38 }}>{a.time}</span>
                <div className={`appt-dot ${a.dot}`} />
                <span className="flex-1 font-medium" style={{ fontSize: 13 }}>{a.name}</span>
                <span className="tag">{a.type}</span>
                <span className={`badge ${a.statusClass}`}>{a.status}</span>
              </div>
            ))}
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
            <div className="card">
              <div className="card-header" style={{ fontSize: 13 }}>
                Next: Tuna B.
                <span className="card-header-action">14:00</span>
              </div>
              <div className="p-3">
                <div className="section-label">Reported symptoms</div>
                <div className="flex flex-wrap gap-1 mt-1 mb-3">
                  {SYMPTOMS.map(s => (
                    <span key={s} className="badge badge-amber" style={{ fontSize: 11 }}>{s}</span>
                  ))}
                </div>
                <div style={{
                  fontSize: 12,
                  padding: '8px 10px',
                  background: 'var(--teal-light)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--teal-dark)',
                  lineHeight: 1.45,
                }}>
                  AI suggests: <strong>Anxiety disorder / clinical psychology.</strong> CBT approach may be appropriate.
                </div>
                <div className="text-xs mt-2" style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>
                  Pre-consultation summary only — not a medical diagnosis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}