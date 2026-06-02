import { useState } from 'react'
import Login from './components/Login.jsx'
import PatientChatbot from './components/PatientChatbot.jsx'
import DoctorListing from './components/DoctorListing.jsx'
import AppointmentTracking from './components/AppointmentTracking.jsx'
import AppointmentBookingGrid from './components/AppointmentBookingGrid.jsx' // Yeni eklenen dosyamız
import DoctorDashboard from './components/DoctorDashboard.jsx'
import StaffPanel from './components/StaffPanel.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [active, setActive] = useState('chatbot') // 'chatbot' | 'doctors' | 'booking-grid' | 'appts'
  const [selectedDoctor, setSelectedDoctor] = useState(null) // Seçilen doktor hafızası

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    if (userData.role === 'Patient' || userData.role === 'patient') {
      setActive('chatbot')
    } else if (userData.role === 'Staff' || userData.role === 'staff') {
      setActive('staff')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setActive('chatbot')
    setSelectedDoctor(null)
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // DOCTOR MODÜLÜ
  if (user.role === 'doctor') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist">
          <div className="tab-btn active" style={{ flex: 1, cursor: 'default' }}>Doctor Dashboard</div>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><DoctorDashboard doctor={user} /></div>
      </div>
    )
  }

  // PATIENT MODÜLÜ (Yeni Saat Akışı Entegre Edildi)
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
              aria-selected={active === t.id || (t.id === 'doctors' && active === 'booking-grid')}
              className={`tab-btn${active === t.id || (t.id === 'doctors' && active === 'booking-grid') ? ' active' : ''}`}
              onClick={() => setActive(t.id)}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" /> {t.label}
            </button>
          ))}
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ marginLeft: 'auto' }}>
            <i className="ti ti-logout" aria-hidden="true" /> Logout
          </button>
        </nav>

        <div className="screen-content">
          {active === 'chatbot' && (
            <PatientChatbot onNavigateToDoctors={() => setActive('doctors')} />
          )}
          {active === 'doctors' && (
            <DoctorListing
              onBack={() => setActive('chatbot')}
              onContinue={(doctor) => {
                setSelectedDoctor(doctor) // Seçilen doktoru hafızaya al
                setActive('booking-grid') // Saat seçme ekranına fırlat
              }}
            />
          )}
          {active === 'booking-grid' && (
            <AppointmentBookingGrid
              doctor={selectedDoctor}
              patient={user}
              onBack={() => setActive('doctors')}
              onBookingComplete={() => setActive('appts')} // Başarılı olunca listeleme ekranına atar
            />
          )}
          {active === 'appts' && (
            <AppointmentTracking
              patient={user}
              onNewAppointment={() => setActive('doctors')}
            />
          )}
        </div>
      </div>
    )
  }

  // STAFF MODÜLÜ
  if (user.role === 'Staff' || user.role === 'staff') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist">
          <div className="tab-btn active" style={{ flex: 1, cursor: 'default' }}>Clinic Staff</div>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><StaffPanel defaultView="dashboard" /></div>
      </div>
    )
  }

  // ADMIN MODÜLÜ
  if (user.role === 'Admin' || user.role === 'admin') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist">
          <div className="tab-btn active" style={{ flex: 1, cursor: 'default' }}>Admin Panel</div>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><AdminPanel /></div>
      </div>
    )
  }

  return null
}