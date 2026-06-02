import { useState } from 'react'

const DEFAULT_LLAMA_ENDPOINT = 'http://127.0.0.1:11434/api/generate'
const DEFAULT_LLAMA_MODEL = 'llama3'
const LLAMA_ENDPOINT = import.meta.env.VITE_LLAMA_ENDPOINT || DEFAULT_LLAMA_ENDPOINT
const LLAMA_MODEL = import.meta.env.VITE_LLAMA_MODEL || DEFAULT_LLAMA_MODEL

const SYMPTOM_QUESTIONS = [
  { key: 'duration', label: 'Belirtiler ne zamandır devam ediyor?' },
  { key: 'fever', label: 'Ateşiniz var mı? Varsa kaç derece civarında?' },
  { key: 'painLocation', label: 'Hangi bölgede rahatsızlık veya ağrı hissediyorsunuz?' },
  { key: 'cough', label: 'Öksürüğünüz var mı? Kuru mu, balgamlı mı?' },
  { key: 'other', label: 'Başka şikayetleriniz var mı? (baş ağrısı, mide bulantısı, halsizlik vb.)' },
]

// SRS UI-04: Acil Durum Kelime Veritabanı
const CRITICAL_SYMPTOMS = ['göğüs ağrısı', 'chest pain', 'nefes darlığı', 'şiddetli kanama', 'intihar', 'suicide', 'kalp krizi']

export default function PatientChatbot({ onNavigateToDoctors = () => {} }) {
  const [mode, setMode] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Merhaba! Size nasıl yardımcı olabilirim? Semptomları kontrol etmek için "Symptom checker" düğmesine basabilirsiniz.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [symptomStep, setSymptomStep] = useState(0)
  const [symptomInput, setSymptomInput] = useState('')
  const [symptomAnswers, setSymptomAnswers] = useState({})
  const [symptomResult, setSymptomResult] = useState('')
  const [symptomLoading, setSymptomLoading] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false) // Acil durum arayüz kontrolü

  // SRS F1 / UI-04 Safety Controller: Acil Durum Tarama Algoritması
  const checkEmergencyStatus = (text) => {
    const lowerText = text.toLowerCase()
    return CRITICAL_SYMPTOMS.some(symptom => lowerText.includes(symptom))
  }

  const parseLlamaResponseText = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return 'Sunucudan boş yanıt alındı.'
    const parsed = []
    for (const line of lines) {
      try {
        const partial = JSON.parse(line)
        if (typeof partial === 'object' && partial !== null) {
          if (partial.response) parsed.push(partial.response)
        }
      } catch { parsed.push(line) }
    }
    return parsed.length > 0 ? parsed.join('') : text
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    // Canlı Giriş Kontrolü
    if (checkEmergencyStatus(trimmed)) {
      setIsEmergency(true)
      return
    }

    const userMessage = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(LLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: LLAMA_MODEL, prompt: trimmed }),
      })
      const text = await response.text()
      const answer = parseLlamaResponseText(text)
      
      if (checkEmergencyStatus(answer)) {
        setIsEmergency(true)
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Yapay zeka servis gecikmesi nedeniyle sistem form tabanlı yedek akışa (Fallback UI) geçiş yapmıştır. Lütfen sağ üstten "Symptom checker" modülünü kullanın.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const startSymptomCheck = () => {
    setMode('symptom')
    setSymptomStep(0)
    setSymptomInput('')
    setSymptomAnswers({})
    setSymptomResult('')
    setError('')
  }

  const handleSymptomNext = () => {
    const trimmed = symptomInput.trim()
    if (!trimmed) {
      setError('Lütfen bir yanıt girin.')
      return
    }

    if (checkEmergencyStatus(trimmed)) {
      setIsEmergency(true)
      return
    }

    setSymptomAnswers(prev => ({ ...prev, [SYMPTOM_QUESTIONS[symptomStep].key]: trimmed }))
    setSymptomInput('')
    setError('')
    if (symptomStep + 1 < SYMPTOM_QUESTIONS.length) {
      setSymptomStep(symptomStep + 1)
    } else {
      submitSymptoms()
    }
  }

  const submitSymptoms = async () => {
    setSymptomLoading(true)
    setError('')
    
    const symptomLines = SYMPTOM_QUESTIONS.map(q => `- ${q.label} ${symptomAnswers[q.key] || 'Belirtilmedi.'}`).join('\n')
    const prompt = `Patient health assessment metrics:\n${symptomLines}\n\nProvide diagnostic specialty fields in English.`

    try {
      const response = await fetch(LLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: LLAMA_MODEL, prompt }),
      })
      const text = await response.text()
      const answer = parseLlamaResponseText(text)
      setSymptomResult(answer)
      setMode('symptom-result')
    } catch (err) {
      setError('Ollama servisine bağlanılamadı. Yedek form girişi aktif.')
    } finally {
      setSymptomLoading(false)
    }
  }

  return (
    <div className="chat-screen" style={{ position: 'relative' }}>
      
      {/* SRS UI-04: Acil Durum Kırmızı Ekran Modalı */}
      {isEmergency && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(220, 53, 69, 0.95)', color: 'white', zIndex: 9999,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          padding: 30, textAlign: 'center', borderRadius: 'var(--r-lg)'
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 64, marginBottom: 20 }} />
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>⚠️ KRİTİK SAĞLIK UYARISI</h2>
          <p style={{ maxWidth: 400, fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
            Girdiğiniz semptomlar acil tıbbi müdahale gerektiren hayati riskler barındırıyor olabilir. Güvenliğiniz için sistem randevu akışını askıya almıştır.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="tel:112" style={{
              background: 'white', color: '#dc3545', padding: '12px 30px',
              borderRadius: 'var(--r-md)', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>112 ACİL ÇAĞRI</a>
            <button onClick={() => setIsEmergency(false)} style={{
              background: 'transparent', border: '1px solid white', color: 'white',
              padding: '12px 20px', borderRadius: 'var(--r-md)', cursor: 'pointer'
            }}>Kapat</button>
          </div>
        </div>
      )}

      <div className="chat-panel">
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h1>Patient Chatbot</h1>
            <p className="text-sm text-muted">Semptomlarınıza göre akıllı analiz alabilir veya doğrudan randevuya geçebilirsiniz.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-sm${mode === 'chat' ? ' active' : ''}`} onClick={() => setMode('chat')} disabled={isEmergency}>Chat</button>
            <button type="button" className={`btn btn-sm${mode !== 'chat' ? ' active' : ''}`} onClick={startSymptomCheck} disabled={isEmergency}>Symptom checker</button>
            <button type="button" className="btn btn-sm" onClick={onNavigateToDoctors} disabled={isEmergency}>Browse doctors</button>
          </div>
        </div>

        {mode === 'chat' && (
          <>
            <div className="chat-window">
              {messages.map((message, index) => (
                <div key={index} className={`chat-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}>
                  <div className="chat-bubble"><p>{message.text}</p></div>
                </div>
              ))}
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="chat-input-row">
              <input
                type="text" className="text-input" placeholder="Sorunuzu yazın..."
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={loading || isEmergency}
              />
              <button className="btn-primary btn" onClick={sendMessage} disabled={loading || !input.trim() || isEmergency}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}

        {mode === 'symptom' && (
          <div className="symptom-checker" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Symptom Checker</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{SYMPTOM_QUESTIONS[symptomStep].label}</div>
                <input
                  type="text" className="text-input" placeholder="Cevabınızı yazın..."
                  value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSymptomNext()} disabled={symptomLoading || isEmergency}
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn-primary btn" onClick={handleSymptomNext} disabled={symptomLoading || !symptomInput.trim() || isEmergency}>
                {symptomStep + 1 < SYMPTOM_QUESTIONS.length ? 'Sonraki soru' : 'Tahmini al'}
              </button>
            </div>
          </div>
        )}

        {mode === 'symptom-result' && (
          <div className="symptom-result" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Tahmin Sonucu</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{symptomResult}</div>
            </div>
            <button className="btn btn-sm" onClick={resetSymptomCheck}>Yeni semptom taraması başlat</button>
          </div>
        )}
      </div>
    </div>
  )
}