import { useEffect, useState } from 'react'

export default function DoctorDashboard({ doctor }) {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    if (!doctor?.id) return

    const loadDoctorData = async () => {
      try {
        setLoading(true)
        setError('')

        // 1. Doktorun kendi randevularını çek
        const apptsRes = await fetch(`${API_URL}/api/doctors/${doctor.id}/appointments`)
        if (!apptsRes.ok) throw new Error('Randevular çekilemedi.')
        const apptsData = await apptsRes.json()
        
        // Bugün ve sonrasını filtrelerken saat kilit uyuşmazlığı giderildi
        const today = new Date()
        today.setHours(0,0,0,0)
        const activeAppts = apptsData.filter(a => {
          const d = new Date(a.date)
          d.setHours(0,0,0,0)
          return d >= today
        })
        setAppointments(activeAppts)

        // 2. Doktorun tekil hasta geçmişini çek
        const patientsRes = await fetch(`${API_URL}/api/doctors/${doctor.id}/patients`)
        if (!patientsRes.ok) throw new Error('Hasta listesi çekilemedi.')
        const patData = await patientsRes.json()
        setPatients(patData)

      } catch (err) {
        console.error(err)
        setError('Doktor paneli verileri yüklenirken veritabanı hatası oluştu.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctorData()
  }, [doctor])

  return (
    <div className="page" style={{ padding: 24, overflowY: 'auto', height: '100%', background: 'var(--bg-page)' }}>
      <div style={{ marginBottom: 20 }}>
        <h2>Hoş Geldiniz, {doctor.name}</h2>
        <p className="text-sm text-muted">{doctor.specialty} • {doctor.clinic}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20 }}>
        
        {/* Sol Sütun: Güncel Randevu Akışı */}
        <div>
          <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8 }}>
            <h4>Yaklaşan Randevularınız ({appointments.length})</h4>
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : appointments.length === 0 ? (
                <div className="text-muted text-sm">Bugün için planlanmış bir randevunuz bulunmamaktadır.</div>
              ) : (
                appointments.map(appt => (
                  <div key={appt.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{appt.patient}</span>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{appt.patient_email}</div>
                      {appt.note && <div style={{ fontSize: 11, color: 'var(--amber-text)', marginTop: 4 }}><strong>Hasta Notu:</strong> {appt.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: 'var(--teal)', fontSize: 13 }}>{appt.date} - {appt.time}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tip: {appt.type}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Kayıtlı Hastalar Rehberi */}
        <div>
          <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8 }}>
            <h4>Kayıtlı Hastalarım ({patients.length})</h4>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : patients.length === 0 ? (
                <div className="text-muted text-sm">Henüz sistemde kayıtlı hastanız bulunmuyor.</div>
              ) : (
                patients.map(p => (
                  <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--bg-page)' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{p.email}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}