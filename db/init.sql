-- PostgreSQL initialization script for Render
-- Upload this file to your Render PostgreSQL database init step.

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

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tc TEXT UNIQUE,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'Patient',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample doctor rows
INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
VALUES
  ('AK', 'Dr. Ayşe Kaya', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'ayse.kaya@wellsy.com', ARRAY['Anxiety disorders','CBT','Stress management'], '13 May', '14:00', 'Online', 'ti-device-laptop', 95, 4.9, '★★★★★', '#E1F5EE', '#0F6E56'),
  ('MY', 'Dr. Mehmet Yılmaz', 'Psychiatrist', 'Ruh Sağlığı Merkezi, Ankara', 'mehmet.yilmaz@wellsy.com', ARRAY['Anxiety','Depression','Group therapy'], '12 May', '16:30', 'In-person', 'ti-users', 88, 4.8, '★★★★☆', '#E6F1FB', '#185FA5'),
  ('ZD', 'Dr. Zeynep Demir', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'zeynep.demir@wellsy.com', ARRAY['Stress management','Mindfulness','Sleep therapy'], '14 May', '10:00', 'Online', 'ti-device-laptop', 82, 4.7, '★★★★☆', '#FAEEDA', '#854F0B')
ON CONFLICT (email) DO NOTHING;

-- Sample patient rows
INSERT INTO patients (name, tc, email, phone)
VALUES
  ('Tuna B.', '12345678901', 'tuna.b@example.com', '0533 555 66 77'),
  ('Elif K.', '23456789012', 'elif.k@example.com', '0532 444 55 66')
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
