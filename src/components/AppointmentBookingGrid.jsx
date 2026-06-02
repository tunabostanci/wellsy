import { useState } from 'react'

const AVAILABLE_SLOTS = ['09:00', '10:00', '11:00', '11:30', '13:30', '14:00', '15:30', '16:00']

export default function AppointmentBookingGrid({ doctor, patient, onBack, onBookingComplete }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState('2026-06-15')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const API_URL = 'http://localhost:4000'

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      setError('Lütfen devam etmek için uygun bir saat dilimi seçiniz.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_name: patient.name,
          patient_email: patient.email,
          patient_tc: patient.tc || '12345678901',
          doctor_name: doctor.name,
          appointment_date: appointmentDate,
          appointment_time: selectedSlot,
          type: 'Online',
          note: note.trim()
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Randevu onaylanamadı.')

      setSuccess(true)
      setTimeout(() => {
        onBookingComplete()
      }, 1800)

    } catch (err) {
      setError(err.message || 'Bir çakışma hatası oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', maxWidth: 450, margin: '50px auto', background: 'white', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', borderTop: '6px solid #008069' }}>
        <div style={{ width: 64, height: 64, background: '#e1f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 16px auto' }}>
          <i className="ti ti-check" style={{ fontSize: 32, color: '#008069' }} />
        </div>
        <h3 style={{ color: '#111b21', fontSize: 20, fontWeight: 600 }}>Randevunuz Alındı!</h3>
        <p style={{ fontSize: 14, color: '#667781', marginTop: 8, lineHeight: 1.5 }}>
          {doctor.name} ile olan randevunuz başarıyla sisteme işlendi. Randevularım sayfasına aktarılıyorsunuz...
        </p>
      </div>
    )
  }

  return (
    <div className="screen-content" style={{ padding: '28px 24px', overflowY: 'auto', height: '100%', background: '#f4f7f6' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        {/* Doktor Mini Kart Alanı */}
        <div className="card" style={{ padding: 20, background: 'white', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20, border: '1px solid var(--border)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: doctor?.avatarBg || '#E1F5EE', color: doctor?.avatarColor || '#0F6E56', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 'bold', fontSize: 18 }}>
            {doctor?.initials || 'DR'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111b21' }}>{doctor?.name}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#667781' }}>{doctor?.specialty} • {doctor?.clinic}</p>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16, borderRadius: 8 }}>{error}</div>}

        {/* Seçim Alanı */}
        <div className="card" style={{ padding: 24, background: 'white', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 8 }}>Randevu Tarihi</label>
            <input 
              type="date" className="text-input" value={appointmentDate} 
              onChange={e => setAppointmentDate(e.target.value)} 
              style={{ width: '100%', maxWidth: 240, height: 40, borderRadius: 8 }}
              min="2026-06-02"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 12 }}>Müsait Saatler</label>
            
            {/* Şık ve Kompakt Grid Yapısı */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {AVAILABLE_SLOTS.map(slot => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot} type="button"
                    style={{
                      height: '42px',
                      borderRadius: '20px', // Oval modern görünüm
                      fontSize: '13px',
                      fontWeight: isSelected ? '6px' : '4px',
                      cursor: 'pointer',
                      border: isSelected ? 'none' : '1px solid #e9edef',
                      background: isSelected ? '#008069' : '#ffffff', // Seçilince WhatsApp Yeşili
                      color: isSelected ? '#ffffff' : '#111b21',
                      transition: 'all 0.15s ease-in-out',
                      boxShadow: isSelected ? '0 4px 10px rgba(0,128,105,0.2)' : 'none'
                    }}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={loading}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#111b21', display: 'block', marginBottom: 8 }}>Doktora İletmek İstediğiniz Not</label>
            <textarea
              className="text-input" placeholder="Belirtileriniz hakkında eklemek istediğiniz bir detay var mı?"
              value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', height: 80, resize: 'none', borderRadius: 8, padding: 12, fontSize: 13 }}
              disabled={loading}
            />
          </div>

        </div>

        {/* Aksiyon Butonları Çubuğu */}
        <div style={{ display: 'flex', gap: 12, justifycontent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn" onClick={onBack} style={{ height: 42, padding: '0 20px', borderRadius: 21 }} disabled={loading}>Geri Dön</button>
          <button 
            type="button" className="btn-primary btn" onClick={handleConfirmBooking} 
            style={{ height: 42, padding: '0 28px', borderRadius: 21, background: '#008069', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
            disabled={loading || !selectedSlot}
          >
            {loading ? 'Onaylanıyor...' : 'Randevuyu Onayla'} <i className="ti ti-chevron-right" />
          </button>
        </div>

      </div>
    </div>
  )
}