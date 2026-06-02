import { useState } from 'react'
import Login from './components/Login.jsx'
import PatientChatbot from './components/PatientChatbot.jsx'
import DoctorListing from './components/DoctorListing.jsx'
import AppointmentTracking from './components/AppointmentTracking.jsx'
import AppointmentBookingGrid from './components/AppointmentBookingGrid.jsx'
import DoctorDashboard from './components/DoctorDashboard.jsx'
import StaffPanel from './components/StaffPanel.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import PatientProfile from './components/PatientProfile.jsx' 
import Sidebar from './components/Sidebar.jsx' 

export default function App() {
  const [user, setUser] = useState(null)
  const [active, setActive] = useState('chatbot') // 'chatbot' | 'doctors' | 'profile' | 'booking-grid' | 'appts'
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [staffDefaultView, setStaffDefaultView] = useState('dashboard')
  const [aiChatHistory, setAiChatHistory] = useState('')

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser); 
  };

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
    setAiChatHistory('')
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const getUserInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // A) DOCTOR MODÜLÜ
  // ─────────────────────────────────────────────────────────────────────────
  if (user.role === 'doctor') {
    const doctorNav = [
      { icon: 'ti-dashboard', label: 'Doctor Dashboard', active: true },
      { icon: 'ti-logout', label: 'Logout', onClick: handleLogout }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar 
          logo="Wellsy" 
          navItems={doctorNav} 
          user={{ initials: getUserInitials(user.name), name: user.name, role: 'Uzman Doktor' }} 
        />
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f4f7f6', boxSizing: 'border-box' }}>
          <DoctorDashboard doctor={user} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // B) PATIENT MODÜLÜ (SIDEBAR & PANORAMİK ROW ENTEGRASYONU)
  // ─────────────────────────────────────────────────────────────────────────
  if (user.role === 'Patient' || user.role === 'patient') {
    
    const PATIENT_NAV_ITEMS = [
      { 
        icon: 'ti-message-chatbot', 
        label: 'Chatbot Asistanı', 
        active: active === 'chatbot', 
        onClick: () => setActive('chatbot') 
      },
      { 
        icon: 'ti-stethoscope', 
        label: 'Doktor Seçimi', 
        active: active === 'doctors' || active === 'booking-grid', 
        onClick: () => setActive('doctors') 
      },
      { 
        icon: 'ti-calendar', 
        label: 'Randevularım', 
        active: active === 'appts', 
        onClick: () => setActive('appts') 
      },
      { 
        icon: 'ti-user-cog', 
        label: 'Profil Ayarları', 
        active: active === 'profile', 
        onClick: () => setActive('profile') 
      },
      { 
        icon: 'ti-logout', 
        label: 'Güvenli Çıkış', 
        onClick: handleLogout 
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Reusable Sidebar */}
        <Sidebar 
          logo="Wellsy" 
          navItems={PATIENT_NAV_ITEMS} 
          user={{ 
            initials: getUserInitials(user.name), 
            name: user.name, 
            role: 'Kayıtlı Hasta' 
          }} 
        />

        {/* Ana İçerik Ekranı - Sidebar'ın sağında izole şekilde listelenir */}
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f4f7f6', boxSizing: 'border-box' }}>
          {active === 'chatbot' && (
            <PatientChatbot 
              onNavigateToDoctors={(historySummary) => {
                setAiChatHistory(historySummary)
                setActive('doctors')
              }} 
            />
          )}
          {active === 'doctors' && (
            <DoctorListing
              chatHistory={aiChatHistory}
              onBack={() => setActive('chatbot')}
              onContinue={(doctor) => {
                setSelectedDoctor(doctor) 
                setActive('booking-grid') 
              }}
            />
          )}
          {active === 'profile' && (
            <PatientProfile 
              user={user} 
              onUserUpdate={handleUserUpdate} 
            />
          )}
          {active === 'booking-grid' && (
            <AppointmentBookingGrid
              doctor={selectedDoctor}
              patient={user}
              chatHistory={aiChatHistory}
              onBack={() => setActive('doctors')}
              onBookingComplete={() => {
                setAiChatHistory('') 
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
            />
          )}
        </div>
      </div>
    )
  }

 // ─────────────────────────────────────────────────────────────────────────
  // C) STAFF MODÜLÜ (ONAYLAMA EKRANI VE PROFİL AYARLARI ENTREGRE SÜRÜM)
  // ─────────────────────────────────────────────────────────────────────────
  if (user.role === 'Staff' || user.role === 'staff') {
    const staffNav = [
      { 
        icon: 'ti-layout-dashboard', 
        label: 'Dashboard', 
        active: staffDefaultView === 'dashboard', 
        onClick: () => setStaffDefaultView('dashboard') 
      },
      { 
        icon: 'ti-user-plus', 
        label: 'Create Booking', 
        active: staffDefaultView === 'booking', 
        onClick: () => setStaffDefaultView('booking') 
      },
      { 
        icon: 'ti-calendar', 
        label: 'Appointments', 
        active: staffDefaultView === 'appts', 
        onClick: () => setStaffDefaultView('appts') // FIXED: Sidebar ile StaffPanel 'appts' ismi eşitlendi!
      },
      { 
        icon: 'ti-refresh-alert', 
        label: 'Change Requests', 
        active: staffDefaultView === 'changes', 
        onClick: () => setStaffDefaultView('changes') 
      },
      { 
        icon: 'ti-user-cog', 
        label: 'Profil Ayarları', 
        active: staffDefaultView === 'profile', 
        onClick: () => setStaffDefaultView('profile') 
      },
      { 
        icon: 'ti-logout', 
        label: 'Güvenli Çıkış', 
        onClick: handleLogout 
      }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar 
          logo="Wellsy" 
          navItems={staffNav} 
          user={{ 
            initials: getUserInitials(user.name), 
            name: user.name, 
            role: 'Klinik Personeli' 
          }} 
        />
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f4f7f6', boxSizing: 'border-box', padding: '10px' }}>
          <StaffPanel defaultView={staffDefaultView} user={user} onUserUpdate={handleUserUpdate} />
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // D) ADMIN MODÜLÜ (SIFIR HATA - SIDEBAR ENTEGRE SÜRÜM)
  // ─────────────────────────────────────────────────────────────────────────
  if (user.role === 'Admin' || user.role === 'admin') {
    const adminNav = [
      { icon: 'ti-shield-lock', label: 'Yönetici Paneli', active: true },
      { icon: 'ti-logout', label: 'Güvenli Çıkış', onClick: handleLogout }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <Sidebar 
          logo="Wellsy" 
          badge="ADMIN" 
          dark={true} // Yönetici ağırlığı için koyu gri tema
          navItems={adminNav} 
          user={{ 
            initials: 'AD', 
            name: user.name, 
            role: 'Sistem Yöneticisi' 
          }} 
        />
        {/* Sağ İçerik Alanı: padding verilerek üste binme engellendi */}
        <div style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#f4f7f6', boxSizing: 'border-box', padding: '10px' }}>
          <AdminPanel />
        </div>
      </div>
    )
  }
  return null
}