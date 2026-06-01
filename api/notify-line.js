// Vercel Serverless Function — LINE Messaging API push notification
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token  = process.env.LINE_TOKEN;
  const userId = process.env.LINE_USER_ID;
  if (!token || !userId) return res.status(500).json({ error: "LINE credentials not configured" });

  const { person, amount, cat, note, id } = req.body || {};
  const text = [
    "🧾 รายการเบิกเงินใหม่",
    "─────────────────",
    `👤 ผู้เบิก : ${person || "-"}`,
    `💰 จำนวน  : ฿${Number(amount || 0).toLocaleString("th-TH")}`,
    `📂 หมวด   : ${cat || "-"}`,
    `📝 รายละเอียด : ${note || "-"}`,
    `🔖 รหัส   : ${id || "-"}`,
    "─────────────────",
    "🔗 อนุมัติได้ที่ https://highleaf-expense.vercel.app",
  ].join("\n");

  try {
    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : 502).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
