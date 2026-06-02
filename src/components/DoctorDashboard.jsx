import { useEffect, useState } from 'react'

export default function DoctorDashboard({ doctor }) {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openAiNotes, setOpenAiNotes] = useState({})
  
  // Seçilen hastanın geçmiş vizite geçmişi için durumlar (State)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientHistory, setPatientHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const API_URL = 'http://localhost:4000'

  // ID bazlı dinamik açma/kapama fonksiyonu
  const toggleAiNote = (id) => {
    setOpenAiNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // SAF EFFECT PROTOKOLÜ: Sonsuz döngü engellemek için sadece doctor.id değişimini izler
  useEffect(() => {
    if (!doctor?.id) return;

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
    };

    loadDoctorData();
  }, [doctor?.id]); // 🚨 DEĞİŞİKLİK BURADA: Objeyi değil sadece ilkel ID değerini izleyerek sonsuz render'ı kırdık!

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
  <div className="screen-content" style={{ padding: '14px 24px', overflowY: 'auto', height: '100vh', background: '#f4f7f6', boxSizing: 'border-box', width: '100%' }}>
    <div style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 20, color: '#111b21' }}>Hoş Geldiniz, {doctor.name}</h2>
      <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#667781' }}>{doctor.specialty} • {doctor.clinic}</p>
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
                <div>Veriler yükleniyor...</div>
              ) : appointments.length === 0 ? (
                <div className="text-muted text-sm">Planlanmış aktif bir randevunuz bulunmamaktadır.</div>
              ) : (
                appointments.map(appt => {
                  const isNoteOpen = !!openAiNotes[appt.id];

                  return (
                    <div key={appt.id} style={{ padding: '16px 0', borderBottom: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      
                      {/* ÜST BİLGİ ALANI */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 15, color: '#111b21' }}>{appt.patient}</span>
                          <div style={{ fontSize: 13, color: '#667781', marginTop: 2 }}>{appt.patient_email}</div>
                        </div>
                        
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#008069', fontSize: 13 }}>
                            <i className="ti ti-calendar" /> {appt.date} - {appt.time}
                          </span>
                          <div style={{ fontSize: 11, color: '#667781' }}>Tip: {appt.type}</div>
                        </div>
                      </div>

                      {/* AI ÖZETİNİ AÇMA / KAPATMA BUTONU */}
                      {appt.note && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <button
                            type="button"
                            onClick={() => toggleAiNote(appt.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              background: isNoteOpen ? '#fff1f1' : '#E1F5EE',
                              color: isNoteOpen ? '#d9383a' : '#008069',
                              border: isNoteOpen ? '1px solid #fccfcf' : '1px solid #c2ebd9',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <i className={isNoteOpen ? "ti ti-eye-off" : "ti ti-message-chatbot"} style={{ fontSize: 14 }} />
                            {isNoteOpen ? "AI Görüşmesini Gizle" : "AI Chatbot Özetini Göster"}
                          </button>
                        </div>
                      )}

                      {/* DİNAMİK AÇILAN SOHBET BALONLARI ALANI */}
                      {appt.note && isNoteOpen && (
                        <div style={{ marginTop: 8, width: '100%', borderTop: '1px dashed #e9edef', paddingTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#008069', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ti ti-message-chatbot" style={{ fontSize: 16 }} /> AI Chatbot Ön Tanı Görüşmesi
                          </div>
                          
                          <div style={{ 
                            background: '#f8f9fa', 
                            border: '1px solid #e9edef', 
                            borderRadius: '12px', 
                            padding: '16px', 
                            maxHeight: '220px', 
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            boxSizing: 'border-box'
                          }}>
                            {/* Hastanın El Yazısıyla Bıraktığı Ek Not */}
                            {appt.note.includes('=== PATIENT EXTRA NOTE ===') && (
                              <div style={{ background: '#fff3cd', color: '#854F0B', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, marginBottom: 4 }}>
                                <strong>📌 Hasta Ek Notu:</strong> {appt.note.split('=== PATIENT EXTRA NOTE ===')[1]}
                              </div>
                            )}

                            {/* Chatbot Geçmişi Balonları */}
                            {appt.note.includes('=== AI CHATBOT PRE-DIAGNOSIS HISTORY ===') ? (
                              appt.note
                                .replace('=== AI CHATBOT PRE-DIAGNOSIS HISTORY ===', '')
                                .split('=== PATIENT EXTRA NOTE ===')[0]
                                .split(/(?=AI Assistant:|Patient:)/g)
                                .map((line, idx) => {
                                  const isAI = line.trim().startsWith('AI Assistant:');
                                  const isPatient = line.trim().startsWith('Patient:');
                                  
                                  if (!isAI && !isPatient) return null;

                                  const cleanText = line.replace('AI Assistant:', '').replace('Patient:', '').trim();

                                  return (
                                    <div 
                                      key={idx} 
                                      style={{
                                        display: 'flex',
                                        justifyContent: isAI ? 'flex-start' : 'flex-end',
                                        width: '100%'
                                      }}
                                    >
                                      <div style={{
                                        maxWidth: '85%',
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        backgroundColor: isAI ? '#ffffff' : '#e1f5ee',
                                        color: '#111b21',
                                        border: isAI ? '1px solid #e9edef' : 'none',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}>
                                        <strong style={{ 
                                          display: 'block', 
                                          fontSize: '10px', 
                                          color: isAI ? '#008069' : '#0f6e56', 
                                          marginBottom: 2,
                                          fontWeight: '700'
                                        }}>
                                          {isAI ? '🤖 WELLSY AI' : '👤 HASTA'}
                                        </strong>
                                        {cleanText}
                                      </div>
                                    </div>
                                  );
                                })
                            ) : (
                              <p style={{ fontSize: 12, margin: 0, color: '#333' }}>{appt.note}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {!appt.note && (
                        <p style={{ fontSize: 12, color: '#667781', fontStyle: 'italic', margin: '4px 0 0 0' }}>Bu hasta doğrudan randevu almıştır.</p>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DİNAMİK ALAN: Klinik Ziyaret Geçmişi */}
          {selectedPatient && (
            <div className="card" style={{ padding: 20, background: 'white', borderRadius: 8, borderTop: '4px solid #008069' }}>
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
                    onClick={() => handlePatientClick(p)}
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