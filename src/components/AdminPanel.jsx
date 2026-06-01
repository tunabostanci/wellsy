import { useEffect, useState } from 'react'
import Sidebar from './Sidebar.jsx'

const SYSTEM_STATS = [
  { label: 'Total Users', value: '1,280' },
  { label: 'Active Clinics', value: '24' },
  { label: 'Open Tickets', value: '12' },
]

const INITIAL_USERS = [
  { name: 'Merve K.', role: 'Clinic Admin', email: 'merve@wellsy.com' },
  { name: 'Burak Y.', role: 'Doctor', email: 'burak@wellsy.com' },
  { name: 'Aslı T.', role: 'Staff', email: 'asli@wellsy.com' },
]

const INITIAL_DOCTORS = [
  { name: 'Dr. Ayşe Kaya', branch: 'Clinical Psychology', email: 'ayse.kaya@wellsy.com' },
  { name: 'Dr. Mehmet Yılmaz', branch: 'Psychiatry', email: 'mehmet.yilmaz@wellsy.com' },
]

const ADMIN_NAV = [
  { icon: 'ti-layout-dashboard', label: 'Overview', view: 'overview' },
  { icon: 'ti-users', label: 'Users', view: 'users' },
  { icon: 'ti-stethoscope', label: 'Doctors', view: 'doctors' },
  { icon: 'ti-user-heart', label: 'Patients', view: 'patients' },
  { icon: 'ti-settings', label: 'Settings', view: 'settings' },
]

function AdminOverview() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Admin Dashboard</div>
      <div className="text-sm text-muted mb-4">Manage clinics, users, and system settings.</div>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
        {SYSTEM_STATS.map((stat, i) => (
          <div key={i} className="metric-card">
            <div className="metric-label">{stat.label}</div>
            <div className="metric-val">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header">Recent system activity</div>
        <div style={{ display: 'grid', gap: 10, padding: '14px' }}>
          <div style={{ fontSize: 13 }}><strong>•</strong> New clinic profile created for Kadıköy branch.</div>
          <div style={{ fontSize: 13 }}><strong>•</strong> 4 user accounts approved today.</div>
          <div style={{ fontSize: 13 }}><strong>•</strong> Notifications updated for appointment reminders.</div>
        </div>
      </div>
    </div>
  )
}

function AdminUsers({ users }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>User Management</div>
      <div className="text-sm text-muted mb-4">View and manage admin, staff, and doctor accounts.</div>
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Name', 'Role', 'Email', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{user.name}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-2)' }}>{user.role}</td>
                <td style={{ padding: '9px 14px' }}>{user.email}</td>
                <td style={{ padding: '9px 14px' }}>
                  <button type="button" className="btn btn-sm" style={{ fontSize: 11, padding: '3px 7px' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminDoctors({ doctors, onAddDoctor }) {
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('')
  const [email, setEmail] = useState('')

  const canSubmit = name.trim() && branch.trim() && email.trim()

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Doctor Management</div>
      <div className="text-sm text-muted mb-4">Add and review doctors available in the network.</div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Name</label>
            <input
              type="text"
              className="text-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Example"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Branch</label>
            <input
              type="text"
              className="text-input"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="Psychiatry"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              className="text-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@clinic.com"
            />
          </div>
          <button
            type="button"
            className="btn-primary btn"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return
              onAddDoctor({ name: name.trim(), branch: branch.trim(), email: email.trim() })
              setName(''); setBranch(''); setEmail('')
            }}
          >
            Add Doctor
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Doctor Directory</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Name', 'Branch', 'Email'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{doctor.name}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-2)' }}>{doctor.branch}</td>
                <td style={{ padding: '9px 14px' }}>{doctor.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminPatients({ patients, onAddPatient }) {
  const [name, setName] = useState('')
  const [tc, setTc] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const canSubmit = name.trim() && email.trim()

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Patient Management</div>
      <div className="text-sm text-muted mb-4">Track patients stored in PostgreSQL and add new profiles.</div>

      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Name</label>
            <input
              type="text"
              className="text-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Patient name"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>TC ID</label>
            <input
              type="text"
              className="text-input"
              value={tc}
              onChange={e => setTc(e.target.value)}
              placeholder="12345678901"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              className="text-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="patient@example.com"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Phone</label>
            <input
              type="text"
              className="text-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0532 000 00 00"
            />
          </div>
          <button
            type="button"
            className="btn-primary btn"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return
              onAddPatient({ name: name.trim(), tc: tc.trim(), email: email.trim(), phone: phone.trim() })
              setName(''); setTc(''); setEmail(''); setPhone('')
            }}
          >
            Add Patient
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Patient Directory</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
              {['Name', 'TC ID', 'Email', 'Phone'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ padding: '9px 14px', fontWeight: 500 }}>{patient.name}</td>
                <td style={{ padding: '9px 14px', color: 'var(--text-2)' }}>{patient.tc || '-'}</td>
                <td style={{ padding: '9px 14px' }}>{patient.email}</td>
                <td style={{ padding: '9px 14px' }}>{patient.phone || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminSettings() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>System Settings</div>
      <div className="text-sm text-muted mb-4">Configure appointment rules and notification preferences.</div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>Default appointment duration</div>
            <div className="tag">30 minutes</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>Reminder emails</div>
            <div className="tag">Enabled</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>Clinic visibility</div>
            <div className="tag">Public</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('overview')
  const [users] = useState(INITIAL_USERS)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const fetchDoctors = async () => {
    const response = await fetch(`${apiUrl}/api/doctors`)
    if (!response.ok) {
      throw new Error('Failed to load doctors')
    }
    const data = await response.json()
    setDoctors(data)
  }

  const fetchPatients = async () => {
    const response = await fetch(`${apiUrl}/api/patients`)
    if (!response.ok) {
      throw new Error('Failed to load patients')
    }
    const data = await response.json()
    setPatients(data)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchDoctors(), fetchPatients()])
      } catch (loadError) {
        console.error(loadError)
        setError('Could not load backend data. Check backend and database status.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [apiUrl])

  const handleAddDoctor = async (doctor) => {
    try {
      const response = await fetch(`${apiUrl}/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: doctor.name,
          specialty: doctor.branch || doctor.specialty || '',
          clinic: doctor.clinic || '',
          email: doctor.email || '',
          initials: doctor.initials || doctor.name.split(' ').map(word => word[0]).join('').slice(0, 2),
          tags: doctor.tags || [],
          date: doctor.date || '',
          time: doctor.time || '',
          visit: doctor.visit || 'Online',
          visitIcon: doctor.visitIcon || 'ti-device-laptop',
          match_score: doctor.match || 0,
          rating: doctor.rating || 0,
          stars: doctor.stars || '',
          avatarBg: doctor.avatarBg || '#E1F5EE',
          avatarColor: doctor.avatarColor || '#0F6E56',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save doctor')
      }

      await fetchDoctors()
      setActiveSection('doctors')
    } catch (saveError) {
      console.error(saveError)
      setError('Unable to save doctor to the database.')
    }
  }

  const handleAddPatient = async (patient) => {
    try {
      const response = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
      })

      if (!response.ok) {
        throw new Error('Failed to save patient')
      }

      await fetchPatients()
      setActiveSection('patients')
    } catch (saveError) {
      console.error(saveError)
      setError('Unable to save patient to the database.')
    }
  }

  return (
    <div className="two-col-layout">
      <Sidebar
        navItems={ADMIN_NAV.map(item => ({
          ...item,
          active: item.view === activeSection,
          onClick: () => setActiveSection(item.view),
        }))}
        user={{ initials: 'AD', name: 'Admin User', role: 'System Admin' }}
      />
      <div className="main-area">
        {loading && <div className="alert alert-info">Loading admin data from backend...</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {activeSection === 'overview' && <AdminOverview />}
        {activeSection === 'users' && <AdminUsers users={users} />}
        {activeSection === 'doctors' && <AdminDoctors doctors={doctors.map(doc => ({
          ...doc,
          branch: doc.specialty || '',
        }))} onAddDoctor={handleAddDoctor} />}
        {activeSection === 'patients' && <AdminPatients patients={patients} onAddPatient={handleAddPatient} />}
        {activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  )
}
