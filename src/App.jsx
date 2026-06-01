import { useState } from 'react'
import PatientChatbot      from './components/PatientChatbot.jsx'
import DoctorListing       from './components/DoctorListing.jsx'
import AppointmentTracking from './components/AppointmentTracking.jsx'
import DoctorDashboard     from './components/DoctorDashboard.jsx'
import StaffPanel          from './components/StaffPanel.jsx'
import AdminPanel          from './components/AdminPanel.jsx'

const TABS = [
  { id: 'chatbot',    label: 'Patient – Chatbot',    icon: 'ti-message-chatbot' },
  { id: 'doctors',   label: 'Patient – Doctors',    icon: 'ti-stethoscope'     },
  { id: 'appts',     label: 'Patient – Appointments',icon: 'ti-calendar'       },
  { id: 'dashboard', label: 'Doctor Dashboard',     icon: 'ti-layout-dashboard'},
  { id: 'staff',     label: 'Clinic Staff',         icon: 'ti-users'           },
  { id: 'admin',     label: 'Admin Panel',          icon: 'ti-shield-check'    },
]

export default function App() {
  const [active, setActive] = useState('chatbot')
  const [staffDefaultView, setStaffDefaultView] = useState('dashboard')

  return (
    <div className="app-shell">
      <nav className="tab-bar" role="tablist" aria-label="Role views">
        {TABS.map(t => (
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
            onNewAppointment={() => {
              setStaffDefaultView('booking')
              setActive('staff')
            }}
            onChatbot={() => setActive('chatbot')}
            onChooseDoctor={() => setActive('doctors')}
            onProfile={() => setActive('dashboard')}
          />
        )}
        {active === 'dashboard' && <DoctorDashboard />}
        {active === 'staff' && <StaffPanel defaultView={staffDefaultView} />}
        {active === 'admin' && <AdminPanel />}
      </div>
    </div>
  )
}
