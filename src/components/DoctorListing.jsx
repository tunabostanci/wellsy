import { useState } from 'react'
import Sidebar from './Sidebar.jsx'

const DOCTORS = [
  {
    initials: 'AK',
    avatarBg: '#E1F5EE', avatarColor: '#0F6E56',
    name: 'Dr. Ayşe Kaya',
    specialty: 'Clinical Psychologist',
    clinic: 'İstanbul Psikoloji Kliniği',
    tags: ['Anxiety disorders', 'CBT', 'Stress management'],
    date: '13 May', time: '14:00', visit: 'Online',
    visitIcon: 'ti-device-laptop',
    match: 95, rating: 4.9, stars: '★★★★★',
  },
  {
    initials: 'MY',
    avatarBg: '#E6F1FB', avatarColor: '#185FA5',
    name: 'Dr. Mehmet Yılmaz',
    specialty: 'Psychiatrist',
    clinic: 'Ruh Sağlığı Merkezi, Ankara',
    tags: ['Anxiety', 'Depression', 'Group therapy'],
    date: '12 May', time: '16:30', visit: 'In-person',
    visitIcon: 'ti-users',
    match: 88, rating: 4.8, stars: '★★★★☆',
  },
  {
    initials: 'ZD',
    avatarBg: '#FAEEDA', avatarColor: '#854F0B',
    name: 'Dr. Zeynep Demir',
    specialty: 'Clinical Psychologist',
    clinic: 'İstanbul Psikoloji Kliniği',
    tags: ['Stress management', 'Mindfulness', 'Sleep therapy'],
    date: '14 May', time: '10:00', visit: 'Online',
    visitIcon: 'ti-device-laptop',
    match: 82, rating: 4.7, stars: '★★★★☆',
  },
]

export default function DoctorListing() {
  const [selected, setSelected] = useState(0)
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = DOCTORS.filter(d => {
    if (typeFilter === 'online' && d.visit !== 'Online') return false
    if (typeFilter === 'in-person' && d.visit !== 'In-person') return false
    return true
  })

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={[
          { icon: 'ti-message-chatbot', label: 'Chatbot'       },
          { icon: 'ti-stethoscope',     label: 'Choose doctor', active: true },
          { icon: 'ti-calendar',        label: 'Appointments'  },
          { icon: 'ti-user',            label: 'Profile'       },
        ]}
        user={{ initials: 'TB', name: 'Tuna B.', role: 'Patient' }}
      />

      <div className="main-area">
        <div className="mb-1" style={{ fontSize: 18, fontWeight: 500 }}>Recommended specialists</div>
        <div className="text-sm text-muted mb-3">
          Psychology &amp; Psychiatry experts — suggested by AI based on your symptoms
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select className="select-input" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All dates</option>
            <option value="week">This week</option>
            <option value="next">Next week</option>
          </select>
          <select className="select-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All visit types</option>
            <option value="online">Online</option>
            <option value="in-person">In-person</option>
          </select>
          <select className="select-input">
            <option>Any time</option>
            <option>Morning</option>
            <option>Afternoon</option>
          </select>
        </div>

        {/* Doctor cards */}
        <div className="flex-col gap-2 mb-4">
          {filtered.map((doc, i) => (
            <div
              key={i}
              className={`doctor-card${selected === i ? ' selected' : ''}`}
              onClick={() => setSelected(i)}
              role="button"
              tabIndex={0}
              aria-pressed={selected === i}
              onKeyDown={e => e.key === 'Enter' && setSelected(i)}
            >
              <div
                className="doc-avatar"
                style={{ background: doc.avatarBg, color: doc.avatarColor }}
              >
                {doc.initials}
              </div>

              <div className="flex-1">
                <div className="font-medium mb-1">{doc.name}</div>
                <div className="text-xs text-muted mb-2">{doc.specialty} · {doc.clinic}</div>
                <div className="flex gap-1 flex-wrap mb-2">
                  {doc.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
                  <span><i className="ti ti-calendar-event" aria-hidden="true" /> {doc.date}</span>
                  <span><i className="ti ti-clock" aria-hidden="true" /> {doc.time}</span>
                  <span><i className={`ti ${doc.visitIcon}`} aria-hidden="true" /> {doc.visit}</span>
                </div>
              </div>

              <div className="flex-col items-end gap-2" style={{ flexShrink: 0 }}>
                <span className="badge badge-teal" style={{ fontSize: 12 }}>{doc.match}% match</span>
                <div className="stars">{doc.stars} <span style={{ color: 'var(--text-3)' }}>{doc.rating}</span></div>
                <button
                  className={selected === i ? 'btn-primary btn btn-sm' : 'btn btn-sm'}
                  onClick={e => { e.stopPropagation(); setSelected(i) }}
                >
                  {selected === i ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action row */}
        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
          <button className="btn">Back</button>
          <button className="btn-primary btn">
            Continue to booking <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}