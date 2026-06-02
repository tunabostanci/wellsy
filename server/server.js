import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import pg from 'pg'

config()

const { Pool } = pg
const PORT = process.env.PORT || 4000

// Orijinal bağlantı ayarlarınız korundu (wellsy_db şemasına yönlendirildi)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@db:5432/wellsy_db'
})

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Veritabanı ve tablo ilklendirme kontrolü
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
  } else {
    console.log('Wellsy Veritabanı bağlantısı başarılı:', res.rows[0].now);
  }
});

// 1. KULLANICI GİRİŞİ (LOGIN)
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'E-posta, şifre ve rol alanları zorunludur.' });
  }

  try {
    const targetEmail = email.trim().toLowerCase();
    const targetRole = role.trim().toLowerCase();
    let result;

    if (targetRole === 'doctor') {
      result = await pool.query('SELECT id, name, email, password, specialty, clinic, \'doctor\' as role FROM doctors WHERE LOWER(email) = $1', [targetEmail]);
    } else {
      // Admin, staff veya patient rollerini harf duyarsız olarak kontrol eder
      result = await pool.query('SELECT id, name, email, password, role FROM patients WHERE LOWER(email) = $1 AND LOWER(role) = $2', [targetEmail, targetRole]);
    }

    if (result.rowCount === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ error: 'Hatalı e-posta veya şifre girdiniz.' });
    }

    const user = result.rows[0];
    delete user.password; // Güvenlik için şifreyi ön yüze göndermiyoruz
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Giriş yapılırken sunucu hatası oluştu.' });
  }
});

// 2. SIFIRDAN HASTA KAYIT ETME (SIGN UP)
app.post('/api/patients', async (req, res) => {
  const { name, tc, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'İsim, e-posta ve şifre alanları zorunludur.' });
  }

  try {
    const targetEmail = email.trim().toLowerCase();

    const checkEmail = await pool.query('SELECT id FROM patients WHERE LOWER(email) = $1', [targetEmail]);
    if (checkEmail.rowCount > 0) {
      return res.status(409).json({ error: 'Bu e-posta adresiyle daha önce kayıt olunmuş.' });
    }

    const result = await pool.query(
      `INSERT INTO patients (name, tc, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5, 'Patient') RETURNING id, name, email, role`,
      [name.trim(), tc ? tc.trim() : null, targetEmail, password, phone ? phone.trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayıt esnasında sunucu hatası oluştu.' });
  }
});

// 3. ADMIN ÖZEL: FRONTEND'DEN GELEN DOKTOR OLUŞTURMA İSTEĞİ (CRITICAL FIXED)
app.post('/api/admin/create-doctor', async (req, res) => {
  const { name, specialty, clinic, email, password, tags } = req.body;
  try {
    const targetEmail = email.trim().toLowerCase();
    
    const checkEmail = await pool.query('SELECT id FROM doctors WHERE LOWER(email) = $1', [targetEmail]);
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({ error: 'Bu e-posta adresiyle bir doktor zaten mevcut.' });
    }

    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const result = await pool.query(
      `INSERT INTO doctors (initials, name, specialty, clinic, email, password, tags, match_score, rating, stars, avatarBg, avatarColor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 90, 4.8, '★★★★★', '#E1F5EE', '#0F6E56') RETURNING id, name, email`,
      [initials, name.trim(), specialty || 'General', clinic || 'Wellsy Clinic', targetEmail, password, tags || [specialty || 'General']]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Doktor hesabı oluşturulurken hata meydana geldi.' });
  }
});

// 4. ADMIN ÖZEL: FRONTEND'DEN GELEN PERSONEL/ADMIN OLUŞTURMA İSTEĞİ (CRITICAL FIXED)
app.post('/api/admin/create-staff', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const targetEmail = email.trim().toLowerCase();
    const targetRole = role || 'Staff';

    const checkEmail = await pool.query('SELECT id FROM patients WHERE LOWER(email) = $1', [targetEmail]);
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({ error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut.' });
    }

    const result = await pool.query(
      `INSERT INTO patients (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name.trim(), targetEmail, password, targetRole]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Yetkili hesabı oluşturulurken hata meydana geldi.' });
  }
});

// 5. DOKTORLARI LİSTELEME
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor FROM doctors ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. HASTALARI VE PERSONELLERİ LİSTELEME (ADMIN İÇİN)
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, tc, email, phone, role FROM patients ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. RANDEVU OLUŞTURMA (DOKTOR ADINA GÖRE ID BULMA VE ÇİFT REZERVASYON KORUMASI ENTEGRELİ)
app.post('/api/appointments', async (req, res) => {
  const { patient_email, doctor_name, appointment_date, appointment_time, type, note } = req.body;

  try {
    const patRes = await pool.query('SELECT id FROM patients WHERE LOWER(email) = $1', [patient_email.trim().toLowerCase()]);
    if (patRes.rowCount === 0) return res.status(444).json({ error: 'Hasta bulunamadı.' });
    const patient_id = patRes.rows[0].id;

    const docRes = await pool.query('SELECT id FROM doctors WHERE LOWER(name) = $1', [doctor_name.trim().toLowerCase()]);
    if (docRes.rowCount === 0) return res.status(404).json({ error: 'Doktor bulunamadı.' });
    const doctor_id = docRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, note, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Confirmed') RETURNING id`,
      [patient_id, doctor_id, appointment_date, appointment_time, type || 'Online', note || '']
    );

    res.status(201).json({ 
      success: true, 
      id: `#APT-${result.rows[0].id.toString().padStart(4, '0')}`,
      patient: patient_email,
      doctor: doctor_name,
      date: appointment_date,
      time: appointment_time,
      type: type || 'Online',
      status: 'Confirmed'
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Seçilen doktorun bu saat dilimi doludur. Lütfen başka bir saat seçiniz.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 8. HASTANIN KENDİ RANDEVULARINI ÇEKMESİ
app.get('/api/patients/:id/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, d.name as doctor, d.specialty as doctor_specialty, d.clinic, a.appointment_date as date, a.appointment_time as time, a.note, a.status 
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id 
       WHERE a.patient_id = $1 
       ORDER BY a.appointment_date ASC`, 
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. DOKTORUN KENDİ RANDEVULARINI ÇEKMESİ
app.get('/api/doctors/:id/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, p.name as patient, p.email as patient_email, a.appointment_date as date, a.appointment_time as time, a.type, a.note, a.status 
       FROM appointments a 
       JOIN patients p ON a.patient_id = p.id 
       WHERE a.doctor_id = $1 
       ORDER BY a.appointment_date ASC`, 
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. DOKTORUN KENDİ TEKİL HASTALARINI LİSTELEMESİ
app.get('/api/doctors/:id/patients', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT p.id, p.name, p.email, p.phone FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.doctor_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. OLLAMA LLM CHATBOT TÜNELİ
const OLLAMA_CHAT_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434/api/chat';
app.post('/api/chatbot/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Giriş mesaj geçmişi eksik.' });

  try {
    const ollamaMessages = [
      { role: 'system', content: 'You are Wellsy AI, an advanced, empathetic digital triage medical assistant. Help the user analyze symptoms nicely. Keep answers concise.' }
    ];

    messages.forEach(msg => {
      ollamaMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      });
    });

    const response = await fetch(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', messages: ollamaMessages, stream: false })
    });

    if (!response.ok) throw new Error('Ollama lokal servisine erişilemedi.');
    const data = await response.json();
    res.json({ response: data.message?.content || 'Üzgünüm, şu an yanıt üretemiyorum.' });
  } catch (err) {
    res.status(502).json({ response: 'LLM katmanıyla bağlantı kurulamadı: ' + err.message });
  }
});

// SİSTEM BAŞLATICI VE SEED DATA KORUYUCU (TAM SENKRONİZASYON)
const start = async () => {
  try {
    // Tabloların varlığını arka planda garantiye alıyoruz
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        tc TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL DEFAULT 'wellsy123',
        phone TEXT,
        role TEXT DEFAULT 'Patient',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Admin seed verisi
    await pool.query(`
      INSERT INTO patients (name, tc, email, password, phone, role)
      VALUES ('Sistem Yöneticisi', '45678901234', 'admin@wellsy.com', 'admin123', '0536 999 88 77', 'Admin')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Orijinal kodundaki Mustafa Mert Cemil personeli seed verisi korundu
    await pool.query(`
      INSERT INTO patients (name, tc, email, password, phone, role)
      VALUES ('Mustafa Mert Cemil', '23456789012', 'mert@wellsy.com', 'staff123', '0532 444 55 66', 'Staff')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log("PostgreSQL çalışma tabloları ve ana yetkili verileri doğrulandı.");
    app.listen(PORT, () => console.log(`Wellsy Core API Gateway ${PORT} portunda aktif.`));
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err);
    process.exit(1);
  }
}

start();