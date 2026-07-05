let hotels = [];
let templates = [];
let defaultTemplates = [];
let selectedHotel = null;
let editingTemplateId = null;

const STORAGE_KEY = 'ihoNotifyTemplatesV05';
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
  if (!mobile) mobile = nums.find(x => /^989\d{9}$/.test(x));
  if (mobile && mobile.length === 10 && mobile.startsWith('9')) mobile = '0' + mobile;
  if (mobile && mobile.startsWith('989')) mobile = '0' + mobile.slice(2);
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
    ...extractMobiles(h.hotelPhone).map(m => ({ mobile: m, source: 'تلفن هتل' })),
    ...extractMobiles(h.mobile).map(m => ({ mobile: m, source: 'موبایل' }))
  ];
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.mobile)) return false;
    seen.add(item.mobile);
    return true;
  });
}

function saveTemplatesToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function loadTemplatesFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

function refreshTemplateSelects(keepSelected = true) {
  const current = keepSelected ? $('templateSelect')?.value : '';
  $('templateSelect').innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  if (current && templates.some(t => t.id === current)) $('templateSelect').value = current;

  $('manageTemplateSelect').innerHTML = templates.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
  if (editingTemplateId && templates.some(t => t.id === editingTemplateId)) $('manageTemplateSelect').value = editingTemplateId;
  else editingTemplateId = templates[0]?.id || null;
  if (editingTemplateId) $('manageTemplateSelect').value = editingTemplateId;
}

function needsCredentials(tpl) {
  return /\{username\}|\{password\}/.test(tpl?.text || '') || tpl?.id === 'panelInfo';
}

function applyTemplate() {
  const tpl = templates.find(t => t.id === $('templateSelect').value) || templates[0];
  if (!tpl) return;
  const hotelName = selectedHotel?.name || 'نام هتل';
  const username = $('panelUsername')?.value?.trim() || '---';
  const password = $('panelPassword')?.value?.trim() || '---';
  const mobile = normalizeMobile($('mobile')?.value || '') || '---';

  if ($('panelCredentialsBox')) {
    $('panelCredentialsBox').style.display = needsCredentials(tpl) ? 'grid' : 'none';
  }

  $('message').value = tpl.text
    .replaceAll('{hotel}', hotelName)
    .replaceAll('{city}', selectedHotel?.city || '---')
    .replaceAll('{hotelCode}', selectedHotel?.hotelCode || '---')
    .replaceAll('{mobile}', mobile)
    .replaceAll('{username}', username)
    .replaceAll('{password}', password);
}

function renderMobileOptions(h) {
  const select = $('mobileSelect');
  const mobiles = getHotelMobiles(h);
  select.innerHTML = '';

  if (!mobiles.length) {
    select.innerHTML = '<option value="">شماره موبایلی برای این هتل پیدا نشد؛ دستی وارد کنید</option>';
    $('mobile').value = '';
    applyTemplate();
    return;
  }

  select.innerHTML = [
    '<option value="">انتخاب شماره از لیست</option>',
    ...mobiles.map(item => `<option value="${item.mobile}">${item.mobile} - ${item.source}</option>`),
    '<option value="manual">ورود دستی / شماره دیگر</option>'
  ].join('');
  select.value = mobiles[0].mobile;
  $('mobile').value = mobiles[0].mobile;
  applyTemplate();
}

function renderHotels() {
  const q = $('search').value.trim().toLowerCase();
  const city = $('cityFilter').value;
  const list = $('hotelList');
  const filtered = hotels.filter(h => {
    const hay = `${h.name} ${h.city} ${h.hotelCode}`.toLowerCase();
    return (!city || h.city === city) && (!q || hay.includes(q));
  }).slice(0, 120);

  list.innerHTML = filtered.map(h => `
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
  renderHotels();
}

function setStatus(text, ok = true, target = 'status') {
  const s = $(target);
  if (!s) return;
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
  localStorage.setItem('notifyLogs', JSON.stringify(logs.slice(0, 80)));
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
    if (Date.now() - openedAt < 1800 && fallbackUrl) window.open(fallbackUrl, '_blank');
  }, 1200);
}

function openChannel(kind) {
  const mobile = normalizeMobile($('mobile').value);
  const rawMessage = $('message').value.trim();
  const msg = encodeURIComponent(rawMessage);
  if (!rawMessage) return setStatus('متن پیام کامل نیست.', false);
  if (kind === 'whatsapp' && !mobile) return setStatus('برای واتساپ شماره موبایل لازم است.', false);

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

function showTab(panelId) {
  document.querySelectorAll('.tab').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === panelId));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === panelId));
}

function loadTemplateEditor(id) {
  editingTemplateId = id || $('manageTemplateSelect').value || templates[0]?.id;
  const tpl = templates.find(t => t.id === editingTemplateId);
  if (!tpl) return;
  $('manageTemplateSelect').value = tpl.id;
  $('manageTemplateTitle').value = tpl.title;
  $('manageTemplateText').value = tpl.text;
  setStatus('', true, 'templateStatus');
}

function makeId(title) {
  const base = toEnglishDigits(title || 'template').replace(/[^a-zA-Z0-9آ-ی]+/g, '-').replace(/^-|-$/g, '') || 'template';
  let id = base;
  let i = 2;
  while (templates.some(t => t.id === id)) id = `${base}-${i++}`;
  return id;
}

function saveCurrentTemplate() {
  const title = $('manageTemplateTitle').value.trim();
  const text = $('manageTemplateText').value.trim();
  if (!title || !text) return setStatus('عنوان و متن قالب نباید خالی باشد.', false, 'templateStatus');

  let tpl = templates.find(t => t.id === editingTemplateId);
  if (!tpl) {
    tpl = { id: makeId(title), title, text };
    templates.push(tpl);
    editingTemplateId = tpl.id;
  } else {
    tpl.title = title;
    tpl.text = text;
  }
  saveTemplatesToStorage();
  refreshTemplateSelects();
  loadTemplateEditor(editingTemplateId);
  applyTemplate();
  setStatus('قالب ذخیره شد.', true, 'templateStatus');
}

function newTemplate() {
  const tpl = { id: makeId('new-template'), title: 'قالب جدید', text: 'همکار گرامی {hotel}\nمتن پیام را اینجا بنویسید.\n\nتیم تأمین ایران‌هتل' };
  templates.push(tpl);
  editingTemplateId = tpl.id;
  saveTemplatesToStorage();
  refreshTemplateSelects(false);
  loadTemplateEditor(tpl.id);
  setStatus('قالب جدید ساخته شد. متن را ویرایش و ذخیره کنید.', true, 'templateStatus');
}

function deleteCurrentTemplate() {
  if (templates.length <= 1) return setStatus('حداقل یک قالب باید باقی بماند.', false, 'templateStatus');
  const tpl = templates.find(t => t.id === editingTemplateId);
  if (!tpl) return;
  if (!confirm(`قالب «${tpl.title}» حذف شود؟`)) return;
  templates = templates.filter(t => t.id !== editingTemplateId);
  editingTemplateId = templates[0]?.id;
  saveTemplatesToStorage();
  refreshTemplateSelects(false);
  loadTemplateEditor(editingTemplateId);
  applyTemplate();
  setStatus('قالب حذف شد.', true, 'templateStatus');
}

function resetTemplates() {
  if (!confirm('همه تغییرات قالب‌ها حذف و قالب‌های اولیه برگردانده شود؟')) return;
  templates = JSON.parse(JSON.stringify(defaultTemplates));
  editingTemplateId = templates[0]?.id;
  localStorage.removeItem(STORAGE_KEY);
  refreshTemplateSelects(false);
  loadTemplateEditor(editingTemplateId);
  applyTemplate();
  setStatus('قالب‌ها بازنشانی شدند.', true, 'templateStatus');
}

async function init() {
  const [hotelRes, templateRes] = await Promise.all([
    fetch('./data/hotels.json'),
    fetch('./data/templates.json')
  ]);
  hotels = await hotelRes.json();
  defaultTemplates = await templateRes.json();
  templates = loadTemplatesFromStorage() || JSON.parse(JSON.stringify(defaultTemplates));
  editingTemplateId = templates[0]?.id;

  $('hotelCount').textContent = hotels.length.toLocaleString('fa-IR');
  const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
  $('cityFilter').innerHTML += cities.map(c => `<option value="${c}">${c}</option>`).join('');

  refreshTemplateSelects(false);
  loadTemplateEditor(editingTemplateId);
  renderHotels();
  renderLogs();
  applyTemplate();
}

// events
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)));
$('search').addEventListener('input', renderHotels);
$('cityFilter').addEventListener('change', () => { $('selectedCity').textContent = $('cityFilter').value || 'همه شهرها'; renderHotels(); });
$('clearBtn').addEventListener('click', () => { $('search').value=''; $('cityFilter').value=''; $('selectedCity').textContent='همه شهرها'; renderHotels(); });
$('templateSelect').addEventListener('change', applyTemplate);
$('panelUsername')?.addEventListener('input', applyTemplate);
$('panelPassword')?.addEventListener('input', applyTemplate);
$('mobile')?.addEventListener('input', applyTemplate);
$('mobileSelect').addEventListener('change', () => {
  const value = $('mobileSelect').value;
  if (value && value !== 'manual') $('mobile').value = value;
  if (value === 'manual') $('mobile').focus();
  applyTemplate();
});
$('sendSms').addEventListener('click', sendSms);
$('copyText').addEventListener('click', async () => { await navigator.clipboard.writeText($('message').value); setStatus('متن پیام کپی شد.'); addLog('Copy', 'کپی متن'); });
$('whatsappBtn').addEventListener('click', () => openChannel('whatsapp'));
$('telegramBtn').addEventListener('click', () => openChannel('telegram'));
$('baleBtn').addEventListener('click', () => openChannel('bale'));
$('manageTemplateSelect').addEventListener('change', () => loadTemplateEditor($('manageTemplateSelect').value));
$('newTemplate').addEventListener('click', newTemplate);
$('saveTemplate').addEventListener('click', saveCurrentTemplate);
$('deleteTemplate').addEventListener('click', deleteCurrentTemplate);
$('resetTemplates').addEventListener('click', resetTemplates);

init().catch(err => {
  console.error(err);
  setStatus('خطا در بارگذاری اطلاعات. فایل hotels.json یا templates.json را بررسی کنید.', false);
});
