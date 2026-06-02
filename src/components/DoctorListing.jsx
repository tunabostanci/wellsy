import { useEffect, useState } from 'react'

export default function DoctorListing({ chatHistory, onBack = () => {}, onContinue = () => {} }) {
  const [doctors, setDoctors] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:4000'

  useEffect(() => {
    const loadDoctorsAndScores = async () => {
      try {
        setLoading(true)
        setError('')
        let response;

        if (chatHistory && chatHistory.trim() !== '') {
          response = await fetch(`${API_URL}/api/chatbot/match-doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatHistory: chatHistory })
          })
        } else {
          response = await fetch(`${API_URL}/api/doctors`)
        }

        if (!response.ok) throw new Error('Doktor listesi ve AI puanları çekilemedi.')
        const data = await response.json()
        setDoctors(data)
        setSelectedIdx(null) 
      } catch (err) {
        setError('Doktor verileri analiz edilirken sistemsel bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctorsAndScores()
  }, [chatHistory])

  return (
    // CRITICAL FIXED: Sayfanın dış kapsayıcısının yüksekliği kilitlendi ve bağımsız dikey scroll (overflowY) aktif edildi.
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: 'calc(100vh - 60px)', boxSizing: 'border-box' }}>
      
      <div style={{ marginBottom: 20 }}>
        <h2>Available Doctors</h2>
        {chatHistory && chatHistory.trim() !== '' ? (
          <p className="text-sm" style={{ color: '#0F6E56', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0 0' }}>
            <i className="ti ti-sparkles" /> Semptomlarınız Wellsy AI tarafından analiz edildi. En uygun uzmanlar yukarıda listelenmektedir.
          </p>
        ) : (
          <p className="text-sm text-muted" style={{ margin: '4px 0 0 0' }}>Select a doctor to continue with your appointment booking.</p>
        )}
      </div>

      {loading && <div className="alert alert-info">Wellsy AI klinik veritabanı eşleşmelerini hesaplıyor...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Doktor Kartları Listesi Alanı */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {doctors.map((doc, i) => {
          const isSelected = selectedIdx === i;
          return (
            <div
              key={doc.id || i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--teal)' : '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--teal-light)' : 'white',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                minHeight: '82px',
                boxSizing: 'border-box'
              }}
              onClick={() => setSelectedIdx(i)}
            >
              {/* Sol Taraf: Sol Kulvar Profil ve Detayları */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div className="avatar" style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: doc.avatarBg || '#E1F5EE', color: doc.avatarColor || '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                  {doc.initials || 'DR'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#111b21' }}>{doc.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{doc.specialty} • <span className="text-muted">{doc.clinic}</span></div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {(doc.tags || []).map((tag, idx) => (
                      <span key={idx} className="tag" style={{ fontSize: 11, padding: '2px 8px', background: '#f0f2f5', borderRadius: '4px', color: '#667781' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sağ Taraf: AI Skor ve Dinamik Buton Alanı (İSTEDİĞİN ENTEGRASYON) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                
                {/* Skor ve Yıldız Bilgisi */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <span className="badge badge-teal" style={{ padding: '4px 8px', fontWeight: 600, fontSize: '12px' }}>
                    %{doc.match_score !== undefined ? doc.match_score : 100} match
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4, letterSpacing: '1px' }}>{doc.stars || '★★★★★'}</div>
                </div>

                {/* DİNAMİK YAN BUTON: Eğer bu karta tıklanmışsa, "Randevuya İlerle" aksiyonu doğrudan kartın içinde sağda belirir */}
                {isSelected && (
                  <button 
                    className="btn-primary btn" 
                    type="button"
                    style={{ 
                      height: '38px', 
                      padding: '0 16px', 
                      borderRadius: '19px', 
                      background: '#008069', 
                      border: 'none', 
                      color: 'white', 
                      fontSize: '13px', 
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,128,105,0.2)',
                      animation: 'fadeInRight 0.2s ease-in-out' // Hafif giriş animasyonu
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // Kartın kendi onClick'ini tetiklemesini engelleriz
                      onContinue(doctors[selectedIdx]);
                    }}
                  >
                    Randevuya İlerle <i className="ti ti-chevron-right" />
                  </button>
                )}
                
              </div>
            </div>
          )
        })}
      </div>

      {/* Alt Sabit Bar: Geri Dön Butonu Konumlandırması */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
        <button className="btn" type="button" onClick={onBack} style={{ padding: '8px 20px', borderRadius: '20px' }}>
          <i className="ti ti-chevron-left" /> Geri Dön
        </button>
      </div>

    </div>
  )
}