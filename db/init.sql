-- PostgreSQL initialization script for Render
-- Upload this file to your Render PostgreSQL database init step.

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

-- Sample doctor rows
INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
VALUES
  ('AK', 'Dr. Ayşe Kaya', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'ayse.kaya@wellsy.com', ARRAY['Anxiety disorders','CBT','Stress management'], '13 May', '14:00', 'Online', 'ti-device-laptop', 95, 4.9, '★★★★★', '#E1F5EE', '#0F6E56'),
  ('MY', 'Dr. Mehmet Yılmaz', 'Psychiatrist', 'Ruh Sağlığı Merkezi, Ankara', 'mehmet.yilmaz@wellsy.com', ARRAY['Anxiety','Depression','Group therapy'], '12 May', '16:30', 'In-person', 'ti-users', 88, 4.8, '★★★★☆', '#E6F1FB', '#185FA5'),
  ('ZD', 'Dr. Zeynep Demir', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'zeynep.demir@wellsy.com', ARRAY['Stress management','Mindfulness','Sleep therapy'], '14 May', '10:00', 'Online', 'ti-device-laptop', 82, 4.7, '★★★★☆', '#FAEEDA', '#854F0B'),
  ('SA', 'Dr. Selin Aydın', 'Neurology', 'Nöroloji Merkezi, İzmir', 'selin.aydin@wellsy.com', ARRAY['Migraine','EEG','Headache'], '15 May', '09:30', 'In-person', 'ti-users', 90, 4.8, '★★★★☆', '#E6F1FB', '#185FA5'),
  ('ES', 'Dr. Emre Şahin', 'Psychiatrist', 'Ruh Sağlığı Merkezi, Ankara', 'emre.sahin@wellsy.com', ARRAY['Depression','Bipolar','Medication'], '16 May', '11:00', 'Online', 'ti-device-laptop', 86, 4.6, '★★★★☆', '#FAEEDA', '#854F0B'),
  ('BC', 'Dr. Burak Çelik', 'Internal Medicine', 'İç Hastalıkları Kliniği, İstanbul', 'burak.celik@wellsy.com', ARRAY['Diabetes','Hypertension','Check-up'], '17 May', '13:30', 'In-person', 'ti-users', 84, 4.7, '★★★★☆', '#E1F5EE', '#0F6E56'),
  ('DA', 'Dr. Deniz Arslan', 'Clinical Psychologist', 'Ege Psikoloji Merkezi, İzmir', 'deniz.arslan@wellsy.com', ARRAY['CBT','Trauma','Couples therapy'], '18 May', '15:00', 'Online', 'ti-device-laptop', 88, 4.9, '★★★★★', '#E6F1FB', '#185FA5'),
  ('GK', 'Dr. Gizem Koç', 'Neurology', 'Başkent Nöroloji, Ankara', 'gizem.koc@wellsy.com', ARRAY['Epilepsy','Stroke','Movement disorders'], '19 May', '10:30', 'In-person', 'ti-users', 81, 4.5, '★★★★☆', '#FAEEDA', '#854F0B'),
  ('CO', 'Dr. Cem Öztürk', 'Psychiatrist', 'Anadolu Psikiyatri Kliniği, Bursa', 'cem.ozturk@wellsy.com', ARRAY['Anxiety','ADHD','Sleep disorders'], '20 May', '14:30', 'Online', 'ti-device-laptop', 87, 4.7, '★★★★☆', '#E1F5EE', '#0F6E56'),
  ('AY', 'Dr. Aslı Yıldırım', 'Internal Medicine', 'İç Hastalıkları Kliniği, İstanbul', 'asli.yildirim@wellsy.com', ARRAY['Thyroid','Anemia','Preventive care'], '21 May', '09:00', 'In-person', 'ti-users', 83, 4.6, '★★★★☆', '#E6F1FB', '#185FA5'),
  ('MD', 'Dr. Murat Doğan', 'Clinical Psychologist', 'Ege Psikoloji Merkezi, İzmir', 'murat.dogan@wellsy.com', ARRAY['Stress management','Mindfulness','Burnout'], '22 May', '16:00', 'Online', 'ti-device-laptop', 85, 4.8, '★★★★☆', '#FAEEDA', '#854F0B'),
  ('ESn', 'Dr. Elif Şen', 'Neurology', 'Nöroloji Merkezi, İzmir', 'elif.sen@wellsy.com', ARRAY['Migraine','Neuropathy','Dizziness'], '23 May', '11:30', 'In-person', 'ti-users', 80, 4.4, '★★★★☆', '#E1F5EE', '#0F6E56'),
  ('KP', 'Dr. Kaan Polat', 'Psychiatrist', 'Marmara Psikiyatri, İstanbul', 'kaan.polat@wellsy.com', ARRAY['Depression','OCD','Group therapy'], '24 May', '13:00', 'Online', 'ti-device-laptop', 89, 4.9, '★★★★★', '#E6F1FB', '#185FA5')
ON CONFLICT (email) DO NOTHING;

-- Sample patient rows
INSERT INTO patients (name, tc, email, password, phone, role)
VALUES
  ('Tuna B.', '12345678901', 'tuna.b@example.com', 'wellsy123', '0533 555 66 77', 'Patient'),
  ('Elif K.', '23456789012', 'elif.k@example.com', 'wellsy123', '0532 444 55 66', 'Patient'),
  ('Ayşe Acar', '51000000001', 'ayse.acar@wellsy.com', 'staff123', '0533 100 10 01', 'Staff'),
  ('Burcu Tekin', '51000000002', 'burcu.tekin@wellsy.com', 'staff123', '0533 100 10 02', 'Staff'),
  ('Hakan Yalçın', '51000000003', 'hakan.yalcin@wellsy.com', 'staff123', '0533 100 10 03', 'Staff'),
  ('Merve Aksoy', '51000000004', 'merve.aksoy@wellsy.com', 'staff123', '0533 100 10 04', 'Staff'),
  ('Okan Eren', '51000000005', 'okan.eren@wellsy.com', 'staff123', '0533 100 10 05', 'Staff'),
  ('Pınar Güneş', '51000000006', 'pinar.gunes@wellsy.com', 'staff123', '0533 100 10 06', 'Staff')
ON CONFLICT (email) DO NOTHING;

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

INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, status, note)
SELECT p.id, d.id, '2026-06-01', '15:00', 'Online', 'Confirmed', 'Follow-up consultation'
FROM patients p
JOIN doctors d ON d.email = 'ayse.kaya@wellsy.com'
WHERE p.email = 'elif.k@example.com'
  AND NOT EXISTS (
    SELECT 1
    FROM appointments a
    WHERE a.patient_id = p.id
      AND a.doctor_id = d.id
      AND a.appointment_date = '2026-06-01'
      AND a.appointment_time = '15:00'
  );

CREATE TABLE IF NOT EXISTS change_requests (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  requested_date DATE,
  requested_time TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
