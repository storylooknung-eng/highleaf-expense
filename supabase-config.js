// ============================================================
// HIGHLEAF Global — Supabase Configuration
//
// ✅  "anon public" key ปลอดภัยที่จะ commit ขึ้น GitHub
//     เพราะออกแบบมาสำหรับใช้ฝั่ง client โดยเฉพาะ
//     ความปลอดภัยของข้อมูลมาจาก RLS policy ใน Supabase
//
// ⛔  "service_role" key ห้าม commit เด็ดขาด (bypass RLS ทั้งหมด)
//
// วิธีหา credentials:
//   1. ไปที่ https://supabase.com/dashboard
//   2. เลือก Project ของคุณ
//   3. Settings → API
//   4. คัดลอก "Project URL" และ "anon public" key
// ============================================================

const SUPABASE_URL  = 'PASTE_YOUR_PROJECT_URL_HERE';   // เช่น https://xxxx.supabase.co
const SUPABASE_ANON = 'PASTE_YOUR_ANON_KEY_HERE';      // เริ่มต้นด้วย eyJ...

window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

// ตรวจสอบการเชื่อมต่อ
window.db.from('expenses').select('id', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) console.warn('[Supabase] เชื่อมต่อไม่สำเร็จ:', error.message);
    else console.log('[Supabase] เชื่อมต่อสำเร็จ — พบ', count, 'รายการ');
  });
