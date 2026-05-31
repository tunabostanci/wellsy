--###################################################################ETKEN MADDEYE ALERJİSİ OLANLAR ###################################################################
SELECT 
    ORDERS.orderID,
    PHARMACIES.sicil_no AS eczane_sicil,
    PHARMACIES.pharmacyName AS eczane_adi,
    PATIENTS.tc_no AS hasta_tc,
    PATIENTS.patientName AS hasta_adi,
    PATIENTS.patientSurname AS hasta_soyadi,
    MEDICINES.medicineName AS siparis_edilen_ilac,
    ACTIVEINGREDIENTS.chemicalName AS tehlikeli_etken_madde
FROM ORDERS
JOIN PHARMACIES ON ORDERS.sicil_no = PHARMACIES.sicil_no
JOIN PATIENTS ON ORDERS.tc_no = PATIENTS.tc_no
JOIN ORDERDETAILS ON ORDERS.orderID = ORDERDETAILS.orderID
JOIN MEDICINES ON ORDERDETAILS.barcode = MEDICINES.barcode
JOIN MEDICINE_INGREDIENTS ON MEDICINES.barcode = MEDICINE_INGREDIENTS.barcode
JOIN ACTIVEINGREDIENTS ON MEDICINE_INGREDIENTS.ingredientID = ACTIVEINGREDIENTS.ingredientID
JOIN PATIENT_ALLERGIES ON PATIENTS.tc_no = PATIENT_ALLERGIES.tc_no 
                      AND MEDICINE_INGREDIENTS.ingredientID = PATIENT_ALLERGIES.ingredientID

WHERE ACTIVEINGREDIENTS.chemicalName = 'Parasetamol';

--################################################################### AYNI ETKEN MADDELİ MUADİLİNİ BULMA ###################################################################
SELECT 
    alt_m.barcode AS muadil_barkod,
    alt_m.medicineName AS muadil_ilac_adi,
    alt_m.price AS muadil_fiyati,
    alt_m.stockQuantity AS depo_stok_adedi,
    ai.chemicalName AS ortak_etken_madde
FROM MEDICINES alt_m
JOIN MEDICINE_INGREDIENTS mi_alt ON alt_m.barcode = mi_alt.barcode
JOIN ACTIVEINGREDIENTS ai ON mi_alt.ingredientID = ai.ingredientID
WHERE mi_alt.ingredientID IN (
    -- İÇ SORGU: Stoğu azalan ilacın tüm etken maddelerini bulur
    SELECT mi.ingredientID 
    FROM MEDICINES m
    JOIN MEDICINE_INGREDIENTS mi ON m.barcode = mi.barcode
    WHERE m.medicineName = 'Parol Plus Tablet'
)
AND alt_m.medicineName != 'Parol Plus Tablet' -- Kendisini listeden çıkarıyoruz
AND alt_m.stockQuantity > 0; -- Sadece depoda gerçekten var olan muadilleri getirir

-- SIRADAKİ 2 QUERY BİRBİRİNE YAKIN
--################################################################### SKT'Sİ GEÇMİŞ OLAN İLAÇLAR ###################################################################
SELECT 
    BATCHES.batchNO AS parti_numarasi,
    MEDICINES.medicineName AS ilac_adi,
    BATCHES.quantityReceived AS partideki_urun_adedi,
    BATCHES.expirationDate AS son_kullanma_tarihi,
    STORAGESECTIONS.sectionName AS bulundugu_depo_reyonu,
    MANUFACTURERS.companyName AS uretici_firma
FROM BATCHES
JOIN MEDICINES ON BATCHES.barcode = MEDICINES.barcode
JOIN STORAGESECTIONS ON MEDICINES.sectionID = STORAGESECTIONS.sectionID
JOIN MANUFACTURERS ON MEDICINES.manufacturerCode = MANUFACTURERS.manufacturerCode
-- Son kullanma tarihi bugünden küçük (geçmiş) olanları filtreler
WHERE BATCHES.expirationDate < CURRENT_DATE
ORDER BY BATCHES.expirationDate ASC;

--################################################################### SKT'SİNE 1 AY KALANLAR ###################################################################
SELECT 
    BATCHES.batchNO AS parti_numarasi,
    MEDICINES.medicineName AS ilac_adi,
    BATCHES.quantityReceived AS partideki_urun_adedi,
    BATCHES.expirationDate AS son_kullanma_tarihi,
    -- İlacın bozulmasına tam kaç gün kaldığını matematiksel olarak hesaplar
    (BATCHES.expirationDate - CURRENT_DATE) AS kalan_gun_sayisi,
    STORAGESECTIONS.sectionName AS bulundugu_depo_reyonu,
    MANUFACTURERS.companyName AS uretici_firma
FROM BATCHES
JOIN MEDICINES ON BATCHES.barcode = MEDICINES.barcode
JOIN STORAGESECTIONS ON MEDICINES.sectionID = STORAGESECTIONS.sectionID
JOIN MANUFACTURERS ON MEDICINES.manufacturerCode = MANUFACTURERS.manufacturerCode
-- Tarihi henüz geçmemiş ama önümüzdeki 30 gün içinde dolacak olanları filtreler
WHERE BATCHES.expirationDate >= CURRENT_DATE 
  AND BATCHES.expirationDate <= CURRENT_DATE + 30
ORDER BY BATCHES.expirationDate ASC;

-- ###################################################################  ECZANE ENVANTERİ ###################################################################
SELECT 
    PHARMACIES.sicil_no AS eczane_sicil_numarasi,
    PHARMACIES.pharmacyName AS eczane_adi,
    MEDICINES.barcode AS ilac_barkodu,
    MEDICINES.medicineName AS ilac_adi,
    -- Eczanenin bu ilaçtan toplamda kaç kutu satın aldığını hesaplar
    SUM(ORDERDETAILS.quantity) AS toplam_satin_alinan_kutu,
    -- Bu ilaçlar için eczanenin ödediği toplam maliyet
    SUM(ORDERDETAILS.quantity * ORDERDETAILS.unitPrice) AS toplam_harcanan_tutar
FROM PHARMACIES
JOIN ORDERS ON PHARMACIES.sicil_no = ORDERS.sicil_no
JOIN ORDERDETAILS ON ORDERS.orderID = ORDERDETAILS.orderID
JOIN MEDICINES ON ORDERDETAILS.barcode = MEDICINES.barcode
-- Buraya envanterini görmek istediğin eczanenin adını yazabilirsin (Örn: 'Hayat Eczanesi')
WHERE PHARMACIES.sicil_no = '1234567890123'
GROUP BY 
    PHARMACIES.sicil_no, 
    PHARMACIES.pharmacyName, 
    MEDICINES.barcode, 
    MEDICINES.medicineName
ORDER BY toplam_satin_alinan_kutu DESC;
