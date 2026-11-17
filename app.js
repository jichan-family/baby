/* 우리 아이 기록장 v1.0.0 */
'use strict';
var APP_VERSION = '1.0.0';

/* ───────── 기본 도우미 ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => (v === '' || v == null || isNaN(Number(v))) ? null : Number(v);
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  home: svg('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>'),
  chart: svg('<path d="M4 19h16"/><path d="M5 15l4-5 4 3 6-7"/>'),
  plus: svg('<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="M12 7.5v9M7.5 12h9" stroke="#fff" stroke-width="2.2"/>'),
  chat: svg('<path d="M5 18l-1 3 4-1.5A8 8 0 1 0 5 18z"/>'),
  health: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M9.5 11h5M12 8.5v5"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  down: svg('<path d="M6 9l6 6 6-6"/>'),
  back: svg('<path d="M15 18l-6-6 6-6"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  heartOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  photo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-8 8"/>')
};

const TAGS = [
  { k: 'first', l: '⭐ 처음 한 일' }, { k: 'word', l: '💬 새 말' }, { k: 'sick', l: '🏥 아픈 날' },
  { k: 'outing', l: '🚗 나들이' }, { k: 'anniv', l: '🎂 기념일' }
];
const tagLabel = k => (TAGS.find(t => t.k === k) || { l: k }).l;

/* 발달 이정표 기본 목록
   from/to: WHO 운동발달 기준(2006) 대부분의 아이가 해내는 기간
   by: CDC 발달 체크리스트(2022) 대부분(75%)의 아이가 이때까지 해냄 */
const DEFAULT_MS = [
  { key: 'head', t: '목 가누기', c: '몸', by: 4 },
  { key: 'roll', t: '뒤집기', c: '몸', by: 6 },
  { key: 'sit', t: '혼자 앉기', c: '몸', from: 3.8, to: 9.2 },
  { key: 'crawl', t: '기기', c: '몸', from: 5.2, to: 13.5 },
  { key: 'stand_help', t: '잡고 서기', c: '몸', from: 4.8, to: 11.4 },
  { key: 'walk_help', t: '잡고 걷기', c: '몸', from: 5.9, to: 13.7 },
  { key: 'stand', t: '혼자 서기', c: '몸', from: 6.9, to: 16.9 },
  { key: 'walk', t: '혼자 걷기', c: '몸', from: 8.2, to: 17.6 },
  { key: 'run', t: '뛰기', c: '몸', by: 24 },
  { key: 'kick', t: '공 차기', c: '몸', by: 24 },
  { key: 'stairs', t: '계단 오르기', c: '몸', by: 24 },
  { key: 'wave', t: '빠이빠이 손 흔들기', c: '손·생활', by: 12 },
  { key: 'blocks2', t: '블록 2개 쌓기', c: '손·생활', by: 15 },
  { key: 'cup', t: '컵으로 마시기', c: '손·생활', by: 18 },
  { key: 'spoon', t: '숟가락질 해보기', c: '손·생활', by: 18 },
  { key: 'scribble', t: '끄적이기', c: '손·생활', by: 18 },
  { key: 'mama', t: '엄마·아빠 부르기', c: '말', by: 12 },
  { key: 'point', t: '원하는 것 가리키기', c: '말', by: 15 },
  { key: 'word1', t: '첫 단어 (엄마·아빠 말고)', c: '말', by: 15 },
  { key: 'words3', t: '단어 3개 이상', c: '말', by: 18 },
  { key: 'follow1', t: '간단한 지시 따르기', c: '말', by: 18 },
  { key: 'body', t: '신체 부위 가리키기', c: '말', by: 24 },
  { key: 'two', t: '두 단어 문장', c: '말', by: 24 },
  { key: 'words50', t: '단어 50개', c: '말', by: 30 },
  { key: 'copy', t: '어른 행동 따라 하기', c: '사회', by: 18 }
];
const MS_CATS = ['몸', '손·생활', '말', '사회', '기타'];

/* 젖니 20개: 보통 나는 시기(개월) */
const TOOTH_NAMES = ['가운데 앞니', '옆 앞니', '송곳니', '첫째 어금니', '둘째 어금니'];
const TOOTH_RANGE = { U: [[8, 12], [9, 13], [16, 22], [13, 19], [25, 33]], L: [[6, 10], [10, 16], [17, 23], [14, 18], [23, 31]] };
const TEETH = [];
['U', 'L'].forEach(j => ['R', 'L'].forEach(s => [0, 1, 2, 3, 4].forEach(i => TEETH.push({
  code: j + s + i, jaw: j, side: s, i, name: (j === 'U' ? '위 ' : '아래 ') + (s === 'R' ? '오른쪽 ' : '왼쪽 ') + TOOTH_NAMES[i],
  from: TOOTH_RANGE[j][i][0], to: TOOTH_RANGE[j][i][1]
}))));

const WORD_CATS = ['사람', '음식', '동물', '물건', '탈것', '몸', '동작', '표현', '기타'];
const VISIT_KINDS = ['진료', '아픈 날', '치과', '응급실', '입원', '기타'];

/* ───────── 상태 ───────── */
const S = {
  token: LS.get('token', null), user: LS.get('user', null), data: LS.get('data', null),
  child: LS.get('child', null), showRef: LS.get('showRef', true),
  filter: { q: '', tag: '', month: '' }, page: 20, devTab: 'growth', measure: 'height', wordKind: 'word',
  wordQ: '', showDone: false, waitingSW: null, loading: false
};
const T = name => (S.data && S.data[name]) || [];

/* ───────── 날짜·나이 ───────── */
const pad = n => String(n).padStart(2, '0');
const parseD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const fmtD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => fmtD(new Date());
const diffDays = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const addMonths = (b, m) => { const y = b.getFullYear(), mo = b.getMonth() + m; const last = new Date(y, mo + 1, 0).getDate(); return new Date(y, mo, Math.min(b.getDate(), last)); };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const dayTitle = s => { const d = parseD(s); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})`; };

function age(child, date) {
  date = date || today();
  const b = parseD(child.birth), d = parseD(date);
  const days = diffDays(child.birth, date);
  let m = (d.getFullYear() - b.getFullYear()) * 12 + d.getMonth() - b.getMonth();
  while (m > 0 && addMonths(b, m) > d) m--;
  if (days < 0) m = 0;
  const rem = days < 0 ? 0 : Math.round((d - addMonths(b, m)) / 864e5);
  return { days, dplus: days + 1, months: m, rem, mDec: days / 30.4375 };
}
function monthText(m) { return m < 36 ? `${m}개월` : `만 ${Math.floor(m / 12)}세${m % 12 ? ' ' + (m % 12) + '개월' : ''}`; }
function ageLabel(child, date, long) {
  if (!child || !child.birth) return '';
  const a = age(child, date);
  if (a.days < 0) return '태어나기 전';
  return `D+${a.dplus} · ${monthText(a.months)}${long && a.months < 36 ? ' ' + a.rem + '일' : ''}`;
}

/* 날짜 정확도(정확한 날짜 / ○개월쯤 / 기간 / ○개월 이전) */
function dtLabel(r, child) {
  if (!r) return '';
  if (r.dateType === 'approx') return `약 ${r.month}개월`;
  if (r.dateType === 'range') return `${r.month}~${r.monthTo}개월`;
  if (r.dateType === 'before') return `${r.month}개월 이전`;
  if (isDate(r.date)) return child ? `${r.date.slice(2).replace(/-/g, '.')} (${monthText(age(child, r.date).months)})` : r.date;
  return '';
}
function dtMonth(r, child) {
  if (!r) return null;
  if (r.dateType === 'approx' || r.dateType === 'before') return num(r.month);
  if (r.dateType === 'range') return (num(r.month) + num(r.monthTo)) / 2;
  if (isDate(r.date) && child) return age(child, r.date).mDec;
  return null;
}
function dtForm(v, child) {
  v = v || {};
  const type = v.dateType || 'exact';
  const opt = [['exact', '정확한 날짜'], ['approx', '○개월쯤'], ['range', '기간'], ['before', '○개월 이전부터']];
  const cur = child ? age(child).months : '';
  return `<div class="dtf">
    <div class="chips" style="margin:4px 0 8px">${opt.map(([k, l]) => `<button type="button" class="chip ${k === type ? 'on' : ''}" data-act="dtType" data-v="${k}">${l}</button>`).join('')}</div>
    <input type="hidden" name="dateType" value="${type}">
    <div data-dt="exact" class="${type === 'exact' ? '' : 'hidden'}"><input class="i" type="date" name="date" value="${esc(isDate(v.date) ? v.date : today())}"></div>
    <div data-dt="approx" class="${type === 'approx' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_approx" value="${esc(v.month || '')}" placeholder="예: 10" style="width:110px"> <span class="muted">개월쯤</span></div>
    <div data-dt="range" class="${type === 'range' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_from" value="${esc(v.month || '')}" placeholder="9" style="width:80px"> ~ <input class="i" type="number" inputmode="decimal" name="m_to" value="${esc(v.monthTo || '')}" placeholder="11" style="width:80px"> <span class="muted">개월 사이</span></div>
    <div data-dt="before" class="${type === 'before' ? '' : 'hidden'} row"><input class="i" type="number" inputmode="decimal" name="m_before" value="${esc(v.month || cur)}" style="width:110px"> <span class="muted">개월 이전부터 (언제인지 모름)</span></div>
  </div>`;
}
function readDt(root) {
  const g = n => (root.querySelector(`[name="${n}"]`) || {}).value;
  const t = g('dateType');
  if (t === 'exact') { if (!isDate(g('date'))) throw new Error('날짜를 골라주세요.'); return { dateType: 'exact', date: g('date'), month: '', monthTo: '' }; }
  if (t === 'approx') { if (num(g('m_approx')) == null) throw new Error('몇 개월쯤인지 적어주세요.'); return { dateType: 'approx', date: '', month: num(g('m_approx')), monthTo: '' }; }
  if (t === 'range') { const a = num(g('m_from')), b = num(g('m_to')); if (a == null || b == null || b < a) throw new Error('기간을 바르게 적어주세요.'); return { dateType: 'range', date: '', month: a, monthTo: b }; }
  if (num(g('m_before')) == null) throw new Error('개월 수를 적어주세요.');
  return { dateType: 'before', date: '', month: num(g('m_before')), monthTo: '' };
}

/* ───────── 아이 ───────── */
const children = () => T('Children').slice().sort((a, b) => (num(a.order) || 0) - (num(b.order) || 0));
const childById = id => T('Children').find(c => c.id === id);
function curChild() {
  const cs = children();
  if (S.child === 'all' && cs.length > 1) return null;
  return cs.find(c => c.id === S.child) || cs[0] || null;
}
const pageChild = () => curChild() || children()[0] || null;

/* ───────── 서버 ───────── */
async function api(action, payload) {
  const url = APP_CONFIG.API_URL || '';
  if (!/^https:\/\/script\.google\.com\//.test(url)) throw new Error('config.js에 웹 앱 주소(API_URL)를 넣어주세요.');
  let res;
  try {
    res = await fetch(url, { method: 'POST', body: JSON.stringify(Object.assign({ action, token: S.token }, payload || {})) });
  } catch (e) { throw new Error('인터넷 연결을 확인해 주세요.'); }
  let j;
  try { j = await res.json(); } catch (e) { throw new Error('서버 응답을 읽지 못했어요. 웹 앱 배포 설정을 확인해 주세요.'); }
  if (!j.ok) {
    if (j.code === 'AUTH') { logoutLocal(); render(); }
    const err = new Error(j.error || '문제가 생겼어요.'); err.code = j.code; throw err;
  }
  return j;
}
function persist() { LS.set('data', S.data); }
function mergeRows(table, rows) {
  if (!S.data[table]) S.data[table] = [];
  const list = S.data[table];
  rows.forEach(r => {
    const i = list.findIndex(x => x.id === r.id);
    const dead = String(r.deleted).toUpperCase() === 'TRUE';
    if (dead) { if (i >= 0) list.splice(i, 1); }
    else if (i >= 0) list[i] = r; else list.push(r);
  });
  persist();
}
async function saveRow(table, row) { const j = await api('upsert', { table, row }); mergeRows(table, j.rows); return j.rows[0]; }
async function saveRows(table, rows) { if (!rows.length) return []; const j = await api('upsertMany', { table, rows }); mergeRows(table, j.rows); return j.rows; }
async function removeRow(table, id) { const j = await api('remove', { table, id }); mergeRows(table, j.rows); }
async function load() {
  S.loading = true;
  try {
    const j = await api('bootstrap');
    S.data = j.data; S.user = j.user; persist(); LS.set('user', S.user);
  } finally { S.loading = false; }
  render();
}
function logoutLocal() { S.token = null; LS.del('token'); }

/* ───────── 사진 ───────── */
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((ok, no) => { const r = indexedDB.open('baby-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => { this.db = r.result; ok(this.db); }; r.onerror = () => no(r.error); });
  },
  async get(k) { try { const db = await this.open(); return await new Promise(ok => { const q = db.transaction('p').objectStore('p').get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); }); } catch (e) { return null; } },
  async set(k, v) { try { const db = await this.open(); db.transaction('p', 'readwrite').objectStore('p').put(v, k); } catch (e) {} }
};
const memPhoto = new Map();
let hydrating = false;
async function hydratePhotos() {
  if (hydrating) return; hydrating = true;
  try {
    const imgs = $$('img[data-pid]:not([data-done])');
    const need = [];
    for (const img of imgs) {
      const id = img.dataset.pid;
      const v = memPhoto.get(id) || await IDB.get(id);
      if (v) { memPhoto.set(id, v); img.src = v; img.dataset.done = '1'; } else need.push(id);
    }
    const ids = Array.from(new Set(need));
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      try {
        const j = await api('photos', { ids: chunk });
        chunk.forEach(id => {
          const f = j.files[id]; if (!f) return;
          const url = `data:${f.mime};base64,${f.data}`;
          memPhoto.set(id, url); IDB.set(id, url);
          $$(`img[data-pid="${id}"]`).forEach(im => { im.src = url; im.dataset.done = '1'; });
        });
      } catch (e) { console.warn(e); break; }
    }
  } finally { hydrating = false; if ($('img[data-pid]:not([data-done])') && navigator.onLine) setTimeout(hydratePhotos, 1500); }
}
const splitPhoto = p => { const [t, f] = String(p).split(':'); return { thumb: t, full: f || t }; };
const photosOf = e => String(e.photos || '').split(',').filter(p => p && !p.startsWith('PAGE:')).map(splitPhoto);

async function resizeImage(file, max, q) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) {
    src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('이 사진은 열 수 없어요 (HEIC 사진이면 JPG로 바꿔 올려주세요).')); im.src = URL.createObjectURL(file); });
  }
  const w = src.width, h = src.height, s = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', q);
}
const b64 = dataUrl => dataUrl.slice(dataUrl.indexOf(',') + 1);

/* 사진 촬영 날짜 읽기 (EXIF) */
async function photoDate(file) {
  try {
    const buf = await file.slice(0, 262144).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xFFD8) return fallbackDate(file);
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off), size = v.getUint16(off + 2);
      if (marker === 0xFFE1 && v.getUint32(off + 4) === 0x45786966) {
        const t = off + 10, le = v.getUint16(t) === 0x4949;
        const u16 = o => v.getUint16(t + o, le), u32 = o => v.getUint32(t + o, le);
        const readIfd = (o, want) => {
          const n = u16(o); const found = {};
          for (let i = 0; i < n; i++) { const e = o + 2 + i * 12; const tag = u16(e); if (want.includes(tag)) found[tag] = { count: u32(e + 4), val: u32(e + 8) }; }
          return found;
        };
        const str = (ent) => { let s = ''; for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(t + ent.val + i)); return s; };
        const ifd0 = readIfd(u32(4), [0x8769, 0x0132]);
        let s = null;
        if (ifd0[0x8769]) { const ex = readIfd(ifd0[0x8769].val, [0x9003, 0x9004]); const e = ex[0x9003] || ex[0x9004]; if (e) s = str(e); }
        if (!s && ifd0[0x0132]) s = str(ifd0[0x0132]);
        if (s && /^\d{4}:\d{2}:\d{2}/.test(s) && !s.startsWith('0000')) return s.slice(0, 10).replace(/:/g, '-');
        return fallbackDate(file);
      }
      if ((marker & 0xFF00) !== 0xFF00) break;
      off += 2 + size;
    }
  } catch (e) {}
  return fallbackDate(file);
}
const fallbackDate = f => f.lastModified ? fmtD(new Date(f.lastModified)) : null;

/* ───────── 화면 틀 ───────── */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
}
function openSheet(html, onMount) {
  const s = $('#sheet');
  s.innerHTML = `<div class="panel">${html}</div>`;
  s.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (onMount) onMount(s.firstElementChild);
}
function closeSheet() { const s = $('#sheet'); s.classList.add('hidden'); s.innerHTML = ''; document.body.style.overflow = ''; }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, id] = h.split('/');
  return { name: name || 'home', id: id ? decodeURIComponent(id) : null };
}
const go = h => { if (location.hash === '#' + h) render(); else location.hash = h; };

function topBar(title) {
  const c = curChild();
  const many = children().length > 1;
  const who = title ? `<div class="page-title" style="margin:0">${esc(title)}</div>` :
    `<button class="name" data-act="pickChild">${esc(c ? c.name : '모든 아이')}${ICON.down.replace('<svg', '<svg style="width:18px;height:18px"')}</button>
     <div class="age">${c ? ageLabel(c, null, true) : many ? children().map(x => esc(x.name)).join(' · ') : ''}</div>`;
  return `<div class="top"><div class="who">${who}</div><button class="icon-btn" data-act="go" data-h="settings" aria-label="설정">${ICON.gear}</button></div>`;
}
function navBar(on) {
  const it = (h, ic, l) => `<a href="#${h}" class="${on === h ? 'on' : ''}">${ic}<span>${l}</span></a>`;
  return `<nav class="nav"><div class="nav-in">${it('home', ICON.home, '홈')}${it('dev', ICON.chart, '발달')}
    <a href="#new" class="plus" aria-label="기록 쓰기">${ICON.plus}</a>${it('words', ICON.chat, '단어장')}${it('health', ICON.health, '건강')}</div></nav>`;
}
const updateBanner = () => S.waitingSW ? `<div class="banner"><span>새 버전이 있어요.</span><button class="btn small" data-act="applyUpdate">업데이트</button></div>` : '';

function render() {
  const app = $('#app');
  if (!S.token) { app.innerHTML = loginView(); mountLogin(); return; }
  if (!S.data) { app.innerHTML = `<div class="splash"><img src="icons/icon-192.png" alt=""><p>기록을 불러오는 중…</p></div>`; if (!S.loading) load().catch(e => { app.innerHTML = errorView(e); }); return; }
  const r = route();
  const views = { home: homeView, dev: devView, words: wordsView, health: healthView, settings: settingsView, new: () => editorView(null), edit: () => editorView(r.id), entry: () => entryView(r.id), bulk: bulkView };
  const v = views[r.name] || homeView;
  app.innerHTML = v(r);
  if (r.name === 'new' || r.name === 'edit') mountEditor();
  if (r.name === 'bulk') mountBulk();
  hydratePhotos();
}
function errorView(e) {
  return `<div class="login"><img src="icons/icon-192.png" alt=""><h1>불러오지 못했어요</h1><p class="muted">${esc(e.message)}</p>
    <div class="btns" style="max-width:280px;margin:16px auto"><button class="btn primary" data-act="reload">다시 시도</button></div></div>`;
}

/* ───────── 로그인 ───────── */
function loginView() {
  return `<div class="login"><img src="icons/icon-192.png" alt=""><h1>우리 아이 기록장</h1>
    <p class="muted">가족 구글 계정으로 들어와 주세요.</p><div id="gbtn"></div><p id="loginErr" class="err"></p></div>`;
}
function loadScript(src) {
  return new Promise((ok, no) => {
    if ($(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('불러오기 실패: ' + src)); document.head.appendChild(s);
  });
}
async function mountLogin() {
  const errEl = () => $('#loginErr');
  try {
    if (!/apps\.googleusercontent\.com$/.test(APP_CONFIG.CLIENT_ID || '')) throw new Error('config.js에 클라이언트 ID를 넣어주세요.');
    await loadScript('https://accounts.google.com/gsi/client');
    google.accounts.id.initialize({
      client_id: APP_CONFIG.CLIENT_ID,
      callback: async r => {
        try {
          errEl().textContent = '확인하는 중…';
          const j = await api('login', { idToken: r.credential });
          S.token = j.token; S.user = { name: j.name, email: j.email };
          LS.set('token', S.token); LS.set('user', S.user);
          toast(`${j.name}, 반가워요!`);
          await load();
        } catch (e) { if (errEl()) errEl().textContent = e.message; }
      }
    });
    google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'ko' });
  } catch (e) { if (errEl()) errEl().textContent = e.message; }
}

/* ───────── 홈 ───────── */
function latestGrowth(child) {
  const rows = T('Growth').filter(g => g.childId === child.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const h = rows.find(g => num(g.height) != null), w = rows.find(g => num(g.weight) != null), hc = rows.find(g => num(g.head) != null);
  return { h, w, hc };
}
function nextVaccines(child, withinDays) {
  const t = today();
  return T('Vaccines').filter(v => (!child || v.childId === child.id) && v.status === '예정' && isDate(v.date) && v.date >= t)
    .sort((a, b) => a.date < b.date ? -1 : 1).filter(v => withinDays == null || diffDays(t, v.date) <= withinDays);
}
function homeView() {
  const c = curChild();
  let top = '';
  if (c) {
    const g = latestGrowth(c);
    const wc = T('Words').filter(w => w.childId === c.id && w.kind !== 'sentence').length;
    top = `<div class="sum">
      <div class="s coral"><small>키 · 몸무게</small><b>${g.h ? num(g.h.height) + 'cm' : '-'} · ${g.w ? num(g.w.weight) + 'kg' : '-'}</b></div>
      <div class="s honey" data-act="go" data-h="words"><small>말한 단어</small><b>${wc}개</b></div></div>`;
  }
  const nv = nextVaccines(c, 60);
  const vac = nv.slice(0, 2).map(v => `<div class="card notice" data-act="go" data-h="health"><span>${c ? '' : esc((childById(v.childId) || {}).name || '') + ' '}${esc(v.disease)} ${esc(v.dose)} 접종 예정</span><span class="d">D-${diffDays(today(), v.date)}</span></div>`).join('');
  const drafts = entries().filter(e => isTrue(e.draft)).length;
  const f = S.filter;
  const months = Array.from(new Set(entries().map(e => String(e.date).slice(0, 7)))).sort().reverse();
  return `${topBar()}${updateBanner()}<div class="page">${top}${vac}
    ${drafts ? `<div class="card notice" data-act="filterDraft"><span>내용을 채울 사진 기록 ${drafts}개</span><span class="d">보기</span></div>` : ''}
    <div class="row" style="margin:6px 0 8px">
      <input class="i grow" type="search" placeholder="기록 검색" value="${esc(f.q)}" data-in="search">
      <select class="i" style="width:auto" data-ch="month"><option value="">전체 기간</option>${months.map(m => `<option value="${m}" ${f.month === m ? 'selected' : ''}>${m.replace('-', '년 ')}월</option>`).join('')}</select>
    </div>
    <div class="chips" style="margin-bottom:4px"><button class="chip ${!f.tag ? 'on' : ''}" data-act="tagFilter" data-v="">전체</button>${TAGS.map(t => `<button class="chip ${f.tag === t.k ? 'on' : ''}" data-act="tagFilter" data-v="${t.k}">${t.l}</button>`).join('')}</div>
    <div id="tl">${timelineHtml()}</div></div>${navBar('home')}`;
}
const isTrue = v => String(v).toUpperCase() === 'TRUE';
function entries() {
  const c = curChild();
  return T('Entries').filter(e => !c || String(e.childIds || '').split(',').includes(c.id));
}
function timelineHtml() {
  const f = S.filter, q = f.q.trim().toLowerCase();
  let list = entries().filter(e => (!f.tag || (f.tag === '__draft' ? isTrue(e.draft) : String(e.tags).split(',').includes(f.tag)))
    && (!f.month || String(e.date).startsWith(f.month)) && (!q || String(e.text).toLowerCase().includes(q)));
  list.sort((a, b) => a.date === b.date ? (num(b.createdAt) || 0) - (num(a.createdAt) || 0) : (a.date < b.date ? 1 : -1));
  if (!list.length) return `<div class="card muted" style="text-align:center;padding:28px 12px">${T('Entries').length ? '조건에 맞는 기록이 없어요.' : '첫 기록을 남겨보세요. 아래 ＋ 버튼을 누르면 돼요.'}</div>`;
  const shown = list.slice(0, S.page);
  let html = '', lastDay = '';
  const many = children().length > 1;
  shown.forEach(e => {
    if (e.date !== lastDay) {
      lastDay = e.date;
      const kid = curChild() || childById(String(e.childIds).split(',')[0]);
      html += `<div class="day">${dayTitle(e.date)}${kid ? ' · ' + ageLabel(kid, e.date) : ''}</div>`;
    }
    const ph = photosOf(e);
    const hearts = T('Hearts').filter(h => h.entryId === e.id).length;
    const cm = T('Comments').filter(x => x.entryId === e.id).length;
    const tags = String(e.tags || '').split(',').filter(Boolean);
    const names = many ? String(e.childIds).split(',').map(id => (childById(id) || {}).name).filter(Boolean).join('·') : '';
    html += `<div class="card entry" data-act="go" data-h="entry/${e.id}">
      ${ph.length ? `<div class="thumb"><img data-pid="${ph[0].thumb}" alt="">${ph.length > 1 ? `<span class="more">+${ph.length - 1}</span>` : ''}</div>` : ''}
      <div class="grow"><div class="txt">${e.text ? esc(e.text) : `<span class="muted">${isTrue(e.draft) ? '내용을 채워주세요' : '사진 기록'}</span>`}</div>
      <div class="meta">${isTrue(e.draft) ? '<span class="tag draft">초안</span>' : ''}${tags.map(t => `<span class="tag ${t === 'first' ? 'star' : ''}">${tagLabel(t)}</span>`).join('')}
      ${names ? `<span>${esc(names)}</span>` : ''}<span>${esc(e.author || '')}</span>${hearts ? `<span>♥ ${hearts}</span>` : ''}${cm ? `<span>댓글 ${cm}</span>` : ''}</div></div></div>`;
  });
  if (list.length > S.page) html += `<button class="btn block" data-act="more">더 보기 (${list.length - S.page}개 남음)</button>`;
  return html;
}

/* ───────── 기록 쓰기 ───────── */
let E = null;
function editorView(id) {
  const ex = id ? T('Entries').find(e => e.id === id) : null;
  if (id && !ex) return `${topBar('기록')}<div class="page"><div class="card">기록을 찾을 수 없어요.</div></div>${navBar('')}`;
  const c = pageChild();
  if (!E || E.id !== (ex ? ex.id : null)) {
    E = ex ? { id: ex.id, date: ex.date, childIds: String(ex.childIds).split(',').filter(Boolean), photos: photosOf(ex).map(p => ({ existing: p })), text: ex.text || '', tags: String(ex.tags || '').split(',').filter(Boolean), msKey: '', newWords: '', dateTouched: true, draft: isTrue(ex.draft) }
      : { id: null, date: today(), childIds: c ? [c.id] : [], photos: [], text: '', tags: [], msKey: '', newWords: '', dateTouched: false };
  }
  const cs = children();
  return `<div class="top"><button class="icon-btn" data-act="cancelEdit">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">${ex ? '기록 고치기' : '새 기록'}</div></div></div>
  <div class="page"><div class="card">
    <label class="f">날짜</label><input class="i" type="date" id="e_date" value="${esc(E.date)}" max="${today()}">
    <div class="tiny muted" id="e_age" style="margin-top:4px">${editorAgeText()}</div>
    ${cs.length > 1 ? `<label class="f">누구의 기록인가요?</label><div class="chips">${cs.map(k => `<button type="button" class="chip ${E.childIds.includes(k.id) ? 'on' : ''}" data-act="eChild" data-v="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
    <label class="f">사진 (최대 5장)</label><div class="pics" id="e_pics">${editorPicsHtml()}</div>
    <input type="file" id="e_file" accept="image/*" multiple class="hidden">
    <label class="f">내용</label><textarea class="i" id="e_text" placeholder="오늘 있었던 일을 적어보세요">${esc(E.text)}</textarea>
    <label class="f">태그</label><div class="chips" id="e_tags">${TAGS.map(t => `<button type="button" class="chip ${E.tags.includes(t.k) ? 'on' : ''}" data-act="eTag" data-v="${t.k}">${t.l}</button>`).join('')}</div>
    <div id="e_extra">${editorExtraHtml()}</div>
    <p class="err" id="e_err"></p>
    <div class="progress hidden" id="e_prog"><div></div></div>
    <div class="btns"><button class="btn" data-act="cancelEdit">취소</button><button class="btn primary" data-act="saveEntry" id="e_save">저장</button></div>
  </div></div>`;
}
function editorAgeText() { const k = childById(E.childIds[0]); return k && isDate(E.date) ? ageLabel(k, E.date, true) : ''; }
function editorPicsHtml() {
  return E.photos.map((p, i) => `<div class="p">${p.existing ? `<img data-pid="${p.existing.thumb}" alt="">` : `<img src="${p.thumbUrl}" alt="">`}<button type="button" data-act="ePicDel" data-i="${i}">✕</button></div>`).join('')
    + (E.photos.length < 5 ? `<button type="button" class="add" data-act="ePicAdd" aria-label="사진 추가">${ICON.photo}</button>` : '');
}
function editorExtraHtml() {
  let h = '';
  if (E.tags.includes('first')) {
    const k = childById(E.childIds[0]);
    const done = k ? new Set(T('Milestones').filter(m => m.childId === k.id).map(m => m.key)) : new Set();
    const defs = allMsDefs().filter(d => !done.has(d.key));
    h += `<label class="f">발달 이정표에도 표시할까요? (선택)</label><select class="i" id="e_ms"><option value="">표시 안 함</option>${MS_CATS.map(cat => { const ds = defs.filter(d => d.c === cat); return ds.length ? `<optgroup label="${cat}">${ds.map(d => `<option value="${d.key}" ${E.msKey === d.key ? 'selected' : ''}>${esc(d.t)}</option>`).join('')}</optgroup>` : ''; }).join('')}</select>`;
  }
  if (E.tags.includes('word')) {
    h += `<label class="f">단어장에 추가할 말 (쉼표로 구분, 선택)</label><input class="i" id="e_words" placeholder="예: 까까, 아빠 차" value="${esc(E.newWords)}">
      <div class="tiny muted" style="margin-top:4px">띄어쓰기가 있으면 문장으로 저장돼요.</div>`;
  }
  return h;
}
function mountEditor() {
  const d = $('#e_date');
  d.addEventListener('change', () => { E.date = d.value; E.dateTouched = true; $('#e_age').textContent = editorAgeText(); });
  $('#e_text').addEventListener('input', ev => { E.text = ev.target.value; });
  $('#e_file').addEventListener('change', async ev => {
    const files = Array.from(ev.target.files || []).slice(0, 5 - E.photos.length);
    ev.target.value = '';
    for (const file of files) {
      try {
        const thumbUrl = await resizeImage(file, 360, 0.72);
        const fullUrl = await resizeImage(file, 1600, 0.82);
        const pd = await photoDate(file);
        E.photos.push({ thumbUrl, fullUrl, date: pd });
      } catch (e) { toast(e.message); }
    }
    const dates = E.photos.map(p => p.date).filter(isDate).sort();
    if (!E.id && !E.dateTouched && dates.length && dates[0] < today()) {
      E.date = dates[0]; d.value = E.date; $('#e_age').textContent = editorAgeText();
      toast(`사진 찍은 날(${E.date})로 날짜를 맞췄어요.`);
    }
    $('#e_pics').innerHTML = editorPicsHtml(); hydratePhotos();
  });
}
async function saveEntry() {
  const err = $('#e_err'), btn = $('#e_save'), prog = $('#e_prog');
  err.textContent = '';
  const ms = $('#e_ms'), wd = $('#e_words');
  if (ms) E.msKey = ms.value; if (wd) E.newWords = wd.value;
  if (!isDate(E.date)) return err.textContent = '날짜를 골라주세요.';
  if (!E.childIds.length) return err.textContent = '아이를 골라주세요.';
  if (!E.text.trim() && !E.photos.length) return err.textContent = '내용이나 사진을 넣어주세요.';
  btn.disabled = true; btn.textContent = '저장하는 중…';
  try {
    const newOnes = E.photos.filter(p => !p.existing);
    if (newOnes.length) prog.classList.remove('hidden');
    let done = 0;
    const photoStrs = [];
    for (const p of E.photos) {
      if (p.existing) { photoStrs.push(p.existing.thumb + ':' + p.existing.full); continue; }
      const j = await api('uploadPhoto', { date: E.date, thumb: b64(p.thumbUrl), full: b64(p.fullUrl) });
      const sp = splitPhoto(j.photo);
      memPhoto.set(sp.thumb, p.thumbUrl); IDB.set(sp.thumb, p.thumbUrl); memPhoto.set(sp.full, p.fullUrl); IDB.set(sp.full, p.fullUrl);
      p.existing = sp; photoStrs.push(j.photo);
      done++; prog.firstElementChild.style.width = Math.round(done / newOnes.length * 100) + '%';
    }
    const row = { id: E.id || uid(), date: E.date, childIds: E.childIds.join(','), text: E.text.trim(), tags: E.tags.join(','), photos: photoStrs.join(','), draft: '' };
    const saved = await saveRow('Entries', row);
    if (E.tags.includes('first') && E.msKey) {
      await saveRows('Milestones', E.childIds.map(cid => ({ id: cid + '_' + E.msKey, childId: cid, key: E.msKey, dateType: 'exact', date: E.date, month: '', monthTo: '', entryId: saved.id, deleted: '' })));
    }
    if (E.tags.includes('word') && E.newWords.trim()) {
      const ws = E.newWords.split(',').map(s => s.trim()).filter(Boolean);
      const rows = [];
      E.childIds.forEach(cid => ws.forEach(w => {
        if (T('Words').some(x => x.childId === cid && x.word === w)) return;
        rows.push({ id: uid() + rows.length, childId: cid, word: w, meaning: '', category: /\s/.test(w) ? '문장' : '기타', kind: /\s/.test(w) ? 'sentence' : 'word', dateType: 'exact', date: E.date });
      }));
      await saveRows('Words', rows);
    }
    E = null;
    toast('저장했어요.');
    go('entry/' + saved.id);
  } catch (e) {
    err.textContent = e.message; btn.disabled = false; btn.textContent = '저장';
  }
}

/* ───────── 기록 보기 ───────── */
function entryView(id) {
  const e = T('Entries').find(x => x.id === id);
  if (!e) return `${topBar('기록')}<div class="page"><div class="card">기록을 찾을 수 없어요.</div></div>${navBar('')}`;
  const kid = childById(String(e.childIds).split(',')[0]);
  const hearts = T('Hearts').filter(h => h.entryId === e.id);
  const mine = S.user && hearts.some(h => h.author === S.user.name);
  const cms = T('Comments').filter(x => x.entryId === e.id).sort((a, b) => (num(a.createdAt) || 0) - (num(b.createdAt) || 0));
  const tags = String(e.tags || '').split(',').filter(Boolean);
  const names = String(e.childIds).split(',').map(i => (childById(i) || {}).name).filter(Boolean).join(' · ');
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="name" style="font-size:16px">${dayTitle(e.date)}</div><div class="age">${kid ? ageLabel(kid, e.date, true) : ''}${children().length > 1 ? ' · ' + esc(names) : ''}</div></div>
    <button class="btn small ghost" data-act="go" data-h="edit/${e.id}">고치기</button></div>
  <div class="page">${photosOf(e).map(p => `<img class="photo-full" data-pid="${p.full}" alt="">`).join('')}
    <div class="card"><div style="white-space:pre-wrap;word-break:break-word">${e.text ? esc(e.text) : '<span class="muted">내용 없음</span>'}</div>
      <div class="meta" style="margin-top:8px">${tags.map(t => `<span class="tag ${t === 'first' ? 'star' : ''}">${tagLabel(t)}</span>`).join('')}<span>${esc(e.author || '')} 씀</span></div>
      <div class="between" style="margin-top:6px"><button class="heart ${mine ? 'on' : ''}" data-act="heart" data-id="${e.id}">${mine ? ICON.heartOn : ICON.heart}<span>${hearts.length ? hearts.map(h => esc(h.author)).join(', ') : '좋아요'}</span></button></div>
    </div>
    <div class="card"><div class="small muted">댓글</div>
      ${cms.map(cm => `<div class="cmt"><div class="between"><b class="small">${esc(cm.author)}</b>${S.user && cm.author === S.user.name ? `<button class="btn small ghost" data-act="delComment" data-id="${cm.id}">지우기</button>` : ''}</div><div style="white-space:pre-wrap">${esc(cm.text)}</div></div>`).join('')}
      <div class="row" style="margin-top:8px"><input class="i grow" id="c_text" placeholder="댓글 달기"><button class="btn small primary" data-act="addComment" data-id="${e.id}">등록</button></div>
    </div>
    <button class="btn block ghost danger" data-act="delEntry" data-id="${e.id}">이 기록 지우기</button>
  </div>${navBar('')}`;
}

/* ───────── 발달 ───────── */
function devView() {
  const c = pageChild();
  if (!c) return noChild('발달');
  const tabs = [['growth', '성장'], ['ms', '발달 이정표'], ['teeth', '이']];
  let body = S.devTab === 'ms' ? msHtml(c) : S.devTab === 'teeth' ? teethHtml(c) : growthHtml(c);
  return `${topBar()}${updateBanner()}<div class="page">
    <div class="between" style="margin-bottom:8px"><div class="seg grow" style="margin:0">${tabs.map(([k, l]) => `<button class="${S.devTab === k ? 'on' : ''}" data-act="devTab" data-v="${k}">${l}</button>`).join('')}</div>
    <button class="chip ${S.showRef ? 'on' : ''}" data-act="toggleRef" style="margin-left:8px">기준</button></div>
    ${body}</div>${navBar('dev')}`;
}
function noChild(where) { return `${topBar(where)}<div class="page"><div class="card">설정에서 아이를 먼저 등록해 주세요.</div></div>${navBar('')}`; }

/* 성장 도표 계산 (WHO LMS) */
function lmsAt(measure, sex, days) {
  const arr = WHO_LMS[measure][sex === 'F' ? 'F' : 'M'];
  const x = Math.max(0, days) / WHO_STEP;
  if (x >= arr.length - 1) return x > arr.length + 5 ? null : arr[arr.length - 1];
  const i = Math.floor(x), t = x - i, a = arr[i], b = arr[i + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
const zOf = (v, [L, M, S_]) => L ? (Math.pow(v / M, L) - 1) / (L * S_) : Math.log(v / M) / S_;
const valAtZ = (z, [L, M, S_]) => L ? M * Math.pow(1 + L * S_ * z, 1 / L) : M * Math.exp(S_ * z);
function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
const pctOfZ = z => 50 * (1 + erf(z / Math.SQRT2));
function percentile(child, measure, date, value) {
  const lms = lmsAt(measure, child.sex, age(child, date).days);
  if (!lms || value == null) return null;
  return pctOfZ(zOf(value, lms));
}
function pctText(p) {
  if (p == null) return '';
  if (p >= 99.5) return '또래 100명 중 99번째 이상';
  if (p < 1) return '또래 100명 중 1번째 미만';
  return `또래 100명 중 약 ${Math.max(1, Math.round(p))}번째`;
}
const MEASURES = { height: { l: '키', u: 'cm', f: 'height' }, weight: { l: '몸무게', u: 'kg', f: 'weight' }, head: { l: '머리둘레', u: 'cm', f: 'head' } };
function growthHtml(c) {
  const m = MEASURES[S.measure];
  const rows = T('Growth').filter(g => g.childId === c.id && num(g[m.f]) != null).sort((a, b) => a.date < b.date ? -1 : 1);
  const last = rows[rows.length - 1];
  const p = last && S.showRef ? percentile(c, S.measure, last.date, num(last[m.f])) : null;
  const all = T('Growth').filter(g => g.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  return `<div class="seg">${Object.keys(MEASURES).map(k => `<button class="${S.measure === k ? 'on' : ''}" data-act="measure" data-v="${k}">${MEASURES[k].l}</button>`).join('')}</div>
    <div class="card">${last ? `<div class="between"><div><b style="font-size:18px">${num(last[m.f])}${m.u}</b> <span class="small muted">${last.date.slice(2).replace(/-/g, '.')} · ${monthText(age(c, last.date).months)}</span></div>
      ${p != null ? `<span class="tag" style="background:var(--green-bg);color:var(--green-ink)">${pctText(p)}</span>` : ''}</div>` : `<div class="muted small">${m.l} 기록이 아직 없어요.</div>`}
      ${growthChart(c, S.measure, rows)}
      ${S.showRef ? `<div class="tiny muted">진한 띠: 또래 가운데 70% · 연한 띠: 94% · 점선: 평균 (WHO 성장 기준)</div>` : ''}</div>
    <div class="btns" style="margin-top:0;margin-bottom:10px"><button class="btn" data-act="growthEdit">＋ 측정 기록</button><button class="btn" data-act="growthPaste">표로 붙여넣기</button></div>
    <div class="card"><div class="small muted" style="margin-bottom:4px">측정 기록 ${all.length}개</div>
    ${all.slice(0, S.growthAll ? 999 : 12).map(g => `<div class="list-row" data-act="growthEdit" data-id="${g.id}"><span>${g.date.slice(2).replace(/-/g, '.')} <span class="tiny muted">${monthText(age(c, g.date).months)}</span></span>
      <span class="small">${[num(g.height) != null ? num(g.height) + 'cm' : '', num(g.weight) != null ? num(g.weight) + 'kg' : '', num(g.head) != null ? '머리 ' + num(g.head) : ''].filter(Boolean).join(' · ')}${g.source === '검진' ? ' <span class="tag">검진</span>' : ''}</span></div>`).join('')}
    ${all.length > 12 && !S.growthAll ? `<button class="btn block ghost" data-act="growthAll">전체 보기</button>` : ''}</div>`;
}
function growthChart(c, measure, rows) {
  const W = 340, H = 230, L = 36, R = 8, Tp = 10, B = 24;
  const nowM = age(c).mDec;
  const lastM = rows.length ? age(c, rows[rows.length - 1].date).mDec : 0;
  const xmax = Math.min(60, Math.max(12, Math.ceil((Math.max(nowM, lastM) + 2) / 6) * 6));
  const pts = rows.map(g => ({ x: age(c, g.date).mDec, y: num(g[MEASURES[measure].f]) })).filter(p => p.x >= 0);
  const curve = z => { const out = []; for (let mth = 0; mth <= xmax + 0.001; mth += xmax / 60) { const l = lmsAt(measure, c.sex, mth * 30.4375); if (l) out.push({ x: mth, y: valAtZ(z, l) }); } return out; };
  const Z = { p3: -1.881, p15: -1.036, p50: 0, p85: 1.036, p97: 1.881 };
  const cv = S.showRef ? Object.fromEntries(Object.entries(Z).map(([k, z]) => [k, curve(z)])) : null;
  let ys = pts.map(p => p.y);
  if (cv) ys = ys.concat(cv.p3.map(p => p.y), cv.p97.map(p => p.y));
  if (!ys.length) return '';
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const padY = (y1 - y0) * 0.06 || 1; y0 -= padY; y1 += padY;
  const sx = x => L + (x / xmax) * (W - L - R), sy = y => Tp + (1 - (y - y0) / (y1 - y0)) * (H - Tp - B);
  const path = arr => arr.map((p, i) => (i ? 'L' : 'M') + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1)).join(' ');
  const band = (a, b) => path(a) + ' ' + b.slice().reverse().map(p => 'L' + sx(p.x).toFixed(1) + ' ' + sy(p.y).toFixed(1)).join(' ') + ' Z';
  const step = xmax <= 24 ? 3 : 6;
  let grid = '';
  for (let x = 0; x <= xmax; x += step) grid += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${Tp}" y2="${H - B}" stroke="#F1E6D3"/><text x="${sx(x)}" y="${H - 8}" font-size="10" text-anchor="middle" fill="#B4A58E">${x}</text>`;
  const yStep = niceStep((y1 - y0) / 5);
  for (let y = Math.ceil(y0 / yStep) * yStep; y <= y1; y += yStep) grid += `<line x1="${L}" x2="${W - R}" y1="${sy(y)}" y2="${sy(y)}" stroke="#F1E6D3"/><text x="${L - 4}" y="${sy(y) + 3}" font-size="10" text-anchor="end" fill="#B4A58E">${+y.toFixed(1)}</text>`;
  const ref = cv ? `<path d="${band(cv.p3, cv.p97)}" fill="#F7E6D6"/><path d="${band(cv.p15, cv.p85)}" fill="#F2D3BC"/><path d="${path(cv.p50)}" fill="none" stroke="#D85A30" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>` : '';
  const line = pts.length > 1 ? `<path d="${path(pts)}" fill="none" stroke="#993C1D" stroke-width="1.6"/>` : '';
  const dots = pts.map(p => `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3.2" fill="#D85A30" stroke="#fff" stroke-width="1.2"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${MEASURES[measure].l} 성장 그래프">${grid}${ref}${line}${dots}
    <text x="${W - R}" y="${H - 8}" font-size="10" text-anchor="end" fill="#B4A58E" dy="-12">개월</text></svg>`;
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }

/* 이정표 */
function allMsDefs() {
  return DEFAULT_MS.concat(T('MilestoneDefs').map(d => ({ key: 'x_' + d.id, t: d.title, c: d.category || '기타', by: num(d.month), custom: d.id })));
}
function msHtml(c) {
  const defs = allMsDefs();
  const got = Object.fromEntries(T('Milestones').filter(m => m.childId === c.id).map(m => [m.key, m]));
  const nowM = age(c).mDec;
  const max = Math.max(36, Math.ceil(nowM / 6) * 6);
  const pos = m => Math.min(100, Math.max(0, m / max * 100));
  const doneN = defs.filter(d => got[d.key]).length;
  const groups = MS_CATS.map(cat => {
    const ds = defs.filter(d => d.c === cat);
    if (!ds.length) return '';
    return `<div class="sec-title">${cat}</div><div class="card" style="padding:4px 12px">${ds.map(d => {
      const g = got[d.key];
      const gm = g ? dtMonth(g, c) : null;
      let refBar = '';
      if (S.showRef && d.from != null) refBar = `<div class="rng" style="left:${pos(d.from)}%;width:${pos(d.to) - pos(d.from)}%"></div>`;
      else if (S.showRef && d.by != null) refBar = `<div class="rng" style="left:0;width:${pos(d.by)}%;opacity:.55"></div><div class="by" style="left:${pos(d.by)}%"></div>`;
      const dot = gm != null ? `<div class="dot ${g.dateType === 'exact' ? '' : 'hollow'}" style="left:${pos(gm)}%"></div>` : '';
      let status = g ? `<span class="small">${dtLabel(g, c)}</span>` : '<span class="small muted">아직</span>';
      const refTxt = S.showRef ? (d.from != null ? `보통 ${d.from}~${d.to}개월` : d.by != null ? `대부분 ${d.by}개월까지` : '') : '';
      return `<div class="ms" data-act="msEdit" data-k="${d.key}"><div class="between"><span>${g ? '✓ ' : ''}${esc(d.t)}</span>${status}</div>
        <div class="bar">${refBar}<div class="now" style="left:${pos(nowM)}%"></div>${dot}</div>${refTxt ? `<div class="tiny muted" style="margin-top:2px">${refTxt}</div>` : ''}</div>`;
    }).join('')}</div>`;
  }).join('');
  return `<div class="card small"><div class="between"><span>해낸 것 <b>${doneN}</b>개 · 아직 ${defs.length - doneN}개</span><button class="btn small" data-act="msAdd">＋ 항목 추가</button></div>
    ${S.showRef ? `<div class="tiny muted" style="margin-top:6px">막대 범위: 대부분의 아이가 해내는 시기 · 세로선: 지금 · 꽉 찬 점: 정확한 날짜 · 빈 점: 대략<br>아이마다 차이가 커요. 참고로만 봐주세요. (WHO 운동발달 기준, CDC 발달 체크리스트)</div>` : ''}</div>
    <div class="axis" style="margin:0 4px"><span>0</span><span>${max / 2}개월</span><span>${max}개월</span></div>${groups}`;
}

/* 이 */
function teethHtml(c) {
  const got = Object.fromEntries(T('Teeth').filter(t => t.childId === c.id).map(t => [t.tooth, t]));
  const n = Object.keys(got).length;
  const W = 300, cx = 150;
  const place = (t) => {
    const k = t.side === 'R' ? -1 : 1;
    const ang = (0.1 + t.i * 0.2) * Math.PI / 2;
    const x = cx + k * Math.sin(ang) * 118;
    const y = t.jaw === 'U' ? 100 - Math.cos(ang) * 70 : 140 + Math.cos(ang) * 70;
    const sz = [20, 18, 18, 24, 26][t.i];
    return { x, y, sz };
  };
  const teeth = TEETH.map(t => {
    const p = place(t), on = !!got[t.code];
    return `<g class="t" data-act="toothEdit" data-k="${t.code}"><rect x="${(p.x - p.sz / 2).toFixed(1)}" y="${(p.y - p.sz / 2).toFixed(1)}" width="${p.sz}" height="${p.sz}" rx="7" fill="${on ? '#D85A30' : '#fff'}" stroke="${on ? '#993C1D' : '#D3C4AA'}" stroke-width="1.5"/></g>`;
  }).join('');
  const list = TEETH.filter(t => got[t.code]).map(t => ({ t, g: got[t.code] })).sort((a, b) => (dtMonth(a.g, c) || 0) - (dtMonth(b.g, c) || 0));
  return `<div class="card"><div class="between"><span>난 이 <b>${n}</b>개 / 20개</span><button class="btn small" data-act="teethBulk">한꺼번에 체크</button></div>
    <div class="teeth"><svg viewBox="0 0 ${W} 240"><text x="${cx}" y="88" font-size="12" text-anchor="middle" fill="#B4A58E">위</text><text x="${cx}" y="160" font-size="12" text-anchor="middle" fill="#B4A58E">아래</text>${teeth}</svg></div>
    <div class="tiny muted">이를 누르면 난 날짜를 기록할 수 있어요.${S.showRef ? ' 보통 첫 이는 6~10개월쯤, 젖니 20개는 30개월 전후에 다 나요.' : ''}</div></div>
    ${list.length ? `<div class="card">${list.map(({ t, g }) => `<div class="list-row" data-act="toothEdit" data-k="${t.code}"><span>${t.name}</span><span class="small">${dtLabel(g, c)}</span></div>`).join('')}</div>` : ''}`;
}

/* ───────── 단어장 ───────── */
function wordsView() {
  const c = pageChild();
  if (!c) return noChild('단어장');
  const all = T('Words').filter(w => w.childId === c.id);
  const words = all.filter(w => w.kind !== 'sentence'), sents = all.filter(w => w.kind === 'sentence');
  const list = (S.wordKind === 'sentence' ? sents : words).filter(w => !S.wordQ || (w.word + ' ' + w.meaning).includes(S.wordQ));
  const cats = S.wordKind === 'sentence' ? ['문장'] : WORD_CATS;
  const byCat = cats.map(cat => {
    const ws = list.filter(w => (S.wordKind === 'sentence' ? true : (w.category || '기타') === cat)).sort((a, b) => (dtMonth(a, c) || 99) - (dtMonth(b, c) || 99));
    return ws.length ? `<div class="sec-title">${cat} <span>${ws.length}</span></div><div>${ws.map(w => `<span class="word" data-act="wordEdit" data-id="${w.id}">${esc(w.word)}${w.meaning ? `<small>${esc(w.meaning)}</small>` : ''}</span>`).join('')}</div>` : '';
  }).join('');
  const other = S.wordKind === 'word' ? list.filter(w => !WORD_CATS.includes(w.category || '기타')) : [];
  return `${topBar()}${updateBanner()}<div class="page">
    <div class="card between"><div><div class="big-num">${words.length}<span style="font-size:15px;font-weight:500;color:var(--ink2)"> 단어</span></div><div class="small muted">문장 ${sents.length}개</div></div>
      <button class="btn primary" data-act="wordEdit">＋ 추가</button></div>
    ${S.showRef ? `<div class="tiny muted" style="margin:-4px 4px 10px">참고: 보통 18개월쯤 3개 이상, 24개월쯤 두 단어 문장, 30개월쯤 50개 정도를 말해요. 아이마다 차이가 커요. (CDC)</div>` : ''}
    <div class="seg"><button class="${S.wordKind === 'word' ? 'on' : ''}" data-act="wordKind" data-v="word">단어</button><button class="${S.wordKind === 'sentence' ? 'on' : ''}" data-act="wordKind" data-v="sentence">문장</button></div>
    <input class="i" type="search" placeholder="찾기" value="${esc(S.wordQ)}" data-in="wordQ" style="margin-bottom:4px">
    <div id="wl">${byCat}${other.length ? `<div class="sec-title">기타</div>${other.map(w => `<span class="word" data-act="wordEdit" data-id="${w.id}">${esc(w.word)}</span>`).join('')}` : ''}
    ${list.length ? '' : '<div class="card muted" style="text-align:center">아직 없어요.</div>'}</div>
  </div>${navBar('words')}`;
}

/* ───────── 건강 ───────── */
function healthView() {
  const c = pageChild();
  if (!c) return noChild('건강');
  const vs = T('Vaccines').filter(v => v.childId === c.id);
  const plan = vs.filter(v => v.status !== '완료').sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1);
  const done = vs.filter(v => v.status === '완료').sort((a, b) => (a.date || '') < (b.date || '') ? 1 : -1);
  const nx = nextVaccines(c)[0];
  const ck = T('Checkups').filter(k => k.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const vis = T('Visits').filter(k => k.childId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const vRow = v => `<div class="list-row" data-act="vacEdit" data-id="${v.id}"><span>${esc(v.disease)} <span class="tiny muted">${esc(v.vaccine)} ${esc(v.dose)}</span></span>
    <span class="small" style="text-align:right">${v.date ? esc(v.date.slice(2).replace(/-/g, '.')) : '<span class="muted">날짜 모름</span>'}${v.status !== '완료' && isDate(v.date) && v.date >= today() && diffDays(today(), v.date) <= 365 ? `<br><span class="tiny" style="color:var(--accent)">D-${diffDays(today(), v.date)}</span>` : ''}</span></div>`;
  return `${topBar()}${updateBanner()}<div class="page">
    ${nx ? `<div class="card notice" data-act="vacEdit" data-id="${nx.id}"><span>다음 접종: <b>${esc(nx.disease)} ${esc(nx.dose)}</b><br><span class="small muted">${dayTitle(nx.date)}</span></span><span class="d">D-${diffDays(today(), nx.date)}</span></div>` : ''}
    <div class="sec-title">예방접종 예정 <button class="btn small" data-act="vacEdit">＋ 추가</button></div>
    <div class="card">${plan.length ? plan.map(vRow).join('') : '<div class="muted small">예정된 접종이 없어요.</div>'}</div>
    <div class="sec-title">완료한 접종 ${done.length}개 <button class="btn small ghost" data-act="toggleDone">${S.showDone ? '접기' : '펼치기'}</button></div>
    ${S.showDone ? `<div class="card">${done.map(vRow).join('')}</div>` : ''}
    <div class="sec-title">영유아검진 <button class="btn small" data-act="ckEdit">＋ 추가</button></div>
    <div class="card">${ck.length ? ck.map(k => `<div class="list-row" data-act="ckEdit" data-id="${k.id}"><span>${esc(k.date.slice(2).replace(/-/g, '.'))} <span class="tiny muted">${monthText(age(c, k.date).months)} · ${esc(k.place)}</span>
      <br><span class="tiny muted">키 ${esc(k.height)}${k.hPct ? `(${esc(k.hPct)})` : ''} · 몸무게 ${esc(k.weight)}${k.wPct ? `(${esc(k.wPct)})` : ''} · 머리 ${esc(k.head)}${k.hcPct ? `(${esc(k.hcPct)})` : ''}</span></span>
      <span class="small">${esc(k.overall)}</span></div>`).join('') : '<div class="muted small">검진 기록이 없어요.</div>'}</div>
    <div class="sec-title">병원 · 아픈 날 <button class="btn small" data-act="visitEdit">＋ 추가</button></div>
    <div class="card">${vis.length ? vis.map(k => `<div class="list-row" data-act="visitEdit" data-id="${k.id}"><span>${esc(k.date.slice(2).replace(/-/g, '.'))} <span class="tag">${esc(k.kind)}</span><br><span class="small">${esc(k.reason)}</span></span><span class="tiny muted">${esc(k.place)}</span></div>`).join('') : '<div class="muted small">기록이 없어요.</div>'}</div>
  </div>${navBar('health')}`;
}

/* ───────── 설정 ───────── */
function settingsView() {
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">설정</div></div></div>
  <div class="page">
    <div class="card"><div class="small muted">로그인</div><div>${esc(S.user ? S.user.name : '')} <span class="small muted">${esc(S.user ? S.user.email : '')}</span></div></div>
    <div class="sec-title">아이 <button class="btn small" data-act="childEdit">＋ 아이 추가</button></div>
    <div class="card">${children().map(c => `<div class="list-row" data-act="childEdit" data-id="${c.id}"><span>${esc(c.name)} <span class="tiny muted">${c.sex === 'F' ? '여아' : '남아'}</span></span><span class="small muted">${esc(c.birth)} · ${ageLabel(c)}</span></div>`).join('') || '<div class="muted small">등록된 아이가 없어요.</div>'}</div>
    <div class="sec-title">화면</div>
    <div class="card list-row" data-act="toggleRef"><span>발달·성장 기준 범위 보기</span><span class="small" style="color:var(--accent)">${S.showRef ? '켜짐' : '꺼짐'}</span></div>
    <div class="sec-title">지난 기록</div>
    <div class="card list-row" data-act="go" data-h="bulk"><span>지난 사진 한꺼번에 올리기<br><span class="tiny muted">찍은 날짜별로 묶어서 기록 초안을 만들어요 (PC 추천)</span></span><span>›</span></div>
    <div class="sec-title">보관</div>
    <div class="card"><div class="list-row" data-act="backup"><span>지금 백업 만들기<br><span class="tiny muted">구글 드라이브 '백업' 폴더에 시트 사본을 만들어요</span></span><span>›</span></div>
      <div class="list-row" data-act="exportAll"><span>전체 기록 내려받기<br><span class="tiny muted">표 기록을 엑셀에서 열 수 있는 파일(CSV)로 받아요</span></span><span>›</span></div></div>
    <div class="sec-title">앱</div>
    <div class="card"><div class="list-row" data-act="reload"><span>서버에서 다시 불러오기</span><span>›</span></div>
      <div class="list-row" data-act="logout"><span>로그아웃</span><span>›</span></div>
      <div class="list-row"><span class="muted">버전</span><span class="muted">${APP_VERSION}</span></div></div>
  </div>`;
}

/* ───────── 지난 사진 한꺼번에 ───────── */
let BULK = null;
function bulkView() {
  const cs = children();
  if (!BULK) BULK = { childIds: cs[0] ? [cs[0].id] : [], files: [], groups: [], running: false };
  return `<div class="top"><button class="icon-btn" data-act="back">${ICON.back}</button><div class="who"><div class="page-title" style="margin:0">지난 사진 올리기</div></div></div>
  <div class="page"><div class="card">
    <div class="small muted">사진을 여러 장 고르면 찍은 날짜별로 묶어서 기록 초안을 만들어요. 하루 사진이 많으면 5장씩 나눠서 만들어져요. 내용은 나중에 홈에서 채우면 돼요.</div>
    ${cs.length > 1 ? `<label class="f">누구의 사진인가요?</label><div class="chips">${cs.map(k => `<button class="chip ${BULK.childIds.includes(k.id) ? 'on' : ''}" data-act="bulkChild" data-v="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
    <label class="f">사진 고르기</label><input type="file" id="b_file" accept="image/*" multiple class="i">
    <div id="b_sum" class="small" style="margin-top:10px"></div>
    <div class="progress hidden" id="b_prog"><div></div></div>
    <div class="btns"><button class="btn primary" data-act="bulkRun" id="b_run" disabled>올리기</button></div>
  </div></div>`;
}
function mountBulk() {
  $('#b_file').addEventListener('change', async ev => {
    const files = Array.from(ev.target.files || []);
    $('#b_sum').textContent = '날짜를 읽는 중…';
    const items = [];
    for (const f of files) items.push({ f, date: (await photoDate(f)) || today() });
    const byDate = {};
    items.forEach(it => { (byDate[it.date] = byDate[it.date] || []).push(it); });
    const groups = [];
    Object.keys(byDate).sort().forEach(d => { const arr = byDate[d]; for (let i = 0; i < arr.length; i += 5) groups.push({ date: d, items: arr.slice(i, i + 5) }); });
    BULK.groups = groups;
    $('#b_sum').innerHTML = `사진 ${files.length}장 → 날짜 ${Object.keys(byDate).length}일 · 기록 ${groups.length}개가 만들어져요.<br><span class="tiny muted">${Object.keys(byDate).sort().slice(0, 8).map(d => `${d} (${byDate[d].length}장)`).join(', ')}${Object.keys(byDate).length > 8 ? ' …' : ''}</span>`;
    $('#b_run').disabled = !groups.length;
  });
}
async function bulkRun() {
  if (!BULK.groups.length || BULK.running) return;
  if (!BULK.childIds.length) return toast('아이를 골라주세요.');
  BULK.running = true;
  const btn = $('#b_run'), prog = $('#b_prog');
  btn.disabled = true; prog.classList.remove('hidden');
  const total = BULK.groups.reduce((s, g) => s + g.items.length, 0);
  let done = 0, made = 0;
  try {
    for (const g of BULK.groups) {
      const strs = [];
      for (const it of g.items) {
        try {
          const thumb = await resizeImage(it.f, 360, 0.72), full = await resizeImage(it.f, 1600, 0.82);
          const j = await api('uploadPhoto', { date: g.date, thumb: b64(thumb), full: b64(full) });
          const sp = splitPhoto(j.photo); memPhoto.set(sp.thumb, thumb); IDB.set(sp.thumb, thumb);
          strs.push(j.photo);
        } catch (e) { console.warn(e); }
        done++; prog.firstElementChild.style.width = Math.round(done / total * 100) + '%';
        btn.textContent = `올리는 중… ${done}/${total}`;
      }
      if (strs.length) { await saveRow('Entries', { id: uid(), date: g.date, childIds: BULK.childIds.join(','), text: '', tags: '', photos: strs.join(','), draft: 'TRUE' }); made++; }
    }
    toast(`기록 초안 ${made}개를 만들었어요.`);
    BULK = null; S.filter.tag = '__draft'; go('home');
  } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = '이어서 올리기'; }
  finally { if (BULK) BULK.running = false; }
}

/* ───────── 시트(입력 창)들 ───────── */
function formVal(root, n) { const el = root.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; }
function sheetButtons(delAct, id) {
  return `<p class="err" data-err></p><div class="btns">${delAct && id ? `<button class="btn danger" data-act="${delAct}" data-id="${id}">지우기</button>` : `<button class="btn" data-act="closeSheet">취소</button>`}<button class="btn primary" data-act="sheetSave">저장</button></div>`;
}
let sheetSave = null;
function bindSave(fn) { sheetSave = fn; }
async function runSheetSave() {
  const panel = $('#sheet .panel'); if (!panel || !sheetSave) return;
  const errEl = panel.querySelector('[data-err]'); const btn = panel.querySelector('[data-act="sheetSave"]');
  errEl.textContent = ''; btn.disabled = true; btn.textContent = '저장하는 중…';
  try { await sheetSave(panel); closeSheet(); render(); }
  catch (e) { errEl.textContent = e.message; btn.disabled = false; btn.textContent = '저장'; }
}

function growthSheet(id) {
  const c = pageChild();
  const g = id ? T('Growth').find(x => x.id === id) : { date: today() };
  openSheet(`<h3>${id ? '측정 기록 고치기' : '측정 기록 추가'}</h3>
    <label class="f">날짜</label><input class="i" type="date" name="date" value="${esc(g.date)}">
    <div class="grid3"><div><label class="f">키(cm)</label><input class="i" name="height" inputmode="decimal" value="${esc(g.height || '')}"></div>
    <div><label class="f">몸무게(kg)</label><input class="i" name="weight" inputmode="decimal" value="${esc(g.weight || '')}"></div>
    <div><label class="f">머리둘레(cm)</label><input class="i" name="head" inputmode="decimal" value="${esc(g.head || '')}"></div></div>
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g.memo || '')}">${sheetButtons('growthDel', id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id, date: formVal(p, 'date'), height: formVal(p, 'height'), weight: formVal(p, 'weight'), head: formVal(p, 'head'), memo: formVal(p, 'memo'), source: g.source || '' };
    if (!isDate(row.date)) throw new Error('날짜를 골라주세요.');
    if (['height', 'weight', 'head'].every(k => num(row[k]) == null)) throw new Error('값을 하나 이상 넣어주세요.');
    ['height', 'weight', 'head'].forEach(k => { if (row[k] && num(row[k]) == null) throw new Error('숫자만 넣어주세요.'); });
    await saveRow('Growth', row);
  });
}
function growthPasteSheet() {
  const c = pageChild();
  openSheet(`<h3>표로 붙여넣기</h3><div class="small muted">한 줄에 하나씩: 날짜 키 몸무게 머리둘레<br>엑셀에서 복사해 붙여넣어도 돼요. 없는 값은 - 로 적어주세요.</div>
    <textarea class="i" name="txt" style="min-height:160px;margin-top:8px" placeholder="2026-09-10 83.2 13.4 -&#10;2026-11-01 85 13.9 49"></textarea>${sheetButtons()}`);
  bindSave(async p => {
    const rows = [];
    formVal(p, 'txt').split('\n').map(s => s.trim()).filter(Boolean).forEach((line, i) => {
      const parts = line.split(/[\s,\t]+/);
      const d = parts[0].replace(/[./]/g, '-');
      if (!isDate(d)) throw new Error(`${i + 1}번째 줄의 날짜를 확인해 주세요.`);
      const v = k => parts[k] && parts[k] !== '-' ? parts[k] : '';
      rows.push({ id: uid() + i, childId: c.id, date: d, height: v(1), weight: v(2), head: v(3), memo: '', source: '' });
    });
    if (!rows.length) throw new Error('붙여넣을 내용이 없어요.');
    await saveRows('Growth', rows);
    toast(`${rows.length}개를 넣었어요.`);
  });
}
function msSheet(key) {
  const c = pageChild();
  const d = allMsDefs().find(x => x.key === key);
  const g = T('Milestones').find(m => m.childId === c.id && m.key === key);
  const ref = d.from != null ? `보통 ${d.from}~${d.to}개월 (WHO)` : d.by != null ? `대부분 ${d.by}개월까지 (CDC)` : '';
  openSheet(`<h3>${esc(d.t)}</h3>${ref && S.showRef ? `<div class="small muted">${ref}</div>` : ''}
    <label class="f">언제 했나요?</label>${dtForm(g || { dateType: 'exact' }, c)}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g ? g.memo : '')}">
    ${d.custom ? `<button class="btn small ghost danger" data-act="msDefDel" data-id="${d.custom}" style="margin-top:8px">이 항목 자체를 목록에서 빼기</button>` : ''}
    ${sheetButtons(g ? 'msDel' : null, g ? g.id : null)}`);
  bindSave(async p => {
    const dt = readDt(p);
    await saveRow('Milestones', Object.assign({ id: c.id + '_' + key, childId: c.id, key, memo: formVal(p, 'memo'), deleted: '' }, dt));
  });
}
function msAddSheet() {
  openSheet(`<h3>이정표 항목 추가</h3><label class="f">항목 이름</label><input class="i" name="title" placeholder="예: 혼자 신발 신기">
    <label class="f">분류</label><select class="i" name="category">${MS_CATS.map(c => `<option>${c}</option>`).join('')}</select>
    <label class="f">보통 해내는 시기 (개월, 모르면 비워두세요)</label><input class="i" name="month" inputmode="decimal">${sheetButtons()}`);
  bindSave(async p => {
    if (!formVal(p, 'title')) throw new Error('항목 이름을 적어주세요.');
    await saveRow('MilestoneDefs', { id: uid(), title: formVal(p, 'title'), category: formVal(p, 'category'), month: formVal(p, 'month') });
  });
}
function toothSheet(code) {
  const c = pageChild();
  const t = TEETH.find(x => x.code === code);
  const g = T('Teeth').find(x => x.childId === c.id && x.tooth === code);
  openSheet(`<h3>${t.name}</h3>${S.showRef ? `<div class="small muted">보통 ${t.from}~${t.to}개월에 나요.</div>` : ''}
    <label class="f">언제 났나요?</label>${dtForm(g || { dateType: 'exact' }, c)}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(g ? g.memo : '')}">${sheetButtons(g ? 'toothDel' : null, g ? g.id : null)}`);
  bindSave(async p => {
    await saveRow('Teeth', Object.assign({ id: c.id + '_' + code, childId: c.id, tooth: code, memo: formVal(p, 'memo'), deleted: '' }, readDt(p)));
  });
}
function teethBulkSheet() {
  const c = pageChild();
  const have = new Set(T('Teeth').filter(t => t.childId === c.id).map(t => t.tooth));
  openSheet(`<h3>지금 난 이 한꺼번에 체크</h3><div class="small muted">이미 난 이를 모두 고르면 '${age(c).months}개월 이전'으로 기록돼요. 날짜는 나중에 하나씩 고칠 수 있어요.</div>
    <div class="chips" style="margin-top:10px">${TEETH.map(t => `<button type="button" class="chip ${have.has(t.code) ? 'on' : ''}" data-act="chipToggle" data-v="${t.code}" ${have.has(t.code) ? 'disabled' : ''}>${t.name.replace('위 ', '위·').replace('아래 ', '아래·')}</button>`).join('')}</div>${sheetButtons()}`);
  bindSave(async p => {
    const picked = $$('.chip.on:not([disabled])', p).map(b => b.dataset.v);
    if (!picked.length) throw new Error('새로 고른 이가 없어요.');
    await saveRows('Teeth', picked.map(code => ({ id: c.id + '_' + code, childId: c.id, tooth: code, dateType: 'before', date: '', month: age(c).months, monthTo: '', memo: '', deleted: '' })));
  });
}
function wordSheet(id) {
  const c = pageChild();
  const w = id ? T('Words').find(x => x.id === id) : { kind: S.wordKind, category: S.wordKind === 'sentence' ? '문장' : '기타', dateType: 'exact' };
  openSheet(`<h3>${id ? '말 고치기' : '새로 한 말'}</h3>
    <div class="grid2"><div><label class="f">아이가 한 말</label><input class="i" name="word" value="${esc(w.word || '')}" placeholder="멈머"></div>
    <div><label class="f">뜻 (발음 메모)</label><input class="i" name="meaning" value="${esc(w.meaning || '')}" placeholder="멍멍이"></div></div>
    <div class="grid2"><div><label class="f">종류</label><select class="i" name="kind"><option value="word" ${w.kind !== 'sentence' ? 'selected' : ''}>단어</option><option value="sentence" ${w.kind === 'sentence' ? 'selected' : ''}>문장</option></select></div>
    <div><label class="f">분류</label><select class="i" name="category">${WORD_CATS.concat(['문장']).map(k => `<option ${w.category === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
    <label class="f">처음 말한 때</label>${dtForm(w, c)}
    <label class="f">메모</label><input class="i" name="memo" value="${esc(w.memo || '')}">${sheetButtons(id ? 'wordDel' : null, id)}`);
  bindSave(async p => {
    if (!formVal(p, 'word')) throw new Error('아이가 한 말을 적어주세요.');
    await saveRow('Words', Object.assign({ id: id || uid(), childId: c.id, word: formVal(p, 'word'), meaning: formVal(p, 'meaning'), kind: formVal(p, 'kind'), category: formVal(p, 'kind') === 'sentence' ? '문장' : formVal(p, 'category'), memo: formVal(p, 'memo') }, readDt(p)));
  });
}
function vacSheet(id) {
  const c = pageChild();
  const v = id ? T('Vaccines').find(x => x.id === id) : { status: '예정' };
  const willComplete = id && v.status !== '완료';
  openSheet(`<h3>${id ? esc(v.disease + ' ' + v.dose) : '접종 추가'}</h3>
    <div class="grid2"><div><label class="f">감염병</label><input class="i" name="disease" value="${esc(v.disease || '')}"></div><div><label class="f">백신</label><input class="i" name="vaccine" value="${esc(v.vaccine || '')}"></div></div>
    <div class="grid2"><div><label class="f">차수</label><input class="i" name="dose" value="${esc(v.dose || '')}" placeholder="2차"></div>
    <div><label class="f">상태</label><select class="i" name="status"><option ${v.status !== '완료' && !willComplete ? 'selected' : ''}>예정</option><option ${v.status === '완료' || willComplete ? 'selected' : ''}>완료</option></select></div></div>
    <label class="f">${willComplete ? '접종한 날' : '날짜'}</label><input class="i" type="date" name="date" value="${esc(willComplete ? today() : (v.date || ''))}">
    ${willComplete ? `<div class="tiny muted" style="margin-top:4px">예정일: ${esc(v.date || '-')} · 접종을 마쳤으면 날짜를 확인하고 저장하세요.</div>` : ''}
    <div class="grid2"><div><label class="f">접종기관</label><input class="i" name="place" value="${esc(v.place || '')}"></div><div><label class="f">백신명</label><input class="i" name="product" value="${esc(v.product || '')}"></div></div>
    <div class="grid2"><div><label class="f">제조사</label><input class="i" name="maker" value="${esc(v.maker || '')}"></div><div><label class="f">로트번호</label><input class="i" name="lot" value="${esc(v.lot || '')}"></div></div>
    <label class="f">비고</label><input class="i" name="note" value="${esc(v.note || '')}">${sheetButtons(id ? 'vacDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id };
    ['disease', 'vaccine', 'dose', 'status', 'date', 'place', 'product', 'maker', 'lot', 'note'].forEach(k => row[k] = formVal(p, k));
    if (!row.disease) throw new Error('감염병 이름을 적어주세요.');
    await saveRow('Vaccines', row);
  });
}
function ckSheet(id) {
  const c = pageChild();
  const k = id ? T('Checkups').find(x => x.id === id) : { date: today() };
  const f = (n, l, ph) => `<div><label class="f">${l}</label><input class="i" name="${n}" value="${esc(k[n] || '')}" ${ph ? `placeholder="${ph}"` : ''}></div>`;
  openSheet(`<h3>${id ? '영유아검진' : '영유아검진 추가'}</h3>
    <div class="grid2"><div><label class="f">검진일</label><input class="i" type="date" name="date" value="${esc(k.date)}"></div>${f('place', '검진기관')}</div>
    <div class="grid2">${f('height', '키(cm)')}${f('hPct', '키 백분위')}</div><div class="grid2">${f('weight', '몸무게(kg)')}${f('wPct', '몸무게 백분위')}</div>
    <div class="grid2">${f('head', '머리둘레(cm)')}${f('hcPct', '머리둘레 백분위')}</div>
    <div class="grid2">${f('dev', '발달평가', '양호')}${f('overall', '종합판정', '양호')}</div>${f('note', '소견')}
    <label class="f">결과지 (PDF·사진)</label>${k.fileId ? `<button class="btn small" data-act="openFile" data-id="${k.fileId}">첨부 보기</button> ` : ''}<input type="file" name="file" accept="application/pdf,image/*" class="i" style="margin-top:6px">
    ${sheetButtons(id ? 'ckDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id, fileId: k.fileId || '' };
    ['date', 'place', 'height', 'hPct', 'weight', 'wPct', 'head', 'hcPct', 'dev', 'overall', 'note'].forEach(n => row[n] = formVal(p, n));
    if (!isDate(row.date)) throw new Error('검진일을 골라주세요.');
    const file = p.querySelector('[name="file"]').files[0];
    if (file) {
      if (file.size > 8e6) throw new Error('파일이 너무 커요 (8MB 이하).');
      const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(b64(r.result)); r.onerror = no; r.readAsDataURL(file); });
      const j = await api('uploadFile', { name: `영유아검진_${row.date}_${file.name}`, mime: file.type, data });
      row.fileId = j.fileId;
    }
    await saveRow('Checkups', row);
    const same = T('Growth').find(g => g.childId === c.id && g.date === row.date);
    if (!same && [row.height, row.weight, row.head].some(v => num(v) != null)) {
      await saveRow('Growth', { id: uid(), childId: c.id, date: row.date, height: row.height, weight: row.weight, head: row.head, memo: '영유아검진' + (row.place ? '(' + row.place + ')' : ''), source: '검진' });
    }
  });
}
function visitSheet(id) {
  const c = pageChild();
  const v = id ? T('Visits').find(x => x.id === id) : { date: today(), kind: '진료' };
  openSheet(`<h3>${id ? '병원 · 아픈 날' : '병원 · 아픈 날 추가'}</h3>
    <div class="grid2"><div><label class="f">날짜</label><input class="i" type="date" name="date" value="${esc(v.date)}"></div>
    <div><label class="f">종류</label><select class="i" name="kind">${VISIT_KINDS.map(k => `<option ${v.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div></div>
    <label class="f">병원</label><input class="i" name="place" value="${esc(v.place || '')}">
    <label class="f">이유 · 증상</label><input class="i" name="reason" value="${esc(v.reason || '')}" placeholder="예: 열 38.5도, 콧물">
    <label class="f">메모 (진단, 처방, 경과)</label><textarea class="i" name="memo">${esc(v.memo || '')}</textarea>${sheetButtons(id ? 'visitDel' : null, id)}`);
  bindSave(async p => {
    const row = { id: id || uid(), childId: c.id };
    ['date', 'kind', 'place', 'reason', 'memo'].forEach(n => row[n] = formVal(p, n));
    if (!isDate(row.date)) throw new Error('날짜를 골라주세요.');
    await saveRow('Visits', row);
  });
}
function childSheet(id) {
  const k = id ? childById(id) : { sex: 'M', birth: '' };
  openSheet(`<h3>${id ? '아이 정보' : '아이 추가'}</h3>
    <label class="f">이름 (태명도 괜찮아요)</label><input class="i" name="name" value="${esc(k.name || '')}">
    <div class="grid2"><div><label class="f">성별</label><select class="i" name="sex"><option value="M" ${k.sex !== 'F' ? 'selected' : ''}>남아</option><option value="F" ${k.sex === 'F' ? 'selected' : ''}>여아</option></select></div>
    <div><label class="f">생일 (예정일)</label><input class="i" type="date" name="birth" value="${esc(k.birth || '')}"></div></div>
    <div class="tiny muted" style="margin-top:6px">성별은 성장 기준(남아·여아)을 고를 때 써요.</div>${sheetButtons()}`);
  bindSave(async p => {
    if (!formVal(p, 'name')) throw new Error('이름을 적어주세요.');
    if (!isDate(formVal(p, 'birth'))) throw new Error('생일을 골라주세요.');
    const row = await saveRow('Children', { id: id || 'c' + uid(), name: formVal(p, 'name'), sex: formVal(p, 'sex'), birth: formVal(p, 'birth'), order: id ? k.order : children().length + 1 });
    if (!id) { S.child = row.id; LS.set('child', S.child); }
  });
}
function pickChildSheet() {
  const cs = children();
  openSheet(`<h3>누구의 기록을 볼까요?</h3>
    ${cs.map(c => `<div class="list-row" data-act="setChild" data-v="${c.id}"><span>${esc(c.name)}</span><span class="small muted">${ageLabel(c)}</span></div>`).join('')}
    ${cs.length > 1 ? `<div class="list-row" data-act="setChild" data-v="all"><span>모든 아이</span><span></span></div>` : ''}
    <div class="btns"><button class="btn" data-act="closeSheet">닫기</button><button class="btn" data-act="childEdit">＋ 아이 추가</button></div>`);
}

/* ───────── 내려받기 ───────── */
async function exportAll() {
  toast('파일을 만드는 중…');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const zip = new JSZip();
  Object.keys(S.data).forEach(t => {
    const rows = S.data[t]; if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const csv = '﻿' + [cols.join(',')].concat(rows.map(r => cols.map(c => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(','))).join('\r\n');
    zip.file(t + '.csv', csv);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `우리아이기록장_${today()}.zip`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function openFile(id) {
  toast('파일을 여는 중…');
  const j = await api('file', { id }); const f = j.files[id];
  if (!f) return toast('파일을 찾을 수 없어요.');
  const bytes = Uint8Array.from(atob(f.data), ch => ch.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: f.mime }));
  const a = document.createElement('a'); a.href = url; a.download = f.name; a.target = '_blank'; a.click();
}

/* ───────── 이벤트 ───────── */
const ACT = {
  go: el => go(el.dataset.h),
  back: () => { if (history.length > 1) history.back(); else go('home'); },
  reload: () => { S.data = null; render(); },
  pickChild: () => pickChildSheet(),
  setChild: el => { S.child = el.dataset.v; LS.set('child', S.child); S.page = 20; closeSheet(); render(); },
  closeSheet: () => closeSheet(),
  sheetSave: () => runSheetSave(),
  applyUpdate: () => { if (S.waitingSW) S.waitingSW.postMessage('skipWaiting'); },
  more: () => { S.page += 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); },
  tagFilter: el => { S.filter.tag = el.dataset.v; S.page = 20; render(); },
  filterDraft: () => { S.filter.tag = '__draft'; render(); },
  /* 기록 쓰기 */
  cancelEdit: () => { E = null; ACT.back(); },
  eChild: el => { const v = el.dataset.v; E.childIds = E.childIds.includes(v) ? E.childIds.filter(x => x !== v) : E.childIds.concat(v); el.classList.toggle('on'); $('#e_age').textContent = editorAgeText(); },
  eTag: el => { const v = el.dataset.v; const ms = $('#e_ms'), wd = $('#e_words'); if (ms) E.msKey = ms.value; if (wd) E.newWords = wd.value; E.tags = E.tags.includes(v) ? E.tags.filter(x => x !== v) : E.tags.concat(v); el.classList.toggle('on'); $('#e_extra').innerHTML = editorExtraHtml(); },
  ePicAdd: () => $('#e_file').click(),
  ePicDel: el => { E.photos.splice(Number(el.dataset.i), 1); $('#e_pics').innerHTML = editorPicsHtml(); hydratePhotos(); },
  saveEntry: () => saveEntry(),
  delEntry: async el => { if (!confirm('이 기록을 지울까요? 사진 파일은 드라이브에 남아요.')) return; try { await removeRow('Entries', el.dataset.id); toast('지웠어요.'); go('home'); } catch (e) { toast(e.message); } },
  heart: async el => {
    const id = el.dataset.id, hid = id + '_' + S.user.name;
    try { if (T('Hearts').some(h => h.id === hid)) await removeRow('Hearts', hid); else await saveRow('Hearts', { id: hid, entryId: id, author: S.user.name, deleted: '' }); render(); } catch (e) { toast(e.message); }
  },
  addComment: async el => { const t = $('#c_text').value.trim(); if (!t) return; try { await saveRow('Comments', { id: uid(), entryId: el.dataset.id, text: t }); render(); } catch (e) { toast(e.message); } },
  delComment: async el => { if (!confirm('댓글을 지울까요?')) return; try { await removeRow('Comments', el.dataset.id); render(); } catch (e) { toast(e.message); } },
  /* 발달 */
  devTab: el => { S.devTab = el.dataset.v; render(); },
  measure: el => { S.measure = el.dataset.v; render(); },
  toggleRef: () => { S.showRef = !S.showRef; LS.set('showRef', S.showRef); render(); },
  growthAll: () => { S.growthAll = true; render(); },
  growthEdit: el => growthSheet(el.dataset.id),
  growthPaste: () => growthPasteSheet(),
  msEdit: el => msSheet(el.dataset.k),
  msAdd: () => msAddSheet(),
  toothEdit: el => toothSheet(el.dataset.k),
  teethBulk: () => teethBulkSheet(),
  chipToggle: el => el.classList.toggle('on'),
  dtType: el => { const root = el.closest('.dtf'); $$('.chip', root).forEach(b => b.classList.toggle('on', b === el)); root.querySelector('[name="dateType"]').value = el.dataset.v; $$('[data-dt]', root).forEach(d => d.classList.toggle('hidden', d.dataset.dt !== el.dataset.v)); },
  /* 단어 */
  wordKind: el => { S.wordKind = el.dataset.v; render(); },
  wordEdit: el => wordSheet(el.dataset.id),
  /* 건강 */
  toggleDone: () => { S.showDone = !S.showDone; render(); },
  vacEdit: el => vacSheet(el.dataset.id),
  ckEdit: el => ckSheet(el.dataset.id),
  visitEdit: el => visitSheet(el.dataset.id),
  openFile: el => openFile(el.dataset.id).catch(e => toast(e.message)),
  /* 설정 */
  childEdit: el => childSheet(el.dataset.id),
  backup: async () => { toast('백업을 만드는 중…'); try { const j = await api('backup'); toast(`'${j.name}'을 만들었어요.`); } catch (e) { toast(e.message); } },
  exportAll: () => exportAll().catch(e => toast(e.message)),
  logout: async () => { if (!confirm('로그아웃할까요?')) return; try { await api('logout'); } catch (e) {} logoutLocal(); LS.del('data'); S.data = null; render(); },
  bulkChild: el => { const v = el.dataset.v; BULK.childIds = BULK.childIds.includes(v) ? BULK.childIds.filter(x => x !== v) : BULK.childIds.concat(v); el.classList.toggle('on'); },
  bulkRun: () => bulkRun()
};
/* 지우기 버튼들 */
[['growthDel', 'Growth'], ['msDel', 'Milestones'], ['toothDel', 'Teeth'], ['wordDel', 'Words'], ['vacDel', 'Vaccines'], ['ckDel', 'Checkups'], ['visitDel', 'Visits'], ['msDefDel', 'MilestoneDefs']].forEach(([act, table]) => {
  ACT[act] = async el => { if (!confirm('지울까요?')) return; try { await removeRow(table, el.dataset.id); closeSheet(); render(); toast('지웠어요.'); } catch (e) { toast(e.message); } };
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in;
  if (k === 'search') { S.filter.q = e.target.value; S.page = 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); }
  if (k === 'wordQ') { S.wordQ = e.target.value.trim(); const pos = e.target.selectionStart; render(); const inp = $('[data-in="wordQ"]'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (er) {} } }
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.ch === 'month') { S.filter.month = e.target.value; S.page = 20; $('#tl').innerHTML = timelineHtml(); hydratePhotos(); }
});
window.addEventListener('hashchange', () => { closeSheet(); render(); window.scrollTo(0, 0); });

/* ───────── 시작 ───────── */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    const show = w => { S.waitingSW = w; if (S.data) render(); };
    if (reg.waiting && navigator.serviceWorker.controller) show(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) show(nw); });
    });
    setInterval(() => reg.update(), 3600e3);
  }).catch(() => {});
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing) return; refreshing = true; location.reload(); });
}
render();
if (S.token && S.data) load().catch(e => console.warn(e));
