import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import pg from 'pg'
import { Resend } from 'resend';

config()

const { Pool } = pg
const PORT = process.env.PORT || 4000

// GÜVENLİK UYARISI: Jüride API anahtarının patlamaması için burayı çevre değişkenine bağlamak en iyisidir
const resend = new Resend(process.env.RESEND_API_KEY );

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

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
  } else {
    console.log('Wellsy Veritabanı bağlantısı başarılı:', res.rows[0].now);
  }
});

// 1. KULLANICI GİRİŞİ
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'E-posta, şifre ve rol alanları zorunludur.' });
  }

  try {
    let result;
    if (role === 'doctor') {
      result = await pool.query('SELECT id, name, email, password, \'doctor\' as role FROM doctors WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
    } else {
      result = await pool.query('SELECT id, name, email, password, role FROM patients WHERE LOWER(email) = $1', [email.trim().toLowerCase()]);
    }

    if (result.rowCount === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ error: 'Hatalı e-posta veya şifre girdiniz.' });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Giriş hatası.' });
  }
});

// 2. SIFIRDAN HASTA KAYIT ETME
app.post('/api/patients', async (req, res) => {
  const { name, tc, email, password, phone } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patients (name, tc, email, password, phone, role) 
       VALUES ($1, $2, $3, $4, $5, 'Patient') RETURNING id, name, email, role`,
      [name, tc, email, password, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ADMIN ÖZEL: DOKTOR OLUŞTURMA
app.post('/api/admin/create-doctor', async (req, res) => {
  const { name, specialty, clinic, email, password, tags } = req.body;
  try {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const result = await pool.query(
      `INSERT INTO doctors (initials, name, specialty, clinic, email, password, tags, match_score, rating, stars, avatarBg, avatarColor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 90, 4.8, '★★★★★', '#E1F5EE', '#0F6E56') RETURNING id, name, email`,
      [initials, name, specialty, clinic, email, password, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ADMIN ÖZEL: STAFF OLUŞTURMA
app.post('/api/admin/create-staff', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO patients (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, password, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DOKTORLARI LİSTELEME
app.get('/api/doctors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM doctors ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. HASTALARI LİSTELEME
app.get('/api/patients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone, password } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'İsim alanı boş bırakılamaz.' });
  }

  try {
    // Veritabanında ilgili hastanın bilgilerini update ediyoruz
    const result = await pool.query(
      `UPDATE patients 
       SET name = $1, phone = $2, password = COALESCE($3, password)
       WHERE id = $4 
       RETURNING id, name, tc, email, phone, role`,
      [name.trim(), phone ? phone.trim() : null, password ? password : null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Güncellenmiş yeni kullanıcı objesini ön yüze geri dönüyoruz
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Profil Güncelleme Hatası:", err);
    res.status(500).json({ error: 'Profil bilgileri güncellenirken bir hata oluştu.' });
  }
});

// 1. TÜM RANDEVULARI APPOINTMENTS TABLOSUNDAN CANLI LİSTELEME (STAFF İÇİN)
app.get('/api/admin/all-appointments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        p.name as patient_name, -- CRITICAL FIXED: p.email yerine hastanın gerçek ismini çekiyoruz
        d.name as doctor_name, 
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date, 
        a.appointment_time as time, 
        a.type, 
        a.status,
        a.note -- FIXED: Personel panelindeki sayaçlar için not alanı eklendi
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PERSONELİN RANDEVU DURUMUNU GÜNCELLEMESİ (APPROVE/REJECT)
app.put('/api/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await pool.query('UPDATE appointments SET status = $1 WHERE id = $2', [status, id]);

    if (status === 'Confirmed') {
      const apptDetails = await pool.query(`
        SELECT 
          p.email as patient_email, 
          p.name as patient_name,
          d.name as doctor_name, 
          TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date, 
          a.appointment_time as time,
          d.clinic
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.id = $1
      `, [id]);

      if (apptDetails.rowCount > 0) {
        const { patient_name, doctor_name, date, time, clinic } = apptDetails.rows[0];

        // HASTA MAİLİ
        resend.emails.send({
          from: 'Wellsy Sağlık <onboarding@resend.dev>',
          to: 'tunabostanci2005@gmail.com',
          subject: '🏥 Randevunuz Onaylandı! - Wellsy Sağlık',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9edef; border-radius: 12px;">
              <h2 style="color: #008069; border-bottom: 2px solid #008069; padding-bottom: 10px; margin-top: 0;">Wellsy Randevu Onay Belgesi</h2>
              <p>Merhaba Sayın <strong>${patient_name}</strong>,</p>
              <p>Klinik asistanlarımız tarafından yapılan inceleme sonucunda randevu talebiniz başarıyla <strong>onaylanmıştır</strong>.</p>
              <div style="background-color: #E1F5EE; padding: 15px; border-radius: 8px; margin: 20px 0; color: #0F6E56;">
                <ul style="list-style: none; padding-left: 0; line-height: 1.8; margin-bottom: 0;">
                  <li><strong>Uzman Doktor:</strong> ${doctor_name}</li>
                  <li><strong>Klinik / Branş:</strong> ${clinic}</li>
                  <li><strong>Tarih:</strong> ${date}</li>
                  <li><strong>Saat Dilimi:</strong> ${time}</li>
                </ul>
              </div>
              <p style="font-size: 13px; color: #667781;">Randevu saatinizde sisteme giriş yaparak online görüşme odanıza katılabilirsiniz.</p>
            </div>
          `
        }).then(() => console.log("✨ HASTA MAİLİ BAŞARIYLA GÖNDERİLDİ"))
          .catch(err => console.error("Hasta mail hatası:", err));

        // DOKTOR MAİLİ
        resend.emails.send({
          from: 'Wellsy Klinik Bilgi <onboarding@resend.dev>',
          to: 'tunabostanci2005@gmail.com',
          subject: `📅 Yeni Randevu Ataması: ${patient_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9edef; border-radius: 12px; border-top: 4px solid #854F0B;">
              <h2 style="color: #854F0B; border-bottom: 2px solid #854F0B; padding-bottom: 10px; margin-top: 0;">Sayın ${doctor_name}, Yeni Randevunuz Var</h2>
              <div style="background-color: #FFF3CD; padding: 15px; border-radius: 8px; margin: 20px 0; color: #854F0B;">
                <ul style="list-style: none; padding-left: 0; line-height: 1.8; margin-bottom: 0;">
                  <li><strong>Hasta Adı:</strong> ${patient_name}</li>
                  <li><strong>Tarih:</strong> ${date}</li>
                  <li><strong>Saat Dilimi:</strong> ${time}</li>
                </ul>
              </div>
            </div>
          `
        }).then(() => console.log("✨ DOKTOR MAİLİ BAŞARIYLA GÖNDERİLDİ"))
          .catch(err => console.error("Doktor mail hatası:", err));
      }
    }

    res.json({ success: true, message: 'Durum güncellendi.' });
  } catch (err) {
    console.error("Sistem Hatası:", err);
    res.status(500).json({ error: err.message });
  }
});

// 7. RANDEVU OLUŞTURMA
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
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending') RETURNING id`,
      [patient_id, doctor_id, appointment_date, appointment_time, type, note]
    );

    res.status(201).json({ 
      success: true, 
      id: `#APT-${result.rows[0].id.toString().padStart(4, '0')}`,
      status: 'Pending'
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Seçilen doktorun bu saat dilimi doludur.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 8. HASTA RANDEVULARI
app.get('/api/patients/:id/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, d.name as doctor, d.specialty as doctor_specialty, d.clinic, a.appointment_date as date, a.appointment_time as time, a.note, a.status 
       FROM appointments a JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_id = $1 ORDER BY a.appointment_date ASC`, 
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. DOKTOR RANDEVULARI (CHATING GEÇMİŞİ İÇİN TAM ONAYLI YAPILANDIRILDI)
app.get('/api/doctors/:id/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        a.id, 
        p.name as patient_name, -- FIXED: Arayüz ile tam uyum için alias eklendi
        p.email as patient_email, 
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date, 
        a.appointment_time as time, 
        a.type, 
        a.note, -- 🚨 VERİBURADAN DOĞRUDAN ÖN YÜZE BASILIYOR
        a.status 
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

// HASTANIN İPTAL TALEBİ GÖNDERMESİ
app.put('/api/appointments/:id/request-cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE appointments SET status = 'Cancellation Requested' WHERE id = $1", [id]);
    res.json({ success: true, message: 'İptal talebi iletilemedi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KLİNİK PERSONELİNİN SADECE DEĞİŞİKLİK/İPTAL TALEPLERİNİ LİSTELEMESİ
app.get('/api/admin/change-requests', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        p.name as patient_name, 
        d.name as doctor_name, 
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date, 
        a.appointment_time as time, 
        a.type, 
        a.status,
        a.note
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.status = 'Cancellation Requested'
      ORDER BY a.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// AI TABANLI DOKTOR EŞLEŞTİRME ENDPOINT'İ (FIXED & SECURE VERSION)
// =========================================================================
app.post('/api/chatbot/match-doctors', async (req, res) => {
  const { chatHistory } = req.body; 
  if (!chatHistory) return res.status(400).json({ error: 'Konuşma geçmişi bulunamadı.' });

  // CRITICAL FIX: URL tanımını fonksiyonun hemen içine çekerek yukarıdan aşağıya okuma hatasını engelliyoruz
  const LOCAL_OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434/api/chat';

  try {
    const systemPrompt = `You are an AI medical routing assistant. Analyze the patient's chat history and assign a matching percentage score (0 to 100) for these clinic specialties based on their symptoms:
    1. Clinical Psychologist
    2. Psychiatrist
    3. Neurology
    4. Internal Medicine

    Respond ONLY with a valid JSON object where keys are the exact specialty names and values are integers. Do not write any explanations.
    Example output format:
    {
      "Clinical Psychologist": 85,
      "Psychiatrist": 40,
      "Neurology": 15,
      "Internal Medicine": 10
    }`;

    const response = await fetch(LOCAL_OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this chat history: ${chatHistory}` }
        ],
        stream: false
      })
    });

    if (!response.ok) throw new Error('Ollama connection failed.');
    const data = await response.json();
    
    // Güvenli JSON Ayrıştırma
    let scores = {};
    try {
      scores = JSON.parse(data.message?.content.trim());
    } catch (parseErr) {
      console.warn("LLM tam JSON dönmedi, fallback skorlar uygulanıyor.");
    }
    
    const doctorsResult = await pool.query('SELECT * FROM doctors ORDER BY id ASC');
    const doctors = doctorsResult.rows;

    const dynamicDoctors = doctors.map(doc => {
      const matchedScore = (scores && scores[doc.specialty] !== undefined) ? scores[doc.specialty] : 50;
      return {
        ...doc,
        match_score: matchedScore
      };
    }).sort((a, b) => b.match_score - a.match_score); 

    res.json(dynamicDoctors);
  } catch (err) {
    console.error('AI Matching Error:', err);
    res.status(502).json({ error: 'AI eşleştirme katmanında hata oluştu.' });
  }
});
// DOKTORUN SEÇTİĞİ BELİRLİ BİR HASTANIN GEÇMİŞ ZİYARETLERİNİ GETİRME
app.get('/api/doctors/:doctorId/patients/:patientId/history', async (req, res) => {
  const { doctorId, patientId } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.id, TO_CHAR(a.appointment_date, 'YYYY-MM-DD') as date, a.appointment_time as time, a.type, a.note, a.status 
       FROM appointments a WHERE a.doctor_id = $1 AND a.patient_id = $2 ORDER BY a.appointment_date DESC`, 
      [doctorId, patientId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. DOKTORUN HASTALARI
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

// SİSTEM BAŞLATICI
const start = async () => {
  try {
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

    const adminCheck = await pool.query('SELECT id FROM patients WHERE LOWER(email) = $1', ['admin@wellsy.com']);
    if (adminCheck.rowCount === 0) {
      await pool.query(`
        INSERT INTO patients (name, tc, email, password, phone, role)
        VALUES ('Sistem Yöneticisi', '45678901234', 'admin@wellsy.com', 'admin123', '0536 999 88 77', 'Admin')
      `);
    }

    const staffEmailCheck = await pool.query('SELECT id FROM patients WHERE LOWER(email) = $1', ['mert@wellsy.com']);
    const staffTcCheck = await pool.query('SELECT id FROM patients WHERE tc = $1', ['23456789012']);
    
    if (staffEmailCheck.rowCount === 0) {
      if (staffTcCheck.rowCount === 0) {
        await pool.query(`
          INSERT INTO patients (name, tc, email, password, phone, role)
          VALUES ('Mustafa Mert Cemil', '23456789012', 'mert@wellsy.com', 'staff123', '0532 444 55 66', 'Staff')
        `);
      } else {
        await pool.query(`
          INSERT INTO patients (name, tc, email, password, phone, role)
          VALUES ('Mustafa Mert Cemil', null, 'mert@wellsy.com', 'staff123', '0532 444 55 66', 'Staff')
        `);
      }
    }

    console.log("PostgreSQL tabloları ve ana yetkili verileri doğrulandı.");
    app.listen(PORT, () => console.log(`Wellsy Core API Gateway ${PORT} portunda aktif.`));
  } catch (err) {
    console.error('Veritabanı başlatma hatası:', err);
    process.exit(1);
  }
}

start();