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
app.use(cors())
app.use(express.json())

// SQL dosyasındaki şemaya tam uyumlu veri ekleme ve denetleme mekanizması
async function initDb() {
  try {
    // Şemaların init.sql ile birebir örtüştüğünden emin oluyoruz
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        initials TEXT,
        name TEXT NOT NULL UNIQUE,
        specialty TEXT,
        clinic TEXT,
        email TEXT UNIQUE,
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

    // SRS hiyerarşisindeki eksik Admin ve Staff kullanıcıları şemaya ekleniyor
    await pool.query(`
      INSERT INTO patients (name, tc, email, phone, role)
      VALUES 
        ('Mustafa Mert Cemil', '34567890123', 'mert@wellsy.com', '0535 111 22 33', 'Staff'),
        ('Sistem Yöneticisi', '45678901234', 'admin@wellsy.com', '0536 999 88 77', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `)

    console.log("PostgreSQL veritabanı bağlantısı ve şemaları başarıyla doğrulandı.")
  } catch (err) {
    console.error('Veritabanı senkronizasyon hatası:', err)
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL' })
})

// Doktorları listelerken tags zaten ARRAY (Dizi) olduğu için JSON.parse işlemine gerek kalmadı
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Yeni doktor eklerken tags bilgisini direkt PostgreSQL ARRAY formatında ($6 yerine {} veya array geçişi) kaydediyoruz
app.post('/api/doctors', async (req, res) => {
  const { initials='', name, specialty='', clinic='', email='', tags=[], date='', time='', visit='Online', visitIcon='ti-device-laptop', match_score=0, rating=0, stars='', avatarBg='#E1F5EE', avatarColor='#0F6E56' } = req.body
  if (!name) return res.status(400).json({ error: 'Doctor name is required.' })

  try {
    const result = await pool.query(`
      INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *
    `, [initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor])
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// SRS F7: Çift rezervasyonu engelleyen güvenli ortak randevu endpoint'i
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

    // Veri tipi uyuşmazlığını engellemek için appointment_date açıkça DATE tipine cast ediliyor
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

// SRS & SDD Uyumlu Birleşik Güvenli Giriş Endpoint'i
app.post('/api/auth/login', async (req, res) => {
  const { email, role } = req.body

  if (!email || !role) {
    return res.status(400).json({ error: 'E-posta adresi ve rol seçimi zorunludur.' })
  }

  try {
    if (role === 'doctor') {
      const result = await pool.query('SELECT id, name, email, specialty, clinic, \'doctor\' as role FROM doctors WHERE email = $1', [email])
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Bu e-postaya ait doktor kaydı bulunamadı.' })
      }
      return res.json({ user: result.rows[0] })
    } else {
      // Patient, Staff ve Admin rollerini küçük/büyük harf duyarlılığı olmadan eşleştirir
      const result = await pool.query('SELECT id, name, email, phone, tc, role FROM patients WHERE email = $1 AND LOWER(role) = $2', [email, role.toLowerCase()])
      if (result.rowCount === 0) {
        return res.status(404).json({ error: `Kayıtlı ${role} kullanıcısı bulunamadı. Lütfen bilgilerinizi kontrol edin.` })
      }
      return res.json({ user: result.rows[0] })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Giriş esnasında sistemsel bir hata oluştu.' })
  }
})

// Diğer standart API listeleme endpoint'leri
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

app.get('/api/doctors/:doctor_id/appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date::TEXT AS date, a.appointment_time AS time, a.type, a.status, a.note,
             p.id AS patient_id, p.name AS patient, p.email AS patient_email
      FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.doctor_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.params.doctor_id])
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use((req, res) => { res.status(404).json({ error: 'Not found' }) })

const start = async () => {
  await initDb()
  app.listen(PORT, () => { console.log(`Backend is running on port ${PORT}`) })
}
start().catch(err => { process.exit(1) })