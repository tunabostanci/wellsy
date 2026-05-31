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

  const parseLlamaResponseText = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) {
      return 'Sunucudan boş yanıt alındı.'
    }

    const parsed = []
    for (const line of lines) {
      try {
        const partial = JSON.parse(line)
        if (typeof partial === 'object' && partial !== null) {
          if (typeof partial.response === 'string') {
            parsed.push(partial.response)
          } else if (typeof partial.text === 'string') {
            parsed.push(partial.text)
          } else if (partial.choices?.[0]?.text) {
            parsed.push(partial.choices[0].text)
          } else if (partial.choices?.[0]?.message?.content) {
            parsed.push(partial.choices[0].message.content)
          }
        }
      } catch (parseError) {
        parsed.push(line)
      }
    }

    if (parsed.length > 0) {
      return parsed.join('')
    }

    try {
      const full = JSON.parse(text)
      return (
        full?.response || full?.reply || full?.output || full?.text || full?.generated || full?.choices?.[0]?.text || full?.choices?.[0]?.message?.content || 'Sunucudan yanıt alınamadı.'
      )
    } catch {
      return 'Sunucudan beklenmeyen bir yanıt formatı alındı.'
    }
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

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

      if (!response.ok) {
        throw new Error(`LLaMA endpoint returned ${response.status}`)
      }

      const text = await response.text()
      const answer = parseLlamaResponseText(text)
      setMessages(prev => [...prev, { role: 'assistant', text: answer }])
    } catch (err) {
      console.error('LLaMA fetch error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Local Ollama HTTP sunucusuna bağlanamadı. `ollama serve` komutunu çalıştırıp `http://127.0.0.1:11434/api/generate` adresini doğrulayın.',
      }])
      setError('Ollama sunucusu çalışmıyor veya bağlantı reddedildi.')
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

  const buildSymptomPrompt = () => {
    const symptomLines = SYMPTOM_QUESTIONS.map(q => {
      const answer = symptomAnswers[q.key] || 'Not specified.'
      return `- ${q.label} ${answer}`
    }).join('\n')

    return `A patient has the following symptoms:\n${symptomLines}\n\nBased on these symptoms, provide a short, clear diagnosis in English only. If helpful, include a brief recommendation for what the patient should do next.`
  }

  const submitSymptoms = async () => {
    setSymptomLoading(true)
    setError('')
    const prompt = buildSymptomPrompt()

    try {
      const response = await fetch(LLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: LLAMA_MODEL, prompt }),
      })

      if (!response.ok) {
        throw new Error(`LLaMA endpoint returned ${response.status}`)
      }

      const text = await response.text()
      const answer = parseLlamaResponseText(text)
      setSymptomResult(answer)
      setMode('symptom-result')
    } catch (err) {
      console.error('LLaMA symptom fetch error:', err)
      setError('Semptom tahmini için Ollama servisine bağlanılamadı.')
    } finally {
      setSymptomLoading(false)
    }
  }

  const handleSymptomNext = () => {
    const trimmed = symptomInput.trim()
    if (!trimmed) {
      setError('Lütfen bir yanıt girin.')
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

  const resetSymptomCheck = () => {
    setMode('chat')
    setSymptomStep(0)
    setSymptomAnswers({})
    setSymptomInput('')
    setSymptomResult('')
    setError('')
  }

  return (
    <div className="chat-screen">
      <div className="chat-panel">
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div>
            <h1>Patient Chatbot</h1>
            <p className="text-sm text-muted">Aşağıdaki sekmelerden "Symptom checker" ile semptomlarınıza göre hastalık tahmini alabilirsiniz.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-sm${mode === 'chat' ? ' active' : ''}`} onClick={() => setMode('chat')}>
              Chat
            </button>
            <button type="button" className={`btn btn-sm${mode !== 'chat' ? ' active' : ''}`} onClick={startSymptomCheck}>
              Symptom checker
            </button>
            <button type="button" className="btn btn-sm" onClick={onNavigateToDoctors}>
              Browse doctors
            </button>
          </div>
        </div>

        {mode === 'chat' && (
          <>
            <div className="chat-window">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${message.role === 'assistant' ? 'assistant' : 'user'}`}
                >
                  <div className="chat-bubble">
                    <p>{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="chat-input-row">
              <input
                type="text"
                className="text-input"
                placeholder="Sorunuzu yazın..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <button className="btn-primary btn" onClick={sendMessage} disabled={loading || !input.trim()}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        )}

        {mode === 'symptom' && (
          <div className="symptom-checker" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Symptom Checker</div>
              <div className="text-sm text-muted mb-4">Aşağıdaki soruları yanıtlayın, ardından olası hastalığı tahmin edelim.</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{SYMPTOM_QUESTIONS[symptomStep].label}</div>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Cevabınızı yazın..."
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  disabled={symptomLoading}
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn-primary btn" onClick={handleSymptomNext} disabled={symptomLoading || !symptomInput.trim()}>
                {symptomStep + 1 < SYMPTOM_QUESTIONS.length ? 'Sonraki soru' : symptomLoading ? 'Tahmin ediliyor...' : 'Tahmini al'}
              </button>
            </div>
          </div>
        )}

        {mode === 'symptom-result' && (
          <div className="symptom-result" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Tahmin Sonucu</div>
              <div className="text-sm text-muted mb-4">Girilen semptomlara göre modelin önerdiği olası tanıyı aşağıda görebilirsiniz.</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{symptomResult}</div>
            </div>
            <button className="btn btn-sm" onClick={resetSymptomCheck}>
              Yeni semptom taraması başlat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
