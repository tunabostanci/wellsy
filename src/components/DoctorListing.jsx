import { useEffect, useState } from 'react'

export default function DoctorListing({ onBack = () => {}, onContinue = () => {} }) {
  const [doctors, setDoctors] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:4000'

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/doctors`)
        if (!response.ok) throw new Error('Doktor listesi çekilemedi.')
        setDoctors(await response.json())
      } catch (err) {
        setError('Doktor verileri çekilirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    loadDoctors()
  }, [])

  return (
    <div className="screen-content" style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h2>Available Doctors</h2>
      <p className="text-sm text-muted mb-4">Select a doctor to continue with your appointment booking.</p>

      {loading && <div className="alert alert-info">Veritabanından doktorlar yükleniyor...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="flex-col gap-3" style={{ marginBottom: 24 }}>
        {doctors.map((doc, i) => (
          <div
            key={doc.id || i}
            className={`card doctor-card flex justify-between items-center`}
            style={{
              padding: 16, cursor: 'pointer',
              border: selectedIdx === i ? '2px solid var(--teal)' : '1px solid var(--border)',
              backgroundColor: selectedIdx === i ? 'var(--teal-light)' : 'white', borderRadius: '8px'
            }}
            onClick={() => setSelectedIdx(i)}
          >
            <div className="flex gap-3 items-center">
              <div className="avatar" style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: doc.avatarBg || '#E1F5EE', color: doc.avatarColor || '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {doc.initials || 'DR'}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{doc.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{doc.specialty} • <span className="text-muted">{doc.clinic}</span></div>
                <div className="flex gap-1 flex-wrap" style={{ marginTop: 6 }}>
                  {(doc.tags || []).map((tag, idx) => (
                    <span key={idx} className="tag" style={{ fontSize: 11, padding: '2px 8px', background: '#f0f2f5', borderRadius: '4px' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-col items-end" style={{ flexShrink: 0 }}>
              <span className="badge badge-teal">{doc.match_score || 100}% match</span>
              <div style={{ fontSize: 13, color: 'var(--amber)', marginTop: 4 }}>{doc.stars || '★★★★★'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={onBack}>Geri Dön</button>
        <button 
          className="btn-primary btn" 
          disabled={selectedIdx === null} 
          onClick={() => onContinue(doctors[selectedIdx])} // CRITICAL: Seçilen tam doktor nesnesi paslanıyor
        >
          Randevuya İlerle
        </button>
      </div>
    </div>
  )
}