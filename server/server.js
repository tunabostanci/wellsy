import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { Pool } from 'pg'

config()

const PORT = process.env.PORT || 4000
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pharmastock'

const pool = new Pool({ connectionString: DATABASE_URL })
const app = express()

app.use(cors())
app.use(express.json())

const defaultDoctors = [
  {
    initials: 'AK',
    name: 'Dr. Ayşe Kaya',
    specialty: 'Clinical Psychologist',
    clinic: 'İstanbul Psikoloji Kliniği',
    email: 'ayse.kaya@wellsy.com',
    tags: ['Anxiety disorders', 'CBT', 'Stress management'],
    date: '13 May',
    time: '14:00',
    visit: 'Online',
    visitIcon: 'ti-device-laptop',
    match_score: 95,
    rating: 4.9,
    stars: '★★★★★',
    avatarBg: '#E1F5EE',
    avatarColor: '#0F6E56',
  },
  {
    initials: 'MY',
    name: 'Dr. Mehmet Yılmaz',
    specialty: 'Psychiatrist',
    clinic: 'Ruh Sağlığı Merkezi, Ankara',
    email: 'mehmet.yilmaz@wellsy.com',
    tags: ['Anxiety', 'Depression', 'Group therapy'],
    date: '12 May',
    time: '16:30',
    visit: 'In-person',
    visitIcon: 'ti-users',
    match_score: 88,
    rating: 4.8,
    stars: '★★★★☆',
    avatarBg: '#E6F1FB',
    avatarColor: '#185FA5',
  },
  {
    initials: 'ZD',
    name: 'Dr. Zeynep Demir',
    specialty: 'Clinical Psychologist',
    clinic: 'İstanbul Psikoloji Kliniği',
    email: 'zeynep.demir@wellsy.com',
    tags: ['Stress management', 'Mindfulness', 'Sleep therapy'],
    date: '14 May',
    time: '10:00',
    visit: 'Online',
    visitIcon: 'ti-device-laptop',
    match_score: 82,
    rating: 4.7,
    stars: '★★★★☆',
    avatarBg: '#FAEEDA',
    avatarColor: '#854F0B',
  },
]

const defaultPatients = [
  { name: 'Tuna B.', tc: '12345678901', email: 'tuna.b@example.com', phone: '0533 555 66 77' },
  { name: 'Elif K.', tc: '23456789012', email: 'elif.k@example.com', phone: '0532 444 55 66' },
]

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      initials TEXT,
      name TEXT NOT NULL UNIQUE,
      specialty TEXT,
      clinic TEXT,
      email TEXT,
      tags TEXT[],
      date TEXT,
      time TEXT,
      visit TEXT,
      visitIcon TEXT,
      match_score INTEGER,
      rating NUMERIC,
      stars TEXT,
      avatarBg TEXT,
      avatarColor TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
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
    )
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  for (const doctor of defaultDoctors) {
    await pool.query(
      `INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (name) DO NOTHING`,
      [
        doctor.initials,
        doctor.name,
        doctor.specialty,
        doctor.clinic,
        doctor.email,
        doctor.tags,
        doctor.date,
        doctor.time,
        doctor.visit,
        doctor.visitIcon,
        doctor.match_score,
        doctor.rating,
        doctor.stars,
        doctor.avatarBg,
        doctor.avatarColor,
      ]
    )
  }

  for (const patient of defaultPatients) {
    await pool.query(
      `INSERT INTO patients (name, tc, email, phone)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO NOTHING`,
      [patient.name, patient.tc, patient.email, patient.phone]
    )
  }

  await pool.query(`
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, note)
    SELECT p.id, d.id, '2026-06-01', '15:00', 'Online', 'Confirmed', 'Follow-up consultation'
    FROM patients p
    JOIN doctors d ON d.email = 'ayse.kaya@wellsy.com'
    WHERE p.email = 'elif.k@example.com'
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.patient_id = p.id
          AND a.doctor_id = d.id
          AND a.appointment_date = '2026-06-01'
          AND a.appointment_time = '15:00'
      )
  `)
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: DATABASE_URL })
})

app.get('/api/doctors', async (req, res) => {
  const result = await pool.query('SELECT * FROM doctors ORDER BY id')
  res.json(result.rows)
})

app.post('/api/doctors', async (req, res) => {
  const {
    initials = '',
    name,
    specialty = '',
    clinic = '',
    email = '',
    tags = [],
    date = '',
    time = '',
    visit = 'Online',
    visitIcon = 'ti-device-laptop',
    match_score = 0,
    rating = 0,
    stars = '',
    avatarBg = '#E1F5EE',
    avatarColor = '#0F6E56',
  } = req.body

  if (!name) {
    return res.status(400).json({ error: 'Doctor name is required.' })
  }

  const result = await pool.query(
    `INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      initials,
      name,
      specialty,
      clinic,
      email,
      tags,
      date,
      time,
      visit,
      visitIcon,
      match_score,
      rating,
      stars,
      avatarBg,
      avatarColor,
    ]
  )

  res.status(201).json(result.rows[0])
})

app.get('/api/patients', async (req, res) => {
  const result = await pool.query('SELECT * FROM patients ORDER BY id')
  res.json(result.rows)
})

app.post('/api/patients', async (req, res) => {
  const { name, tc = '', email = '', phone = '', role = 'Patient' } = req.body
  if (!name || !email) {
    return res.status(400).json({ error: 'Patient name and email are required.' })
  }

  const result = await pool.query(
    `INSERT INTO patients (name, tc, email, phone, role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [name, tc, email, phone, role]
  )

  res.status(201).json(result.rows[0])
})

app.get('/api/appointments', async (req, res) => {
  const result = await pool.query(`
    SELECT a.id, a.appointment_date AS date, a.appointment_time AS time, a.type, a.status, a.note,
           p.id AS patient_id, p.name AS patient, p.email AS patient_email, p.phone AS patient_phone,
           d.id AS doctor_id, d.name AS doctor, d.specialty AS doctor_specialty
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `)
  res.json(result.rows)
})

app.post('/api/appointments', async (req, res) => {
  const {
    patient_name,
    patient_tc = '',
    patient_email = '',
    patient_phone = '',
    doctor_name,
    appointment_date,
    appointment_time,
    type = 'Online',
    note = '',
  } = req.body

  if (!patient_name || !patient_email || !doctor_name || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'Patient name, patient email, doctor, date and time are required.' })
  }

  const doctorResult = await pool.query('SELECT id FROM doctors WHERE name = $1', [doctor_name])
  if (doctorResult.rowCount === 0) {
    return res.status(404).json({ error: 'Doctor not found.' })
  }

  const doctor_id = doctorResult.rows[0].id
  let patientResult = await pool.query('SELECT id FROM patients WHERE email = $1 OR name = $2 LIMIT 1', [patient_email, patient_name])
  let patient_id

  if (patientResult.rowCount > 0) {
    patient_id = patientResult.rows[0].id
  } else {
    const insertPatient = await pool.query(
      `INSERT INTO patients (name, tc, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [patient_name, patient_tc, patient_email, patient_phone]
    )
    patient_id = insertPatient.rows[0].id
  }

  const appointmentResult = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [patient_id, doctor_id, appointment_date, appointment_time, type, note]
  )

  const result = await pool.query(`
    SELECT a.id, a.appointment_date AS date, a.appointment_time AS time, a.type, a.status, a.note,
           p.name AS patient, p.email AS patient_email, p.phone AS patient_phone,
           d.name AS doctor, d.specialty AS doctor_specialty
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    WHERE a.id = $1
  `, [appointmentResult.rows[0].id])

  res.status(201).json(result.rows[0])
})

// Doctor login
app.post('/api/doctor-login', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' })
  }

  try {
    const result = await pool.query('SELECT id, name, email, specialty, clinic FROM doctors WHERE email = $1', [email])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Doctor not found. Please check your email.' })
    }

    const doctor = result.rows[0]
    res.json({ doctor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unable to log in.' })
  }
})

// Patient login
app.post('/api/patient-login', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' })
  }

  try {
    const result = await pool.query('SELECT id, name, email, phone, tc, role FROM patients WHERE email = $1', [email])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Patient not found. Please check your email.' })
    }

    const patient = result.rows[0]
    res.json({ patient })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unable to log in.' })
  }
})

// Get doctor's patients (doctors can only see their own patients)
app.get('/api/doctors/:doctor_id/patients', async (req, res) => {
  const { doctor_id } = req.params

  try {
    const result = await pool.query(`
      SELECT DISTINCT p.id, p.name, p.email, p.phone, p.tc
      FROM patients p
      JOIN appointments a ON a.patient_id = p.id
      WHERE a.doctor_id = $1
      ORDER BY p.name
    `, [doctor_id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unable to load patients.' })
  }
})

// Get patient's appointments
app.get('/api/patients/:patient_id/appointments', async (req, res) => {
  const { patient_id } = req.params

  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date AS date, a.appointment_time AS time, a.type, a.status, a.note,
             d.id AS doctor_id, d.name AS doctor, d.specialty AS doctor_specialty, d.clinic, d.email AS doctor_email
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [patient_id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unable to load appointments.' })
  }
})

// Get doctor's appointments
app.get('/api/doctors/:doctor_id/appointments', async (req, res) => {
  const { doctor_id } = req.params

  try {
    const result = await pool.query(`
      SELECT a.id, a.appointment_date AS date, a.appointment_time AS time, a.type, a.status, a.note,
             p.id AS patient_id, p.name AS patient, p.email AS patient_email, p.phone AS patient_phone
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      WHERE a.doctor_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [doctor_id])

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Unable to load appointments.' })
  }
})

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const start = async () => {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Backend is running on port ${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start backend', err)
  process.exit(1)
})
