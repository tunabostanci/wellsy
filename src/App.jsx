import { useState } from 'react'
import Login from './components/Login.jsx'
import PatientChatbot from './components/PatientChatbot.jsx'
import DoctorListing from './components/DoctorListing.jsx'
import AppointmentTracking from './components/AppointmentTracking.jsx'
import AppointmentBookingGrid from './components/AppointmentBookingGrid.jsx'
import DoctorDashboard from './components/DoctorDashboard.jsx'
import StaffPanel from './components/StaffPanel.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [active, setActive] = useState('chatbot') // 'chatbot' | 'doctors' | 'booking-grid' | 'appts'
  const [selectedDoctor, setSelectedDoctor] = useState(null) // Seçilen doktor hafızası
  const [staffDefaultView, setStaffDefaultView] = useState('dashboard')
  
  // Chatbot konuşma geçmişini hafızada tutup DoctorListing'e paslayacak olan köprü state
  const [aiChatHistory, setAiChatHistory] = useState('')

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
    setAiChatHistory('') // Oturum kapatılınca AI geçmişini de temizliyoruz
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  // DOCTOR MODÜLÜ
  if (user.role === 'doctor') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist">
          <button role="tab" className="tab-btn active" style={{ flex: 1 }}>Doctor Dashboard</button>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><DoctorDashboard doctor={user} /></div>
      </div>
    )
  }

  // PATIENT MODÜLÜ
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
              onClick={() => {
                // Eğer sekmelerden doğrudan "Choose Doctor"a tıklarsa ve chatbot geçmişi yoksa düz liste gelsin diye temizlenebilir, 
                // ancak chatbot'tan yönlendirmeyle gelindiğinde korunması için dokunmuyoruz.
                setActive(t.id)
              }}
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
            // Chatbot'tan gelen metin dökümünü yakalayıp state'e yazıyoruz ve ekranı kaydırıyoruz
            <PatientChatbot 
              onNavigateToDoctors={(historySummary) => {
                setAiChatHistory(historySummary)
                setActive('doctors')
              }} 
            />
          )}
          {active === 'doctors' && (
            <DoctorListing
              chatHistory={aiChatHistory} // Yakalanan canlı AI geçmişini prop olarak gönderiyoruz
              onBack={() => setActive('chatbot')}
              onContinue={(doctor) => {
                setSelectedDoctor(doctor) 
                setActive('booking-grid') 
              }}
            />
          )}
          {active === 'booking-grid' && (
            <AppointmentBookingGrid
              doctor={selectedDoctor}
              patient={user}
              chatHistory={aiChatHistory}
              onBack={() => setActive('doctors')}
              onBookingComplete={() => {
                setAiChatHistory('') // Randevu başarıyla tamamlandığında AI geçmişini sıfırlıyoruz
                setActive('appts')
              }} 
            />
          )}
          {active === 'appts' && (
            <AppointmentTracking
              patient={user}
              onNewAppointment={() => setActive('doctors')}
              onChatbot={() => setActive('chatbot')}
              onChooseDoctor={() => setActive('doctors')}
              onProfile={() => {}}
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
          <button role="tab" className="tab-btn active" style={{ flex: 1 }}>Clinic Staff</button>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><StaffPanel defaultView={staffDefaultView} /></div>
      </div>
    )
  }

  // ADMIN MODÜLÜ
  if (user.role === 'Admin' || user.role === 'admin') {
    return (
      <div className="app-shell">
        <nav className="tab-bar" role="tablist">
          <button role="tab" className="tab-btn active" style={{ flex: 1 }}>Admin Panel</button>
          <button role="tab" className="tab-btn" onClick={handleLogout} style={{ flex: 1 }}>Logout</button>
        </nav>
        <div className="screen-content"><AdminPanel /></div>
      </div>
    )
  }

  return null
}