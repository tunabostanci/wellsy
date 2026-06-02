-- PostgreSQL initialization script for Wellsy
-- Upload this file to your PostgreSQL database init step.

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
  password TEXT NOT NULL DEFAULT 'wellsy123',
  phone TEXT,
  role TEXT DEFAULT 'Patient',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample doctor rows
INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
VALUES
  ('AK', 'Dr. Ayşe Kaya', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'ayse.kaya@wellsy.com', ARRAY['Anxiety disorders','CBT','Stress management'], '13 May', '14:00', 'Online', 'ti-device-laptop', 95, 4.9, '★★★★★', '#E1F5EE', '#0F6E56'),
  ('ZD', 'Dr. Zeynep Demir', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'zeynep.demir@wellsy.com', ARRAY['Stress management','Mindfulness','Sleep therapy'], '14 May', '10:00', 'Online', 'ti-device-laptop', 82, 4.7, '★★ shadow ☆', '#FAEEDA', '#854F0B')
ON CONFLICT (email) DO NOTHING;

-- Sample patient rows
INSERT INTO patients (name, tc, email, password, phone, role)
VALUES
  ('Tuna B.', '12345678901', 'tuna.b@example.com', 'wellsy123', '0533 555 66 77', 'Patient'),
  ('Elif K.', '23456789012', 'elif.k@example.com', 'wellsy123', '0532 444 55 66', 'Patient')
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