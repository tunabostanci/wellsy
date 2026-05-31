

CREATE TABLE MANUFACTURERS(
	manufacturerCode VARCHAR(20) PRIMARY KEY,
	companyName VARCHAR(100) NOT NULL,
	country VARCHAR(50) 
);

CREATE TABLE STORAGESECTIONS(
	sectionID SERIAL PRIMARY KEY, 
	sectionName VARCHAR(50) NOT NULL, 
	currentTemperature DECIMAL(4,2)
);

CREATE TABLE ACTIVEINGREDIENTS(
	ingredientID SERIAL PRIMARY KEY, 
	chemicalName VARCHAR(100) NOT NULL UNIQUE, 
	maxDailyDose VARCHAR(30) 
);

CREATE TABLE PHARMACIES(
	sicil_no VARCHAR(13) PRIMARY KEY, 
	pharmacyName VARCHAR(60) NOT NULL,
	pharmacist VARCHAR(60),
	city VARCHAR(30) NOT NULL
);



CREATE TABLE MEDICINES(
	barcode VARCHAR(13) PRIMARY KEY,
	medicineName VARCHAR(100) NOT NULL,
	price DECIMAL(10,2) NOT NULL,
	stockQuantity INT DEFAULT 0,
	requiresColdChain BOOLEAN DEFAULT FALSE,
	manufacturerCode VARCHAR(20), 
	sectionID INT,
	FOREIGN KEY (manufacturerCode) REFERENCES MANUFACTURERS(manufacturerCode) ON DELETE SET NULL,
	FOREIGN KEY (sectionID) REFERENCES STORAGESECTIONS(sectionID) ON DELETE SET NULL
);



CREATE TABLE PRESCRIPTION_MEDICINES( 
	barcode VARCHAR(13) PRIMARY KEY,
	prescriptionType VARCHAR(20) NOT NULL,
	requiresReport BOOLEAN DEFAULT FALSE,
	FOREIGN KEY (barcode) REFERENCES MEDICINES(barcode) ON DELETE CASCADE
);

CREATE TABLE OTCMEDICINES( 
	barcode VARCHAR(13) PRIMARY KEY,
	category VARCHAR(50), 
	ageLimit INT DEFAULT 0,
	FOREIGN KEY (barcode) REFERENCES MEDICINES(barcode) ON DELETE CASCADE
);

CREATE TABLE BATCHES(
	batchNO VARCHAR(30) PRIMARY KEY,
	barcode VARCHAR(13),
	productionDate DATE NOT NULL,
	expirationDate DATE NOT NULL,
	quantityReceived INT NOT NULL,
	FOREIGN KEY (barcode) REFERENCES MEDICINES(barcode) ON DELETE CASCADE
);

CREATE TABLE MEDICINE_INGREDIENTS(
	barcode VARCHAR(13),
	ingredientID INT,
	PRIMARY KEY (barcode, ingredientID),
	FOREIGN KEY (barcode) REFERENCES MEDICINES(barcode) ON DELETE CASCADE,
	FOREIGN KEY (ingredientID) REFERENCES ACTIVEINGREDIENTS(ingredientID) ON DELETE CASCADE
);

CREATE TABLE ORDERS(
	orderID SERIAL PRIMARY KEY,
	sicil_no VARCHAR(13),
	tc_no VARCHAR(11), 
	orderDate DATE NOT NULL,
	totalAmount DECIMAL(12,2) DEFAULT 0.00,
	FOREIGN KEY (sicil_no) REFERENCES PHARMACIES(sicil_no) ON DELETE RESTRICT,
	FOREIGN KEY (tc_no) REFERENCES PATIENTS(tc_no) ON DELETE RESTRICT
);
CREATE TABLE ORDERDETAILS(
	orderID INT,
	barcode VARCHAR(13),
	quantity INT NOT NULL,
	unitPrice DECIMAL(12,2) NOT NULL,
	PRIMARY KEY(orderID, barcode),
	FOREIGN KEY(orderID) REFERENCES ORDERS(orderID) ON DELETE CASCADE,
	FOREIGN KEY (barcode) REFERENCES MEDICINES(barcode) ON DELETE RESTRICT
);
CREATE TABLE PATIENTS(
	tc_no VARCHAR(11) PRIMARY KEY, 
	patientName VARCHAR(60) NOT NULL,
	patientSurname VARCHAR(60) NOT NULL
);

CREATE TABLE PATIENT_ALLERGIES( -- Hastaların ilaç etken maddesine karşı alerjisini sorgulamak için kullanılır
	tc_no VARCHAR(11),
	ingredientID INT,
	PRIMARY KEY (tc_no, ingredientID), 
	FOREIGN KEY (tc_no) REFERENCES PATIENTS(tc_no) ON DELETE CASCADE,
	FOREIGN KEY (ingredientID) REFERENCES ACTIVEINGREDIENTS(ingredientID) ON DELETE CASCADE
);

-- #################### DATA INSERT
-- 1. ÜRETİCİLER (Natural Key kodlarıyla)
INSERT INTO MANUFACTURERS (manufacturerCode, companyName, country) VALUES
('PFIZ-01', 'Pfizer Inc.', 'USA'),
('SANO-02', 'Sanofi Aventis', 'France'),
('ABDI-03', 'Abdi Ibrahim', 'Türkiye'),
('BAYR-04', 'Bayer Healthcare', 'Germany');

-- 2. DEPO BÖLÜMLERİ
INSERT INTO STORAGESECTIONS (sectionName, currentTemperature) VALUES
('Aşı Dolabı - A', 4.20),
('Aşı Dolabı - B', 3.50),
('Normal Kuru Reyon - 1', 22.50),
('Normal Kuru Reyon - 2', 21.00);

-- 3. ETKEN MADDELER
INSERT INTO ACTIVEINGREDIENTS (chemicalName, maxDailyDose) VALUES
('Parasetamol', '4000mg'),
('İbuprofen', '1200mg'),
('Amoksisilin', '3000mg'),
('İnsülin Glargine', '100 UI');

-- 4. ECZANELER (Müşteriler)
INSERT INTO PHARMACIES (sicil_no, pharmacyName, pharmacist, city) VALUES
('1234567890123', 'Hayat Eczanesi', 'Ahmet Yılmaz', 'Ankara'),
('9876543210987', 'Şifa Eczanesi', 'Ayşe Demir', 'İstanbul'),
('5555555555555', 'Merkez Eczanesi', 'Can Tekin', 'Ankara');

-- 5. HASTALAR
INSERT INTO PATIENTS (tc_no, patientName, patientSurname) VALUES
('11111111111', 'Mehmet', 'Kaya'),
('22222222222', 'Zeynep', 'Çelik'),
('33333333333', 'Ali', 'Yurt');

-- 6. İLAÇLAR (Üst Sınıf)
-- Barkodlar 13 hane, Soğuk zincirler ve bölüm ID'leri mantıksal eşleştirildi
INSERT INTO MEDICINES (barcode, medicineName, price, stockQuantity, requiresColdChain, manufacturerCode, sectionID) VALUES
('8699525095813', 'Parol Plus Tablet', 45.50, 150, FALSE, 'ABDI-03', 3),
('8699546090125', 'Dolorex 50 mg', 62.00, 80, FALSE, 'ABDI-03', 4),
('8699525010014', 'Lantus Solostar Enjeksiyon', 420.00, 30, TRUE, 'SANO-02', 1),
('8699543090010', 'Augmentin BID 1000mg', 115.00, 5, FALSE, 'PFIZ-01', 3),
('8699500000001', 'Gripin Kapsül', 20.00, 200, FALSE, 'BAYR-04', 4);

-- 7. REÇETELİ İLAÇLAR (Alt Sınıf)
INSERT INTO PRESCRIPTION_MEDICINES (barcode, prescriptionType, requiresReport) VALUES
('8699525010014', 'Kırmızı', TRUE), -- Lantus İnsülin (Raporlu ve Kırmızı Reçeteli gibi kurgulandı)
('8699543090010', 'Normal Reçeteli', FALSE); -- Antibiyotik

-- 8. REÇETESİZ İLAÇLAR (Alt Sınıf)
INSERT INTO OTCMEDICINES (barcode, category, ageLimit) VALUES
('8699525095813', 'Ağrı Kesici', 0),
('8699546090125', 'Ağrı Kesici', 12),
('8699500000001', 'Ağrı Kesici / Soğuk Algınlığı', 0);

-- 9. İLAÇ - ETKEN MADDE EŞLEŞMELERİ (M:N)
INSERT INTO MEDICINE_INGREDIENTS (barcode, ingredientID) VALUES
('8699525095813', 1), -- Parol -> Parasetamol içerir
('8699500000001', 1), -- Gripin -> Parasetamol içerir (Muadil senaryosu için harika!)
('8699546090125', 2), -- Dolorex -> İbuprofen içerir
('8699543090010', 3), -- Augmentin -> Amoksisilin içerir
('8699525010014', 4); -- Lantus -> İnsülin içerir

-- 10. HASTA ALERJİ EŞLEŞMELERİ (M:N)
INSERT INTO PATIENT_ALLERGIES (tc_no, ingredientID) VALUES
('11111111111', 1), -- Mehmet Kaya'nın Parasetamol alerjisi var (Parol veya Gripin alırken sistem uyarı vermeli!)
('22222222222', 3); -- Zeynep Çelik'in Amoksisilin (Antibiyotik) alerjisi var

-- 11. SİPARİŞLER
INSERT INTO ORDERS (orderID, sicil_no, tc_no, orderDate, totalAmount) VALUES
(1, '1234567890123', '11111111111', '2026-05-15', 153.00),
(2, '9876543210987', '22222222222', '2026-05-18', 420.00)

-- 12. SİPARİŞ DETAYLARI
INSERT INTO ORDERDETAILS (orderID, barcode, quantity, unitPrice) VALUES
(1, '8699525095813', 2, 45.50), -- 2 adet Parol
(1, '8699546090125', 1, 62.00), -- 1 adet Dolorex
(2, '8699525010014', 1, 420.00); -- 1 adet Lantus insülin

-- 13. TABLO: BATCHES (Ürün Partileri / SKT Takibi İçin Örnek Veriler)
INSERT INTO BATCHES (batchNO, barcode, productionDate, expirationDate, quantityReceived) VALUES
('LOT-PAROL-2025A', '8699525095813', '2025-01-10', '2027-01-10', 100), -- Günü var
('LOT-PAROL-2026B', '8699525095813', '2026-02-15', '2028-02-15', 50),  -- Günü var
('LOT-LANTUS-001X', '8699525010014', '2025-05-01', '2026-05-01', 30),  -- SKT'si GEÇMİŞ! (Kriz sorgusu için)
('LOT-AUGM-999ZZ', '8699543090010', '2024-06-01', '2026-06-30', 5);   -- SKT'sine 1 aydan az kalmış!
