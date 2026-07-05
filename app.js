let hotels = [];
let selectedHotel = null;

const templates = [
  {
    id: 'capacity',
    title: 'درخواست آپدیت ظرفیت',
    text: 'همکار گرامی {hotel}\nبا سلام و احترام، لطفاً ظرفیت اتاق‌های مجموعه را در پنل ایران‌هتل به‌روزرسانی بفرمایید تا فروش شما بدون وقفه ادامه داشته باشد.\nسپاسگزاریم - تیم تأمین ایران‌هتل'
  },
  {
    id: 'price',
    title: 'درخواست اصلاح قیمت',
    text: 'همکار گرامی {hotel}\nلطفاً قیمت‌های مجموعه را بررسی و در صورت نیاز اصلاح بفرمایید. به‌روزرسانی قیمت باعث افزایش شانس فروش و نمایش بهتر در ایران‌هتل می‌شود.\nبا تشکر - تیم تأمین ایران‌هتل'
  },
  {
    id: 'peak',
    title: 'فروش در پیک تایم',
    text: 'همکار گرامی {hotel}\nبا توجه به افزایش تقاضا، لطفاً ظرفیت‌های باقی‌مانده را باز بفرمایید تا مجموعه شما در صدر نتایج ایران‌هتل فروش بیشتری دریافت کند.\nتیم تأمین ایران‌هتل'
  },
  {
    id: 'contract',
    title: 'پیگیری قرارداد',
    text: 'همکار گرامی {hotel}\nبا سلام، جهت تکمیل/تمدید همکاری با ایران‌هتل لطفاً وضعیت قرارداد مجموعه را پیگیری بفرمایید.\nسپاسگزاریم - تیم تأمین ایران‌هتل'
  },
  {
    id: 'panelInfo',
    title: 'ارسال اطلاعات پنل',
    text: 'همکار گرامی {hotel}\n\nاطلاعات ورود به پنل هوشمند ایران‌هتل برای مجموعه شما به شرح زیر است:\n\nنام کاربری: {username}\nرمز عبور: {password}\n\nآدرس پنل:\nhttps://ihopannel.ir/\n\nلطفاً پس از ورود، نسبت به بررسی و به‌روزرسانی ظرفیت‌ها، نرخ‌ها و اطلاعات مجموعه اقدام فرمایید.\n\nدر صورت نیاز به راهنمایی، کارشناسان تیم تأمین ایران‌هتل همراه شما هستند.\n\nبا سپاس\nتیم تأمین ایران‌هتل'
  },
  {
    id: 'panel',
    title: 'فعال‌سازی پنل آی‌هتل',
    text: 'همکار گرامی {hotel}\nبرای مدیریت سریع‌تر ظرفیت، قیمت و فروش، لطفاً پنل آی‌هتل مجموعه را فعال و به‌روزرسانی بفرمایید.\nتیم تأمین ایران‌هتل'
  }
];

const $ = (id) => document.getElementById(id);

function toEnglishDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
}

function normalizeMobile(value) {
  if (!value) return '';
  const nums = toEnglishDigits(value)
    .split(/[;؛،,\s/\-]+/)
    .map(x => x.replace(/[^0-9]/g, ''))
    .filter(Boolean);
  let mobile = nums.find(x => /^09\d{9}$/.test(x));
  if (!mobile) mobile = nums.find(x => /^9\d{9}$/.test(x));
  if (mobile && mobile.length === 10 && mobile.startsWith('9')) mobile = '0' + mobile;
  return mobile || '';
}

function extractMobiles(value) {
  if (!value) return [];
  const nums = toEnglishDigits(value)
    .split(/[;؛،,\s/]+/)
    .map(x => x.replace(/[^0-9]/g, ''))
    .filter(Boolean);

  return nums
    .map(n => {
      if (/^09\d{9}$/.test(n)) return n;
      if (/^9\d{9}$/.test(n)) return '0' + n;
      if (/^989\d{9}$/.test(n)) return '0' + n.slice(2);
      return '';
    })
    .filter(Boolean);
}

function getHotelMobiles(h) {
  const items = [
    ...extractMobiles(h.reservePhone).map(m => ({ mobile: m, source: 'تلفن رزرو' })),
    ...extractMobiles(h.hotelPhone).map(m => ({ mobile: m, source: 'تلفن هتل' }))
  ];
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.mobile)) return false;
    seen.add(item.mobile);
    return true;
  });
}

function renderMobileOptions(h) {
  const select = $('mobileSelect');
  if (!select) return;
  const mobiles = getHotelMobiles(h);
  select.innerHTML = '';

  if (!mobiles.length) {
    select.innerHTML = '<option value="">شماره موبایلی برای این هتل پیدا نشد؛ دستی وارد کنید</option>';
    $('mobile').value = '';
    return;
  }

  select.innerHTML = [
    '<option value="">انتخاب شماره از لیست</option>',
    ...mobiles.map(item => `<option value="${item.mobile}">${item.mobile} - ${item.source}</option>`),
    '<option value="manual">ورود دستی / شماره دیگر</option>'
  ].join('');
  select.value = mobiles[0].mobile;
  $('mobile').value = mobiles[0].mobile;
}

function applyTemplate() {
  const tpl = templates.find(t => t.id === $('templateSelect').value) || templates[0];
  const hotelName = selectedHotel?.name || 'نام هتل';
  const username = $('panelUsername')?.value?.trim() || '---';
  const password = $('panelPassword')?.value?.trim() || '---';
  const isPanelInfo = tpl.id === 'panelInfo';

  if ($('panelCredentialsBox')) {
    $('panelCredentialsBox').style.display = isPanelInfo ? 'grid' : 'none';
  }

  $('message').value = tpl.text
    .replaceAll('{hotel}', hotelName)
    .replaceAll('{username}', username)
    .replaceAll('{password}', password);
}

function renderHotels() {
  const q = $('search').value.trim().toLowerCase();
  const city = $('cityFilter').value;
  const list = $('hotelList');
  const filtered = hotels.filter(h => {
    const hay = `${h.name} ${h.city} ${h.hotelCode}`.toLowerCase();
    return (!city || h.city === city) && (!q || hay.includes(q));
  }).slice(0, 120);

  list.innerHTML = filtered.map((h, i) => `
    <div class="hotel-item ${selectedHotel?.hotelCode === h.hotelCode ? 'active' : ''}" data-index="${hotels.indexOf(h)}">
      <div class="hotel-name">${h.name || '-'}</div>
      <div class="hotel-meta">
        <span class="pill">${h.city || '-'}</span>
        <span class="pill">کد: ${h.hotelCode || '-'}</span>
        <span class="pill">${h.type || '-'}</span>
        <span class="pill">رزرو: ${h.reservePhone || '-'}</span>
      </div>
    </div>
  `).join('') || '<div class="selected empty">موردی پیدا نشد.</div>';

  document.querySelectorAll('.hotel-item').forEach(el => {
    el.addEventListener('click', () => selectHotel(hotels[Number(el.dataset.index)]));
  });
}

function selectHotel(h) {
  selectedHotel = h;
  $('selectedHotel').classList.remove('empty');
  $('selectedHotel').innerHTML = `<b>${h.name}</b><br>شهر: ${h.city || '-'} | کد هتل: ${h.hotelCode || '-'}<br>تلفن رزرو: ${h.reservePhone || '-'}<br>تلفن هتل: ${h.hotelPhone || '-'}`;
  renderMobileOptions(h);
  applyTemplate();
  renderHotels();
}

function setStatus(text, ok = true) {
  const s = $('status');
  s.textContent = text;
  s.className = `status ${ok ? 'ok' : 'err'}`;
}

function addLog(channel, result) {
  const logs = JSON.parse(localStorage.getItem('notifyLogs') || '[]');
  logs.unshift({
    at: new Date().toLocaleString('fa-IR'),
    hotel: selectedHotel?.name || '-',
    mobile: $('mobile').value,
    channel,
    result
  });
  localStorage.setItem('notifyLogs', JSON.stringify(logs.slice(0, 50)));
  renderLogs();
}

function renderLogs() {
  const logs = JSON.parse(localStorage.getItem('notifyLogs') || '[]');
  $('logList').innerHTML = logs.map(l => `<div class="log"><b>${l.channel}</b> - ${l.result}<br>${l.hotel} | ${l.mobile}<br>${l.at}</div>`).join('') || '<div class="selected empty">هنوز لاگی ثبت نشده.</div>';
}

function openDeepLink(appUrl, fallbackUrl) {
  const openedAt = Date.now();
  window.location.href = appUrl;
  setTimeout(() => {
    if (Date.now() - openedAt < 1800 && fallbackUrl) {
      window.open(fallbackUrl, '_blank');
    }
  }, 1200);
}

function openChannel(kind) {
  const mobile = normalizeMobile($('mobile').value);
  const rawMessage = $('message').value.trim();
  const msg = encodeURIComponent(rawMessage);
  if (!mobile || !msg) return setStatus('شماره موبایل یا متن پیام کامل نیست.', false);

  navigator.clipboard?.writeText(rawMessage).catch(() => {});

  if (kind === 'whatsapp') {
    openDeepLink(`whatsapp://send?phone=98${mobile.slice(1)}&text=${msg}`, `https://wa.me/98${mobile.slice(1)}?text=${msg}`);
  }
  if (kind === 'telegram') {
    openDeepLink(`tg://msg?text=${msg}`, `https://t.me/share/url?url=&text=${msg}`);
  }
  if (kind === 'bale') {
    openDeepLink(`bale://share?text=${msg}`, `https://ble.ir/share/url?url=&text=${msg}`);
  }
  addLog(kind, 'اپلیکیشن باز شد / متن کپی شد');
}

async function sendSms() {
  const mobile = normalizeMobile($('mobile').value);
  const message = $('message').value.trim();
  if (!mobile || !message) return setStatus('شماره موبایل یا متن پیام کامل نیست.', false);
  $('sendSms').disabled = true;
  setStatus('در حال ارسال پیامک...');
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, message })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.message || 'خطا در ارسال');
    setStatus('پیامک با موفقیت ارسال شد.');
    addLog('SMS', 'ارسال موفق');
  } catch (e) {
    setStatus(e.message || 'خطا در ارسال پیامک', false);
    addLog('SMS', 'خطا');
  } finally {
    $('sendSms').disabled = false;
  }
}

async function init() {
  $('templateSelect').innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  const res = await fetch('./data/hotels.json');
  hotels = await res.json();
  $('hotelCount').textContent = hotels.length.toLocaleString('fa-IR');
  const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
  $('cityFilter').innerHTML += cities.map(c => `<option value="${c}">${c}</option>`).join('');
  renderHotels(); renderLogs(); applyTemplate();
}

$('search').addEventListener('input', renderHotels);
$('cityFilter').addEventListener('change', () => { $('selectedCity').textContent = $('cityFilter').value || 'همه شهرها'; renderHotels(); });
$('clearBtn').addEventListener('click', () => { $('search').value=''; $('cityFilter').value=''; $('selectedCity').textContent='همه شهرها'; renderHotels(); });
$('templateSelect').addEventListener('change', applyTemplate);
$('panelUsername')?.addEventListener('input', applyTemplate);
$('panelPassword')?.addEventListener('input', applyTemplate);
$('mobileSelect').addEventListener('change', () => {
  const value = $('mobileSelect').value;
  if (value && value !== 'manual') $('mobile').value = value;
  if (value === 'manual') $('mobile').focus();
});
$('sendSms').addEventListener('click', sendSms);
$('copyText').addEventListener('click', async () => { await navigator.clipboard.writeText($('message').value); setStatus('متن پیام کپی شد.'); addLog('Copy', 'کپی متن'); });
$('whatsappBtn').addEventListener('click', () => openChannel('whatsapp'));
$('telegramBtn').addEventListener('click', () => openChannel('telegram'));
$('baleBtn').addEventListener('click', () => openChannel('bale'));
init();
