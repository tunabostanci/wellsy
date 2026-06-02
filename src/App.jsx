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

  // Backend'den gelen kullanıcı verisini ve rolünü olduğu gibi saklar
  const handleLoginSuccess = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    setActive('chatbot')
    setStaffDefaultView('dashboard')
  }

  // Kullanıcı giriş yapmadıysa ortak Login ekranını gösterir
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // DOCTOR MODÜLÜ - Sadece Doktor Rolü Görebilir
  if (user.role === 'doctor') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Doctor views">
          <button role="tab" className="tab-btn active" style={{ flex: 1, opacity: 1 }}>
            <i className="ti ti-layout-dashboard" aria-hidden="true" />
            Doctor Dashboard
          </button>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>
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

  // PATIENT MODÜLÜ - Sadece Normal Hastalar Görebilir
  if (user.role === 'Patient' || user.role === 'patient') {
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
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
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

  // STAFF MODÜLÜ - Klinik Personeli (Mert gibi kullanıcılar) Buraya Düşer
  if (user.role === 'Staff' || user.role === 'staff') {
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
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
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

  // ADMIN MODÜLÜ - Sistem Yöneticileri Buraya Düşer
  if (user.role === 'Admin' || user.role === 'admin') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist" aria-label="Admin views">
          <button role="tab" className="tab-btn active" style={{ flex: 1, opacity: 1 }}>
            <i className="ti ti-shield-check" aria-hidden="true" />
            Admin Panel
          </button>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>
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