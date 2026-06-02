import { useEffect, useState } from 'react'

export default function DoctorDashboard({ doctor }) {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Seçilen hastanın geçmiş vizite geçmişi için durumlar (State)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientHistory, setPatientHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const API_URL = 'http://localhost:4000'

  useEffect(() => {
    if (!doctor?.id) return

    const loadDoctorData = async () => {
      try {
        setLoading(true)
        setError('')

        // 1. Doktorun kendi aktif randevularını çek
        const apptsRes = await fetch(`${API_URL}/api/doctors/${doctor.id}/appointments`)
        if (!apptsRes.ok) throw new Error('Randevular çekilemedi.')
        const apptsData = await apptsRes.json()
        
        const today = new Date()
        today.setHours(0,0,0,0)
        const activeAppts = apptsData.filter(a => {
          const d = new Date(a.date)
          d.setHours(0,0,0,0)
          return d >= today
        })
        setAppointments(activeAppts)

        // 2. Doktorun tekil hasta listesini çek
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

  // Bir hastaya tıklandığında geçmiş ziyaretlerini getiren fonksiyon
  const handlePatientClick = async (patient) => {
    setSelectedPatient(patient)
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/doctors/${doctor.id}/patients/${patient.id}/history`)
      if (!res.ok) throw new Error('Geçmiş ziyaretler yüklenemedi.')
      const historyData = await res.json()
      setPatientHistory(historyData)
    } catch (err) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: '100%', background: '#f4f7f6' }}>
      <div style={{ marginBottom: 20 }}>
        <h2>Hoş Geldiniz, {doctor.name}</h2>
        <p className="text-sm text-muted">{doctor.specialty} • {doctor.clinic}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20 }}>
        
        {/* Sol Sütun: Güncel Randevu Akışı & Seçilen Hasta Geçmişi Detayı */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Üst Kısım: Yaklaşan Randevular */}
          <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8 }}>
            <h4>Yaklaşan Randevularınız ({appointments.length})</h4>
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : appointments.length === 0 ? (
                <div className="text-muted text-sm">Planlanmış aktif bir randevunuz bulunmamaktadır.</div>
              ) : (
                appointments.map(appt => (
                  <div key={appt.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{appt.patient}</span>
                      <div style={{ fontSize: 12, color: '#667781' }}>{appt.patient_email}</div>
                      {appt.note && <div style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}><strong>Hasta Notu:</strong> {appt.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600, color: '#008069', fontSize: 13 }}>{appt.date} - {appt.time}</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tip: {appt.type}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DİNAMİK ALAN: Bir hastaya tıklandığında açılan Klinik Ziyaret Geçmişi Paneli */}
          {selectedPatient && (
            <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8, borderTop: '4px solid #008069', animation: 'fadeIn 0.2s ease-in-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h4 style={{ margin: 0 }}>{selectedPatient.name} - Klinik Ziyaret Geçmişi</h4>
                  <span style={{ fontSize: 11, color: '#667781' }}>{selectedPatient.email} • {selectedPatient.phone || 'Telefon Yok'}</span>
                </div>
                <button 
                  className="btn" 
                  style={{ padding: '4px 8px', fontSize: 11, background: '#f4f7f6', border: 'none', cursor: 'pointer' }}
                  onClick={() => setSelectedPatient(null)}
                >
                  Kapat
                </button>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {historyLoading ? (
                  <div className="text-sm text-muted">Geçmiş vizite kayıtları sorgulanıyor...</div>
                ) : patientHistory.length === 0 ? (
                  <div className="text-sm text-muted" style={{ padding: '10px 0' }}>Bu hastanın sizinle daha önce tamamlanmış bir klinik geçmişi bulunmamaktadır.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eee', color: 'var(--text-3)', fontSize: 12 }}>
                          <th style={{ padding: '8px 4px', textAlign: 'left' }}>Tarih / Saat</th>
                          <th style={{ padding: '8px 4px', textAlign: 'left' }}>Tip</th>
                          <th style={{ padding: '8px 4px', textAlign: 'left' }}>Hasta Notu / Şikayeti</th>
                          <th style={{ padding: '8px 4px', textAlign: 'left' }}>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientHistory.map(h => (
                          <tr key={h.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 500, color: '#008069' }}>{h.date} - {h.time}</td>
                            <td style={{ padding: '8px 4px' }}><span className="tag">{h.type}</span></td>
                            <td style={{ padding: '8px 4px', color: 'var(--text-2)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={h.note}>{h.note || 'Not belirtilmemiş.'}</td>
                            <td style={{ padding: '8px 4px' }}>
                              <span className={`badge ${h.status === 'Confirmed' ? 'badge-green' : h.status === 'Cancelled' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Sağ Sütun: Kayıtlı Hastalar Rehberi */}
        <div>
          <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8 }}>
            <h4>Kayıtlı Hastalarım ({patients.length})</h4>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 12 }}>Detaylı vizite geçmişini incelemek için hastaya tıklayın.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {loading ? (
                <div>Yükleniyor...</div>
              ) : patients.length === 0 ? (
                <div className="text-muted text-sm">Henüz sistemde kayıtlı hastanız bulunmuyor.</div>
              ) : (
                patients.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      padding: '10px 12px', 
                      border: selectedPatient?.id === p.id ? '1px solid #008069' : '1px solid #f4f7f6',
                      background: selectedPatient?.id === p.id ? '#e1f5ee' : '#fff',
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => handlePatientClick(p)} // Tıklama tetikleyicisi aktif
                    className="patient-list-item"
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: selectedPatient?.id === p.id ? '#0f6e56' : '#111b21' }}>
                      <i className="ti ti-user" style={{ marginRight: 6 }} /> {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#667781', marginTop: 2, paddingLeft: 18 }}>{p.email}</div>
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