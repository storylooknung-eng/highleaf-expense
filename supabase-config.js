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

const SUPABASE_URL  = 'https://mdgxxkutyrrxwdvzjvsy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ3h4a3V0eXJyeHdkdnpqdnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzQwNjUsImV4cCI6MjA5NTYxMDA2NX0.oeKSEAF-1rWr7tiMgKEeu8qTCXd8554fn-yfkKg_uPg';

window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

// ตรวจสอบการเชื่อมต่อ
window.db.from('expenses').select('id', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) console.warn('[Supabase] เชื่อมต่อไม่สำเร็จ:', error.message);
    else console.log('[Supabase] เชื่อมต่อสำเร็จ — พบ', count, 'รายการ');
  });
