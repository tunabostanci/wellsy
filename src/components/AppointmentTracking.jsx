import { useState } from 'react'
import Sidebar from './Sidebar.jsx'

const UPCOMING = [
  {
    id: '#APT-2026-8412',
    doctor: 'Dr. Ayşe Kaya',
    specialty: 'Clinical Psychologist',
    clinic: 'Psikoloji Kliniği, İstanbul',
    date: '13 May 2026',
    time: '14:00',
    type: 'Online',
    status: 'Confirmed',
    statusCls: 'badge-green',
    initials: 'AK', avatarBg: '#E1F5EE', avatarColor: '#0F6E56',
  },
  {
    id: '#APT-2026-8398',
    doctor: 'Dr. Mehmet Yılmaz',
    specialty: 'Psychiatrist',
    clinic: 'Ruh Sağlığı Merkezi, Ankara',
    date: '20 May 2026',
    time: '10:30',
    type: 'In-person',
    status: 'Pending',
    statusCls: 'badge-amber',
    initials: 'MY', avatarBg: '#E6F1FB', avatarColor: '#185FA5',
  },
]

const PAST = [
  {
    id: '#APT-2026-8320',
    doctor: 'Dr. Ayşe Kaya',
    specialty: 'Clinical Psychologist',
    clinic: 'Psikoloji Kliniği, İstanbul',
    date: '01 Apr 2026',
    time: '14:00',
    type: 'Online',
    status: 'Completed',
    statusCls: 'badge-green',
    initials: 'AK', avatarBg: '#E1F5EE', avatarColor: '#0F6E56',
  },
  {
    id: '#APT-2026-8201',
    doctor: 'Dr. Zeynep Demir',
    specialty: 'Clinical Psychologist',
    clinic: 'Psikoloji Kliniği, İstanbul',
    date: '14 Mar 2026',
    time: '11:00',
    type: 'Online',
    status: 'Cancelled',
    statusCls: '',
    initials: 'ZD', avatarBg: '#FAEEDA', avatarColor: '#854F0B',
  },
]

export default function AppointmentTracking() {
  const [tab, setTab] = useState('upcoming')
  const list = tab === 'upcoming' ? UPCOMING : PAST

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={[
          { icon: 'ti-message-chatbot', label: 'Chatbot'       },
          { icon: 'ti-stethoscope',     label: 'Choose doctor' },
          { icon: 'ti-calendar',        label: 'Appointments', active: true },
          { icon: 'ti-user',            label: 'Profile'       },
        ]}
        user={{ initials: 'TB', name: 'Tuna B.', role: 'Patient' }}
      />

      <div className="main-area">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>My Appointments</div>
          <button className="btn-primary btn btn-sm">
            <i className="ti ti-plus" /> New Appointment
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
          {[
            { key: 'upcoming', label: `Upcoming (${UPCOMING.length})` },
            { key: 'past',     label: `Past (${PAST.length})` },
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

        {/* Appointment cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((appt, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: appt.avatarBg, color: appt.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                }}>
                  {appt.initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.doctor}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{appt.specialty}</div>
                    </div>
                    <span className={`badge ${appt.statusCls}`} style={{ fontSize: 11, marginLeft: 8 }}>{appt.status}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                    <span><i className="ti ti-map-pin" style={{ marginRight: 4 }} />{appt.clinic}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                    <span><i className="ti ti-calendar" style={{ marginRight: 4 }} />{appt.date}</span>
                    <span><i className="ti ti-clock" style={{ marginRight: 4 }} />{appt.time}</span>
                    <span><i className={`ti ${appt.type === 'Online' ? 'ti-device-laptop' : 'ti-users'}`} style={{ marginRight: 4 }} />{appt.type}</span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'monospace', marginBottom: tab === 'upcoming' ? 12 : 0 }}>
                    {appt.id}
                  </div>

                  {/* Actions — upcoming only */}
                  {tab === 'upcoming' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm" style={{ fontSize: 12 }}>
                        <i className="ti ti-refresh" /> Reschedule
                      </button>
                      <button className="btn btn-sm" style={{ fontSize: 12, color: 'var(--red-text)' }}>
                        <i className="ti ti-x" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
