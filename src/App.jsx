import { useState } from 'react'
import Login from './components/Login.jsx'
import PatientChatbot from './components/PatientChatbot.jsx'
import DoctorListing from './components/DoctorListing.jsx'
import AppointmentTracking from './components/AppointmentTracking.jsx'
import DoctorDashboard from './components/DoctorDashboard.jsx'
import StaffPanel from './components/StaffPanel.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [user, setUser] = useState(null) // { role: 'doctor'|'patient'|'staff'|'admin', ...userData }
  const [active, setActive] = useState('chatbot')
  const [staffDefaultView, setStaffDefaultView] = useState('dashboard')

  const handleDoctorLogin = (doctor) => {
    setUser({ role: 'doctor', ...doctor })
  }

  const handlePatientLogin = (patient) => {
    setUser({ role: 'patient', ...patient })
  }

  const handleLogout = () => {
    setUser(null)
    setActive('chatbot')
    setStaffDefaultView('dashboard')
  }

  // Show login page if no user is logged in
  if (!user) {
    return <Login onDoctorLogin={handleDoctorLogin} onPatientLogin={handlePatientLogin} />
  }

  // Doctor dashboard - isolated view for doctors only
  if (user.role === 'doctor') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Doctor views">
          <button
            role="tab"
            className="tab-btn active"
            style={{ flex: 1, opacity: 1 }}
          >
            <i className="ti ti-layout-dashboard" aria-hidden="true" />
            Doctor Dashboard
          </button>
          <button
            role="tab"
            className="tab-btn"
            onClick={handleLogout}
            style={{ flex: 1 }}
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Logout
          </button>
        </nav>
        <div className="screen-content">
          <DoctorDashboard doctor={user} />
        </div>
      </div>
    )
  }

  // Patient journey - isolated view for patients only
  if (user.role === 'patient') {
    const PATIENT_TABS = [
      { id: 'chatbot', label: 'Chatbot', icon: 'ti-message-chatbot' },
      { id: 'doctors', label: 'Choose Doctor', icon: 'ti-stethoscope' },
      { id: 'appts', label: 'My Appointments', icon: 'ti-calendar' },
    ]

    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Patient views">
          {PATIENT_TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              className={`tab-btn${active === t.id ? ' active' : ''}`}
              onClick={() => setActive(t.id)}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
          <button
            role="tab"
            className="tab-btn"
            onClick={handleLogout}
            style={{ marginLeft: 'auto' }}
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Logout
          </button>
        </nav>

        <div className="screen-content">
          {active === 'chatbot' && (
            <PatientChatbot onNavigateToDoctors={() => setActive('doctors')} />
          )}
          {active === 'doctors' && (
            <DoctorListing
              onBack={() => setActive('chatbot')}
              onContinue={() => setActive('appts')}
            />
          )}
          {active === 'appts' && (
            <AppointmentTracking
              patient={user}
              onChatbot={() => setActive('chatbot')}
              onChooseDoctor={() => setActive('doctors')}
              onProfile={() => {}}
            />
          )}
        </div>
      </div>
    )
  }

  // Staff panel - existing multi-tab view
  if (user.role === 'staff') {
    const STAFF_TABS = [
      { id: 'staff', label: 'Clinic Staff', icon: 'ti-users' },
      { id: 'admin', label: 'Admin Panel', icon: 'ti-shield-check' },
    ]

    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Staff views">
          {STAFF_TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              className={`tab-btn${active === t.id ? ' active' : ''}`}
              onClick={() => {
                setActive(t.id)
                if (t.id === 'staff') setStaffDefaultView('dashboard')
              }}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" />
              {t.label}
            </button>
          ))}
          <button
            role="tab"
            className="tab-btn"
            onClick={handleLogout}
            style={{ marginLeft: 'auto' }}
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Logout
          </button>
        </nav>

        <div className="screen-content">
          {active === 'staff' && <StaffPanel defaultView={staffDefaultView} />}
          {active === 'admin' && <AdminPanel />}
        </div>
      </div>
    )
  }

  // Admin-only view
  if (user.role === 'admin') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Admin views">
          <button
            role="tab"
            className="tab-btn active"
            style={{ flex: 1, opacity: 1 }}
          >
            <i className="ti ti-shield-check" aria-hidden="true" />
            Admin Panel
          </button>
          <button
            role="tab"
            className="tab-btn"
            onClick={handleLogout}
            style={{ flex: 1 }}
          >
            <i className="ti ti-logout" aria-hidden="true" />
            Logout
          </button>
        </nav>
        <div className="screen-content">
          <AdminPanel />
        </div>
      </div>
    )
  }

  return null
}

