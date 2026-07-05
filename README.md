# IranHotel Notify V0.5

نسخه سبک اطلاع‌رسانی هتل‌ها برای Vercel.

## امکانات
- جستجوی هتل‌ها از `data/hotels.json`
- انتخاب شماره موبایل هتل یا ورود دستی شماره
- ارسال پیامک با SMS.ir از طریق API Route
- قالب «ارسال اطلاعات پنل» با فیلد نام کاربری و رمز عبور
- مدیریت قالب‌ها از داخل خود پنل
- متغیرهای قالب: `{hotel}` `{city}` `{hotelCode}` `{mobile}` `{username}` `{password}`
- باز کردن واتساپ، تلگرام و بله با Deep Link و کپی خودکار متن
- تاریخچه ارسال در LocalStorage مرورگر

## تنظیمات Vercel
در Project > Settings > Environment Variables این دو مقدار را ثبت کنید:

```env
SMSIR_API_KEY=your-api-key
SMSIR_LINE_NUMBER=3000400705
```

بعد از ثبت، Redeploy بزنید.

## تغییر قالب‌های پیش‌فرض
قالب‌های اولیه داخل این فایل هستند:

```txt
data/templates.json
```

اما در نسخه V0.5 از داخل خود سایت هم می‌توانید قالب‌ها را بسازید، ویرایش کنید، حذف کنید یا ریست کنید.
