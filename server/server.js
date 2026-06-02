import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg
const PORT = process.env.PORT || 4000

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/pharmastock'
})

const app = express()

// CORS Ayarları
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Veritabanı Şeması ve Başlatma (initDb)
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        initials TEXT,
        name TEXT NOT NULL UNIQUE,
        specialty TEXT,
        clinic TEXT,
        email TEXT UNIQUE,
        password TEXT DEFAULT 'wellsy123',
        tags TEXT[],
        date TEXT,
        time TEXT,
        visit TEXT,
        visitIcon TEXT,
        match_score INTEGER,
        rating NUMERIC(3,1),
        stars TEXT,
        avatarBg TEXT,
        avatarColor TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        tc TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT DEFAULT 'wellsy123',
        phone TEXT,
        role TEXT DEFAULT 'Patient',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_doctor_app_slot UNIQUE (doctor_id, appointment_date, appointment_time)
      );
    `)

    // Varsayılan Kullanıcı Tohumlamaları (Seed)
    await pool.query(`
      INSERT INTO patients (name, tc, email, password, phone, role)
      VALUES 
        ('Mustafa Mert Cemil', '34567890123', 'mert@wellsy.com', 'staff123', '0535 111 22 33', 'Staff'),
        ('Sistem Yöneticisi', '45678901234', 'admin@wellsy.com', 'admin123', '0536 999 88 77', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `)

    console.log("PostgreSQL şemaları ve şifreli kimlik doğrulaması başarıyla senkronize edildi.")
  } catch (err) {
    console.error('Veritabanı senkronizasyon hatası:', err)
  }
}

// Sağlık Kontrolü (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL' })
})

// 1. HASTALARI LİSTELEME
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, tc, email, phone, role FROM patients ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 2. DOKTORLARI LİSTELEME
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors ORDER BY id')
    const parsedDoctors = result.rows.map(d => ({
      ...d,
      tags: Array.isArray(d.tags) ? d.tags : []
    }))
    res.json(parsedDoctors)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 3. ADMIN: DOKTOR HESABI OLUŞTURMA
app.post('/api/admin/create-doctor', async (req, res) => {
  const { name, specialty, clinic, email, password, tags = [] } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'İsim, e-posta ve şifre zorunludur.' })

  try {
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const result = await pool.query(`
      INSERT INTO doctors (initials, name, specialty, clinic, email, password, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 100, 5.0, '★★★★★', '#E1F5EE', '#0F6E56') RETURNING id, name, email
    `, [initials, name, specialty, clinic, email, password, tags])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: 'Bu e-posta adresiyle bir doktor zaten mevcut.' })
  }
})

// 4. ADMIN: STAFF/ADMIN OLUŞTURMA
app.post('/api/admin/create-staff', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Tüm alanlar zorunludur.' })

  try {
    const result = await pool.query(`
      INSERT INTO patients (name, email, password, role) 
      VALUES ($1, $2, $3, $4) RETURNING id, name, email, role
    `, [name, email, password, role])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut.' })
  }
})

// 5. TÜM RANDEVULARI LİSTELEME (StaffPanel için)
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date::TEXT AS date, a.appointment_time AS time, a.type, a.status, a.note,
             p.id AS patient_id, p.name AS patient, p.email AS patient_email, p.phone AS patient_phone,
             d.id AS doctor_id, d.name AS doctor, d.specialty AS doctor_specialty
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN doctors d ON d.id = a.doctor_id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 6. YENİ RANDEVU KAYDETME (Parantezleri İzole Edilmiş ve Düzeltilmiş Hali)
app.post('/api/appointments', async (req, res) => {
  const { patient_name, patient_tc = '', patient_email = '', doctor_name, appointment_date, appointment_time, type = 'Online', note = '' } = req.body

  if (!patient_name || !patient_email || !doctor_name || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Eksik randevu bilgileri gönderildi.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const doctorResult = await client.query('SELECT id FROM doctors WHERE name = $1 FOR UPDATE', [doctor_name])
    if (doctorResult.rowCount === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Doktor bulunamadı.' })
    }
    const doctor_id = doctorResult.rows[0].id

    const slotCheck = await client.query(
      'SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2::DATE AND appointment_time = $3',
      [doctor_id, appointment_date, appointment_time]
    )
    if (slotCheck.rowCount > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Bu randevu saati az önce başka bir hasta tarafından dolduruldu.' })
    }

    let patientResult = await client.query('SELECT id FROM patients WHERE email = $1 LIMIT 1', [patient_email])
    let patient_id = patientResult.rowCount > 0 ? patientResult.rows[0].id : null

    if (!patient_id) {
      const insertPatient = await client.query(
        `INSERT INTO patients (name, tc, email, role) VALUES ($1, $2, $3, 'Patient') RETURNING id`,
        [patient_name, patient_tc, patient_email]
      )
      patient_id = insertPatient.rows[0].id
    }

    const appointmentResult = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, note) VALUES ($1, $2, $3::DATE, $4, $5, $6) RETURNING id`,
      [patient_id, doctor_id, appointment_date, appointment_time, type, note]
    )

    await client.query('COMMIT')
    res.status(201).json({ success: true, id: appointmentResult.rows[0].id })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// 7. SİSTEME GİRİŞ YAPMA (LOGIN)
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'E-posta, şifre ve rol alanları zorunludur.' })
  }

  try {
    if (role === 'doctor') {
      const result = await pool.query('SELECT id, name, email, password, specialty, clinic, \'doctor\' as role FROM doctors WHERE email = $1', [email.trim()])
      if (result.rowCount === 0 || result.rows[0].password !== password) {
        return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı.' })
      }
      return res.json({ user: result.rows[0] })
    } else {
      const result = await pool.query('SELECT id, name, email, password, phone, tc, role FROM patients WHERE email = $1 AND LOWER(role) = $2', [email.trim(), role.toLowerCase()])
      if (result.rowCount === 0 || result.rows[0].password !== password) {
        return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı.' })
      }
      return res.json({ user: result.rows[0] })
    }
  } catch (err) {
    res.status(500).json({ error: 'Sistemsel giriş hatası.' })
  }
})

// 8. HASTANIN KENDİ RANDEVULARINI LİSTELEME
app.get('/api/patients/:patient_id/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date::TEXT AS date, a.appointment_time AS time, a.type, a.status, a.note,
             d.id AS doctor_id, d.name AS doctor, d.specialty AS doctor_specialty, d.clinic
      FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.patient_id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 9. DOKTORUN KENDİ RANDEVULARINI LİSTELEME
app.get('/api/doctors/:doctor_id/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date::TEXT AS date, a.appointment_time AS time, a.type, a.status, a.note,
             p.id AS patient_id, p.name AS patient, p.email AS patient_email, p.phone AS patient_phone
      FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.doctor_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.doctor_id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 10. DOKTORUN KENDİ HASTALARINI LİSTELEME
app.get('/api/doctors/:doctor_id/patients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT p.id, p.name, p.email, p.phone, p.tc 
      FROM patients p
      JOIN appointments a ON a.patient_id = p.id 
      WHERE a.doctor_id = $1 
      ORDER BY p.name
    `, [req.params.doctor_id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 11. BAĞLAM KORUMALI CHATBOT TÜNELİ
app.post('/api/chatbot/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Mesaj geçmişi dizi olarak gönderilmelidir.' });
  }

  try {
    const OLLAMA_CHAT_URL = 'http://host.docker.internal:11434/api/chat';
    const MODEL = process.env.VITE_LLAMA_MODEL || 'llama3';
    const ollamaMessages = [];
    
    if (systemPrompt) {
      ollamaMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach(msg => {
      ollamaMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      });
    });

    const response = await fetch(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: ollamaMessages, stream: false })
    });

    if (!response.ok) throw new Error(`Ollama hatası: ${response.status}`);
    const data = await response.json();
    res.json({ response: data.message.content });

  } catch (err) {
    console.error('Chatbot tünel hatası:', err.message);
    res.status(200).json({ 
      response: "Yapay zeka bağlantısında bir gecikme yaşanıyor. Semptomlarınızı iletmek için lütfen sağ üstteki 'Symptom checker' form modülünü manuel doldurarak ilerleyiniz." 
    });
  }
});

// 12. SIFIRDAN HASTA KAYIT ETME (SIGN UP)
app.post('/api/patients', async (req, res) => {
  const { name, tc = null, email, password, phone = null } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'İsim, e-posta ve şifre alanları zorunludur.' });

  try {
    const checkEmail = await pool.query('SELECT id FROM patients WHERE email = $1', [email.trim()]);
    if (checkEmail.rowCount > 0) return res.status(409).json({ error: 'Bu e-posta adresiyle daha önce kayıt olunmuş.' });

    if (tc) {
      const checkTc = await pool.query('SELECT id FROM patients WHERE tc = $1', [tc.trim()]);
      if (checkTc.rowCount > 0) return res.status(409).json({ error: 'Bu TC Kimlik numarasıyla daha önce kayıt olunmuş.' });
    }

    const result = await pool.query(
      `INSERT INTO patients (name, tc, email, password, phone, role) VALUES ($1, $2, $3, $4, $5, 'Patient') RETURNING id, name, email, role`,
      [name.trim(), tc ? tc.trim() : null, email.trim(), password, phone ? phone.trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Kayıt işlemi sırasında veritabanı hatası oluştu.' });
  }
});

// 404 Koruması ve Sunucu Tetikleme
app.use((req, res) => { res.status(404).json({ error: 'Not found' }) })

const start = async () => {
  await initDb()
  app.listen(PORT, () => { console.log(`Backend is running on port ${PORT}`) })
}
start().catch(err => { process.exit(1) })