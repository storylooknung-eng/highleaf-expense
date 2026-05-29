-- ============================================================
-- HIGHLEAF Global — ระบบเบิกเงิน
-- Supabase SQL Schema
-- รันใน Supabase Dashboard → SQL Editor
-- ============================================================

-- ตารางรายการเบิกเงิน
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT        PRIMARY KEY,
  date        DATE        NOT NULL,
  person      TEXT        NOT NULL,
  dept        TEXT        NOT NULL DEFAULT '',
  cat         TEXT        NOT NULL DEFAULT 'travel'
                          CHECK (cat IN ('travel','supply','market','meal','utility')),
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  note        TEXT        DEFAULT '',
  hue         INTEGER     DEFAULT 140,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- เปิด Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตทุกคนอ่านและเขียนได้ (สำหรับ prototype — ปรับเพิ่ม Auth ภายหลัง)
CREATE POLICY "public_read"   ON expenses FOR SELECT USING (true);
CREATE POLICY "public_insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update" ON expenses FOR UPDATE USING (true) WITH CHECK (true);

-- Index สำหรับ query เร็วขึ้น
CREATE INDEX IF NOT EXISTS expenses_date_idx    ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS expenses_status_idx  ON expenses (status);
CREATE INDEX IF NOT EXISTS expenses_person_idx  ON expenses (person);

-- ============================================================
-- Seed data — ข้อมูลตัวอย่าง (optional)
-- ลบ block นี้ออกถ้าไม่ต้องการข้อมูลเริ่มต้น
-- ============================================================
INSERT INTO expenses (id, date, person, dept, cat, amount, status, note, hue) VALUES
('EXP-1048','2026-05-29','ศิริพร วงศ์ทอง','การตลาด','market',8500,'approved','ค่าโฆษณา Facebook Ads',45),
('EXP-1047','2026-05-29','ธนกร อินทรา','ปฏิบัติการ','travel',1200,'pending','ค่าแท็กซี่ไปพบลูกค้า',200),
('EXP-1046','2026-05-28','ปวีณา รัตนชัย','การเงิน','supply',3600,'approved','อุปกรณ์สำนักงาน',120),
('EXP-1045','2026-05-28','อนุชา ภักดี','คลังสินค้า','meal',2200,'approved','เลี้ยงรับรองคู่ค้า',300),
('EXP-1044','2026-05-27','กิตติพงษ์ แสงเดือน','ฝ่ายขาย','travel',950,'pending','ค่าน้ำมันรถส่งของ',180),
('EXP-1043','2026-05-26','นภัสสร เจริญสุข','การตลาด','market',12000,'approved','ออกบูธงานแสดงสินค้า',60),
('EXP-1042','2026-05-25','วีรภัทร ชูเกียรติ','ปฏิบัติการ','utility',4800,'approved','ค่าไฟฟ้าโรงเรือน',240),
('EXP-1041','2026-05-24','ศิริพร วงศ์ทอง','การตลาด','market',5500,'rejected','ถ่ายภาพผลิตภัณฑ์',90),
('EXP-1040','2026-05-23','ธนกร อินทรา','ปฏิบัติการ','supply',1800,'approved','เครื่องเขียน+หมึกพิมพ์',150),
('EXP-1039','2026-05-22','ปวีณา รัตนชัย','การเงิน','travel',2400,'approved','ค่าเดินทางสัมมนา จ.เชียงใหม่',220)
ON CONFLICT (id) DO NOTHING;
