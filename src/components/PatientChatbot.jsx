import { useState, useEffect, useRef } from 'react'

const SYMPTOM_QUESTIONS = [
  { key: 'duration', label: 'Belirtiler ne zamandır devam ediyor?' },
  { key: 'fever', label: 'Ateşiniz var mı? Varsa kaç derece civarında?' },
  { key: 'painLocation', label: 'Hangi bölgede rahatsızlık veya ağrı hissediyorsunuz?' },
  { key: 'cough', label: 'Öksürüğünüz var mı? Kuru mu, balgamlı mı?' },
  { key: 'other', label: 'Başka şikayetleriniz var mı? (baş ağrısı, mide bulantısı, halsizlik vb.)' },
]

const CRITICAL_SYMPTOMS = ['göğüs ağrısı', 'chest pain', 'nefes darlığı', 'şiddetli kanama', 'intihar', 'suicide', 'kalp krizi']

export default function PatientChatbot({ onNavigateToDoctors = () => {} }) {
  const [mode, setMode] = useState('chat')
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'Merhaba! Size nasıl yardımcı olabilirim? Semptomları kontrol etmek için "Symptom checker" düğmesine basabilirsiniz.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [symptomStep, setSymptomStep] = useState(0)
  const [symptomInput, setSymptomInput] = useState('')
  const [symptomAnswers, setSymptomAnswers] = useState({})
  const [symptomResult, setSymptomResult] = useState('')
  const [symptomLoading, setSymptomLoading] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const checkEmergencyStatus = (text) => {
    const lowerText = text.toLowerCase()
    return CRITICAL_SYMPTOMS.some(symptom => lowerText.includes(symptom))
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    if (checkEmergencyStatus(trimmed)) {
      setIsEmergency(true)
      return
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMessage = { role: 'user', text: trimmed, time: currentTime }
    const updatedMessages = [...messages, userMessage]
    
    setMessages(updatedMessages)
    setInput('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:4000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.ok) throw new Error("Sunucu yanıt vermedi.")
      const data = await response.json()
      
      if (checkEmergencyStatus(data.response)) {
        setIsEmergency(true)
        return
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.response, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Yapay zeka sunucusu şu an meşgul. Çevrimdışı form akışına geçiş yapabilirsiniz.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    const currentKey = SYMPTOM_QUESTIONS[symptomStep].key
    const newAnswers = { ...symptomAnswers, [currentKey]: trimmed }
    setSymptomAnswers(newAnswers)
    setSymptomInput('')
    setError('')

    if (symptomStep + 1 < SYMPTOM_QUESTIONS.length) {
      setSymptomStep(symptomStep + 1)
    } else {
      submitSymptoms(newAnswers)
    }
  }

  const submitSymptoms = async (finalAnswers) => {
    setSymptomLoading(true)
    setError('')
    setMode('symptom-result')

    const symptomLines = SYMPTOM_QUESTIONS.map(q => `- ${q.label} ${finalAnswers[q.key] || 'Belirtilmedi.'}`).join('\n')
    const systemPrompt = "You are an AI medical assistant. Provide a short clear diagnosis in Turkish and recommend a clinic."
    const pseudoMessages = [{ role: 'user', text: `Patient symptoms:\n${symptomLines}` }]

    try {
      const response = await fetch('http://localhost:4000/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: pseudoMessages, systemPrompt }),
      })

      if (!response.ok) throw new Error("Symptom analyzer failed.")
      const data = await response.json()
      setSymptomResult(data.response || 'Model bir tahmin üretemedi.')
    } catch (err) {
      console.error(err)
      setSymptomResult('Bağlantı hatası oluştu.')
    } finally {
      setSymptomLoading(false)
    }
  }

  const resetSymptomCheck = () => {
    setMode('chat')
    setSymptomStep(0)
    setSymptomAnswers({})
    setSymptomInput('')
    setSymptomResult('')
    setError('')
  }

  return (
    <div className="wa-chat-layout">
      {isEmergency && (
        <div className="emergency-fullscreen-overlay">
          <div className="emergency-box">
            <h2>⚠️ KRİTİK SAĞLIK UYARISI</h2>
            <p>Girdiğiniz semptomlar acil tıbbi müdahale gerektiriyor olabilir. Güvenliğiniz için randevu akışı durdurulmuştur.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href="tel:112" className="wa-btn-call">112'yi Ara</a>
              <button onClick={() => setIsEmergency(false)} className="wa-btn-close">Kapat</button>
            </div>
          </div>
        </div>
      )}

      <div className="wa-header">
        <div className="wa-avatar">W</div>
        <div className="wa-header-info">
          <h3>Wellsy Asistan</h3>
          <span>çevrimiçi</span>
        </div>
        <div className="wa-header-actions">
  <button type="button" className={`btn btn-sm${mode === 'chat' ? ' active' : ''}`} onClick={() => setMode('chat')}>Chat</button>
  <button type="button" className={`btn btn-sm${mode === 'symptom' ? ' active' : ''}`} onClick={startSymptomCheck}>Symptom checker</button>
  
  {/* GÜNCELLENEN DÜĞME: Doğrudan gitmek yerine konuşma geçmişini toplayıp gönderiyor */}
  <button 
    type="button" 
    className="btn btn-sm" 
    onClick={() => {
      // Mesaj geçmişindeki kullanıcı ve chatbot konuşmalarını alt alta ekleyip düz bir metin (string) yapıyoruz
      const chatSummary = messages
        .map(msg => `${msg.role === 'user' ? 'Patient' : 'AI Assistant'}: ${msg.text}`)
        .join('\n');
      
      // Üst bileşene (App.jsx'e) hem yönlendirme emrini hem de bu metni parametre olarak paslıyoruz
      onNavigateToDoctors(chatSummary);
    }}
  >
    New Appointment
  </button>
</div>
      </div>

      <div className="wa-chat-window">
        {mode === 'chat' && (
          <>
            {messages.map((msg, index) => (
              <div key={index} className={`wa-message-row ${msg.role === 'user' ? 'wa-sent' : 'wa-received'}`}>
                <div className="wa-bubble">
                  <p>{msg.text}</p>
                  <span className="wa-time">{msg.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="wa-message-row wa-received">
                <div className="wa-bubble wa-loading-bubble">
                  <span className="wa-dot"></span>
                  <span className="wa-dot"></span>
                  <span className="wa-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {mode === 'symptom' && (
          <div className="wa-form-container">
            <div className="card" style={{ padding: 20, width: '100%', maxWidth: 450 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{SYMPTOM_QUESTIONS[symptomStep].label}</div>
              <input
                type="text" className="text-input" placeholder="Cevabınızı buraya yazın..."
                value={symptomInput} onChange={e => setSymptomInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSymptomNext()}
              />
              {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
              <button className="btn-primary btn" style={{ marginTop: 14, width: '100%' }} onClick={handleSymptomNext} disabled={!symptomInput.trim()}>
                {symptomStep + 1 < SYMPTOM_QUESTIONS.length ? 'Sonraki Soru' : 'Tahmini Al'}
              </button>
            </div>
          </div>
        )}

        {mode === 'symptom-result' && (
          <div className="wa-form-container">
            <div className="card" style={{ padding: 20, width: '100%', maxWidth: 450 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'var(--teal-dark)' }}>Semptom Analiz Sonucu</div>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14 }}>
                {symptomLoading ? "Yapay zeka verileri analiz ediyor..." : symptomResult}
              </p>
              <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={resetSymptomCheck} disabled={symptomLoading}>Yeni Tarama Başlat</button>
            </div>
          </div>
        )}
      </div>

      {mode === 'chat' && (
        <div className="wa-footer">
          <input
            type="text" placeholder="Mesaj yazın..." value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading || isEmergency}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim() || isEmergency}>
            <i className="ti ti-send" />
          </button>
        </div>
      )}
    </div>
  )
}