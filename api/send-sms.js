export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, message: 'Method not allowed' });

  try {
    const apiKey = process.env.SMSIR_API_KEY;
    const lineNumber = process.env.SMSIR_LINE_NUMBER;

    if (!apiKey || !lineNumber) {
      return res.status(400).json({
        ok: false,
        message: 'SMSIR_API_KEY یا SMSIR_LINE_NUMBER در Environment Variables تنظیم نشده است.'
      });
    }

    const { mobile, message } = req.body || {};
    const normalizedMobile = String(mobile || '').replace(/[^0-9]/g, '');
    const text = String(message || '').trim();

    if (!/^09\d{9}$/.test(normalizedMobile)) {
      return res.status(400).json({ ok: false, message: 'شماره موبایل معتبر نیست. فرمت صحیح: 09xxxxxxxxx' });
    }
    if (!text) {
      return res.status(400).json({ ok: false, message: 'متن پیام خالی است.' });
    }

    const smsRes = await fetch('https://api.sms.ir/v1/send/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({
        lineNumber: Number(lineNumber),
        messageText: text,
        mobiles: [normalizedMobile]
      })
    });

    const data = await smsRes.json().catch(() => null);
    if (!smsRes.ok) {
      return res.status(smsRes.status).json({ ok: false, message: 'خطا در ارسال از SMS.ir', data });
    }

    return res.status(200).json({ ok: true, message: 'پیامک ارسال شد.', data });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message || 'خطای ناشناخته' });
  }
}
