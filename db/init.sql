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

-- =========================================================================
-- DOCTORS DATA (Orijinal 2 Doktor + 10 Yeni AI Test Doktoru)
-- =========================================================================

INSERT INTO doctors (initials, name, specialty, clinic, email, tags, date, time, visit, visitIcon, match_score, rating, stars, avatarBg, avatarColor)
VALUES
  -- Orijinal Doktorlar
  ('AK', 'Dr. Ayşe Kaya', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'ayse.kaya@wellsy.com', ARRAY['Anxiety disorders','CBT','Stress management'], '13 May', '14:00', 'Online', 'ti-device-laptop', 95, 4.9, '★★★★★', '#E1F5EE', '#0F6E56'),
  ('ZD', 'Dr. Zeynep Demir', 'Clinical Psychologist', 'İstanbul Psikoloji Kliniği', 'zennep.demir@wellsy.com', ARRAY['Stress management','Mindfulness','Sleep therapy'], '14 May', '10:00', 'Online', 'ti-device-laptop', 82, 4.7, '★★★★☆', '#FAEEDA', '#854F0B'),

  -- 1. YENİ: Clinical Psychologist
  ('BC', 'Dr. Burak Çetin', 'Clinical Psychologist', 'Wellsy Kadıköy Şubesi', 'burak.cetin@wellsy.com', ARRAY['Anxiety', 'Depression', 'CBT'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 90, 4.9, '★★★★★', '#E1F5EE', '#0F6E56'),
  
  -- 2. YENİ: Clinical Psychologist
  ('as', 'Dr. Aylin Soydan', 'Clinical Psychologist', 'Wellsy Beşiktaş Ofisi', 'aylin.soydan@wellsy.com', ARRAY['Stress', 'Panic Attack', 'Family Therapy'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 85, 4.8, '★★★★★', '#E8F0FE', '#1A73E8'),
  
  -- 3. YENİ: Clinical Psychologist
  ('MY', 'Dr. Murat Yıldırım', 'Clinical Psychologist', 'Wellsy Nişantaşı Kliniği', 'murat.yildirim@wellsy.com', ARRAY['PTSD', 'Sleep Disorders', 'Therapy'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 80, 4.7, '★★★★☆', '#FCE8E6', '#C5221F'),
  
  -- 4. YENİ: Clinical Psychologist
  ('EA', 'Dr. Emel Arslan', 'Clinical Psychologist', 'Wellsy Bakırköy Merkezi', 'emel.arslan@wellsy.com', ARRAY['Burnout', 'Mindfulness', 'Anxiety'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 88, 4.9, '★★★★★', '#E6F4EA', '#137333'),
  
  -- 5. YENİ: Psychiatrist
  ('MY', 'Dr. Mehmet Yılmaz', 'Psychiatrist', 'Wellsy Central Clinic', 'mehmet.yilmaz@wellsy.com', ARRAY['Mood Disorders', 'ADHD', 'Bipolar'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 92, 4.8, '★★★★★', '#FEF7E0', '#B06000'),
  
  -- 6. YENİ: Psychiatrist
  ('SO', 'Dr. Selin Onur', 'Psychiatrist', 'Wellsy Kadıköy Şubesi', 'selin.onur@wellsy.com', ARRAY['Depression', 'OCD', 'Psychopharmacology'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 87, 4.6, '★★★★☆', '#F3E5F5', '#7B1FA2'),
  
  -- 7. YENİ: Psychiatrist
  ('KK', 'Dr. Kerem Karaca', 'Psychiatrist', 'Wellsy Nişantaşı Kliniği', 'kerem.karaca@wellsy.com', ARRAY['Schizophrenia', 'Addiction', 'Anxiety'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 84, 4.5, '★★★★☆', '#E0F7FA', '#006064'),
  
  -- 8. YENİ: Neurology
  ('AH', 'Dr. Ahmet Haktan', 'Neurology', 'Wellsy Nöroloji Merkezi', 'ahmet.haktan@wellsy.com', ARRAY['Migraine', 'Epilepsy', 'Alzheimer'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 75, 4.9, '★★★★★', '#EFEBE9', '#4E342E'),
  
  -- 9. YENİ: Neurology
  ('DS', 'Dr. Deniz Şahin', 'Neurology', 'Wellsy Central Clinic', 'deniz.sahin@wellsy.com', ARRAY['Vertigo', 'Neuropathy', 'Sleep Apnea'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 78, 4.7, '★★★★☆', '#ECEFF1', '#37474F'),
  
  -- 10. YENİ: Internal Medicine
  ('CO', 'Dr. Can Öztürk', 'Internal Medicine', 'Wellsy Genel Dahiliye', 'can.ozturk@wellsy.com', ARRAY['Hypertension', 'Diabetes', 'Check-up'], 'Her gün', '09:00-17:00', 'Online', 'ti-device-laptop', 70, 4.8, '★★★★★', '#FFF3E0', '#E65100')
ON CONFLICT (email) DO NOTHING;

-- =========================================================================
-- PATIENTS DATA (Orijinal Hastalar + Admin)
-- =========================================================================

INSERT INTO patients (name, tc, email, password, phone, role)
VALUES
  ('Tuna B.', '12345678901', 'tuna.b@example.com', 'wellsy123', '0533 555 66 77', 'Patient'),
  ('Elif K.', '23456789012', 'elif.k@example.com', 'wellsy123', '0532 444 55 66', 'Patient'),
  ('Sistem Yöneticisi', '45678901234', 'admin@wellsy.com', 'admin123', '0536 999 88 77', 'Admin')
ON CONFLICT (email) DO NOTHING;