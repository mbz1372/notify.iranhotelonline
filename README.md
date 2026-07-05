# Hotel Notify - IranHotel

نسخه ساده و بدون دیتابیس برای تست روی Vercel.

## امکانات
- جستجو بین ۹۱۳۰ هتل از فایل `all hotel Data.xlsx`
- انتخاب قالب پیام آماده
- ارسال پیامک با SMS.ir از طریق Serverless Function
- لینک سریع واتساپ، تلگرام و بله
- ذخیره تاریخچه ارسال در مرورگر کارشناس

## راه‌اندازی روی Vercel
1. این پوشه را در GitHub آپلود کنید یا ZIP را مستقیم در Vercel Import کنید.
2. در تنظیمات پروژه Vercel، این Environment Variableها را اضافه کنید:
   - `SMSIR_API_KEY`
   - `SMSIR_LINE_NUMBER`
3. Deploy بزنید.

## تست لوکال
```bash
npm i -g vercel
vercel dev
```

## نکته امنیتی
کلید SMS.ir داخل فرانت‌اند قرار نگرفته و فقط در API سمت Vercel استفاده می‌شود.
