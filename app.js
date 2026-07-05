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
    id: 'panel',
    title: 'فعال‌سازی پنل آی‌هتل',
    text: 'همکار گرامی {hotel}\nبرای مدیریت سریع‌تر ظرفیت، قیمت و فروش، لطفاً پنل آی‌هتل مجموعه را فعال و به‌روزرسانی بفرمایید.\nتیم تأمین ایران‌هتل'
  }
];

const $ = (id) => document.getElementById(id);

function normalizeMobile(value) {
  if (!value) return '';
  const nums = String(value).split(/[;،,\s]+/).map(x => x.replace(/[^0-9]/g, '')).filter(Boolean);
  let mobile = nums.find(x => /^09\d{9}$/.test(x));
  if (!mobile) mobile = nums.find(x => /^9\d{9}$/.test(x));
  if (mobile && mobile.length === 10 && mobile.startsWith('9')) mobile = '0' + mobile;
  return mobile || '';
}

function applyTemplate() {
  const tpl = templates.find(t => t.id === $('templateSelect').value) || templates[0];
  const hotelName = selectedHotel?.name || 'نام هتل';
  $('message').value = tpl.text.replaceAll('{hotel}', hotelName);
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
  $('mobile').value = normalizeMobile(h.reservePhone) || normalizeMobile(h.hotelPhone);
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

function openChannel(kind) {
  const mobile = normalizeMobile($('mobile').value);
  const msg = encodeURIComponent($('message').value.trim());
  if (!mobile || !msg) return setStatus('شماره موبایل یا متن پیام کامل نیست.', false);
  if (kind === 'whatsapp') window.open(`https://wa.me/98${mobile.slice(1)}?text=${msg}`, '_blank');
  if (kind === 'telegram') window.open(`https://t.me/share/url?url=&text=${msg}`, '_blank');
  if (kind === 'bale') window.open(`https://ble.ir/share/url?url=&text=${msg}`, '_blank');
  addLog(kind, 'لینک باز شد');
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
$('sendSms').addEventListener('click', sendSms);
$('copyText').addEventListener('click', async () => { await navigator.clipboard.writeText($('message').value); setStatus('متن پیام کپی شد.'); addLog('Copy', 'کپی متن'); });
$('whatsappBtn').addEventListener('click', () => openChannel('whatsapp'));
$('telegramBtn').addEventListener('click', () => openChannel('telegram'));
$('baleBtn').addEventListener('click', () => openChannel('bale'));
init();
