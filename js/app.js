/* =====================================================================
   ColW — aplicación de una sola página (SPA) en JavaScript puro
   ===================================================================== */
'use strict';

// ------------------------------------------------------------ estado
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};
const state = {
  token: store.get('colw_token'),
  me: null,
  sectors: [],
  unread: 0,
  unreadMessages: 0,
  feed: { q: '', sector: '', tab: 'todos' },
  timers: [],
};

const CONTRALORIA_URL = 'https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaJuridica.aspx';
const DIAN_URL = 'https://www.dian.gov.co/';
const BUSINESS_TYPES = ['S.A.S.', 'S.A.', 'Ltda.', 'Persona natural', 'Emprendimiento', 'Cooperativa', 'ONG / Fundación', 'Otro'];
const COUNTRIES = ['Colombia', 'Argentina', 'Chile', 'Ecuador', 'España', 'Estados Unidos', 'México', 'Panamá', 'Perú', 'Venezuela', 'Otro'];
const CITIES = ['Cali, Valle del Cauca', 'Bogotá, Colombia', 'Medellín, Antioquia', 'Barranquilla, Atlántico', 'Cartagena, Bolívar', 'Bucaramanga, Santander', 'Pereira, Risaralda', 'Manizales, Caldas', 'Popayán, Cauca', 'Pasto, Nariño', 'Buenaventura, Valle', 'Palmira, Valle', 'Yumbo, Valle', 'Ibagué, Tolima', 'Neiva, Huila', 'Villavicencio, Meta', 'Santa Marta, Magdalena', 'Cúcuta, Norte de Santander', 'Armenia, Quindío', 'Tunja, Boyacá'];
const CATEGORIES = [
  { label: 'Empresas tecnológicas', sector: 'Tecnología', emoji: '🏙️', bg: 'linear-gradient(160deg,#93c5fd,#1e40af)' },
  { label: 'Empresas industriales', sector: 'Industria', emoji: '🦾', bg: 'linear-gradient(160deg,#fdba74,#1f2937)' },
  { label: 'Empresas agroindustriales', sector: 'Agroindustria', emoji: '🌱', bg: 'linear-gradient(160deg,#bbf7d0,#15803d)' },
  { label: 'Empresas de transporte', sector: 'Transporte', emoji: '🚛', bg: 'linear-gradient(160deg,#bfdbfe,#1d4ed8)' },
  { label: 'Empresas de construcción', sector: 'Construcción', emoji: '🏗️', bg: 'linear-gradient(160deg,#fde68a,#b45309)' },
  { label: 'Comercios y servicios', sector: 'Comercio y servicios', emoji: '🏬', bg: 'linear-gradient(160deg,#c7d2fe,#312e81)' },
];
// Historias de las cuentas de ejemplo: fotos libres (CC0, StockSnap) en img/stories/
const STORIES = {
  andestech: { img: 'img/stories/andestech.jpg', text: 'Así arrancamos el día: nuevo sprint de desarrollo para la plataforma de pagos de nuestros clientes. 💻' },
  agrosostenible: { img: 'img/stories/agrosostenible.jpg', text: 'Recorriendo los cultivos en Popayán. El campo también innova 🌾' },
  mariafer_ruiz: { img: 'img/stories/mariafer_ruiz.jpg', text: 'Agenda abierta esta semana para asesorías en planeación estratégica. ¡Escríbeme!' },
  construandes: { img: 'img/stories/construandes.jpg', text: 'Avance de obra: estructura del nuevo centro empresarial en Medellín al 70 %. 🏗️' },
  ecosolar: { img: 'img/stories/ecosolar.jpg', text: 'Instalación terminada: 120 paneles para una bodega en Barranquilla. ☀️' },
  logitrans: { img: 'img/stories/logitrans.jpg', text: 'Hoy en el puerto de Buenaventura despachando carga para exportación. 🚢' },
  agrofuturo: { img: 'img/stories/agrofuturo.jpg', text: 'Temporada de cosecha: café 100 % seleccionado a mano en Risaralda. ☕' },
  lauragomez: { img: 'img/stories/lauragomez.jpg', text: 'Taller de marketing con propósito para emprendedores. ¡Quedan pocos cupos!' },
  induspacifico: { img: 'img/stories/induspacifico.jpg', text: 'Nuestra planta en Yumbo sigue creciendo: nueva línea de producción en marcha. 🏭' },
};

const THEMES = {
  tech: { label: 'Tecnología', emoji: '💡', bg: 'linear-gradient(120deg,#0b1a4a 10%,#1e3a8a 55%,#2563eb)' },
  agro: { label: 'Campo', emoji: '🌱', bg: 'linear-gradient(120deg,#0f2e1a 10%,#166534 55%,#65a30d)' },
  travel: { label: 'Internacional', emoji: '✈️', bg: 'linear-gradient(120deg,#1e293b 10%,#334e8a 55%,#f59e0b)' },
  build: { label: 'Construcción', emoji: '🏗️', bg: 'linear-gradient(120deg,#1f2a44 10%,#3b4f7a 55%,#d97706)' },
  energy: { label: 'Energía', emoji: '☀️', bg: 'linear-gradient(120deg,#0c2340 10%,#0e7490 55%,#facc15)' },
  logistics: { label: 'Logística', emoji: '🚚', bg: 'linear-gradient(120deg,#111c3d 10%,#1d4ed8 55%,#60a5fa)' },
};
const PRODUCT_EMOJI = [
  [/c[oó]mputo|port[aá]til|computador|pc/i, '💻'], [/m[oó]vil|celular|smartphone|tel[eé]fono/i, '📱'],
  [/c[aá]mara|seguridad|cctv/i, '📹'], [/red|conectividad|internet|wifi/i, '🖧'], [/audio|aud[ií]fono|accesorio/i, '🎧'],
  [/impres|escaneo|esc[aá]ner/i, '🖨️'], [/software|desarrollo|app|web/i, '👨‍💻'], [/consultor|asesor/i, '💼'],
  [/soporte|t[eé]cnico|mantenimiento/i, '🛠️'], [/nube|cloud/i, '☁️'], [/inteligencia|ia\b|ai\b/i, '🤖'],
  [/servicio/i, '⚙️'], [/caf[eé]/i, '☕'], [/agr[ií]|abono|cultivo|riego|invernadero/i, '🌾'], [/solar|energ/i, '☀️'],
  [/carga|transporte|log[ií]stic|milla/i, '🚚'], [/vivienda|obra|constru|interventor/i, '🏗️'], [/marketing|branding|publicidad/i, '📣'],
  [/export|internacional|comercio exterior/i, '🌎'], [/impresi[oó]n 3d|3d/i, '🧊'], [/metal|automatiza/i, '⚙️'],
];

// ------------------------------------------------------------ utilidades
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('es-CO');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'Hace un momento';
  const m = s / 60, h = m / 60, d = h / 24;
  if (m < 60) return `Hace ${Math.floor(m)} min`;
  if (h < 24) return `Hace ${Math.floor(h)} ${Math.floor(h) === 1 ? 'hora' : 'horas'}`;
  if (d < 30) return `Hace ${Math.floor(d)} ${Math.floor(d) === 1 ? 'día' : 'días'}`;
  return new Date(iso).toLocaleDateString('es-CO');
}
function productEmoji(name) {
  for (const [re, e] of PRODUCT_EMOJI) if (re.test(name)) return e;
  return '📦';
}
function hashCode(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); }
function avatar(u, size = 48) {
  const name = u?.name || u?.company?.name || '?';
  const logo = u?.logo ?? u?.company?.logo;
  if (logo) return `<div class="avatar" style="width:${size}px;height:${size}px"><img src="${esc(logo)}" alt="${esc(name)}"></div>`;
  const palette = ['#1d4ed8', '#0f766e', '#7c3aed', '#b45309', '#be123c', '#0369a1', '#15803d', '#4338ca'];
  const bg = palette[hashCode(name) % palette.length];
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return `<div class="avatar" style="width:${size}px;height:${size}px;background:${bg};color:#fff;font-weight:800;font-size:${Math.round(size * 0.36)}px">${esc(ini)}</div>`;
}
function flag(country) {
  const F = {
    Colombia: [['#fcd116', 2], ['#003893', 1], ['#ce1126', 1]], Ecuador: [['#ffd100', 2], ['#034ea2', 1], ['#ed1c24', 1]],
    Venezuela: [['#ffcc00', 1], ['#00247d', 1], ['#cf142b', 1]], Argentina: [['#74acdf', 1], ['#fff', 1], ['#74acdf', 1]],
    España: [['#aa151b', 1], ['#f1bf00', 2], ['#aa151b', 1]], Chile: [['#fff', 1], ['#d52b1e', 1]],
  };
  if (!F[country]) return icon('globe', 20);
  return `<span class="flag">${F[country].map(([c, f]) => `<i style="background:${c};flex:${f}"></i>`).join('')}</span>`;
}
function brand({ sub = 'tag', size } = {}) {
  const arrow = `<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 20 4M9 4h11v11"/></svg>`;
  const subHtml = sub === 'tag'
    ? `<div class="brand-tag">Conectamos <span class="dot"></span> Informamos <span class="dot"></span> Transformamos</div>`
    : `<div class="brand-sub">RED QUE TRANSFORMA Y CONECTA EL MUNDO</div>`;
  return `<div class="brand"><div class="brand-logo" ${size ? `style="font-size:${size}px"` : ''}>Col<span class="w">W</span>${arrow}</div>${subHtml}</div>`;
}
function linkify(text) {
  return esc(text).replace(/#([\p{L}\p{N}_]+)/gu, '<span class="hashtag" data-tag="$1">#$1</span>');
}
function banner(post) {
  const t = THEMES[post.theme] || THEMES.tech;
  if (post.image) return `<div class="post-media photo"><img src="${esc(post.image)}" alt="${esc(post.title || 'Imagen')}"></div>`;
  return `<div class="post-media"><div class="banner" style="background:${t.bg}">
    <h3>${esc(post.title || (post.text || '').slice(0, 40))}</h3><span class="emoji">${t.emoji}</span>
    <span class="mark">Col<b>W</b></span></div></div>`;
}
function fileToDataUrl(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function uploadImage(file) {
  if (!/^image\/(png|jpe?g|svg\+xml|webp|gif)$/.test(file.type)) throw new Error('Formato no permitido. Usa JPG, PNG o SVG.');
  if (file.size > 2 * 1024 * 1024) throw new Error('La imagen supera el tamaño máximo de 2 MB.');
  const { url } = await api('POST', '/upload', { dataUrl: await fileToDataUrl(file) });
  return url;
}
function clearTimers() { state.timers.forEach(clearInterval); state.timers = []; }

// ------------------------------------------------------------ app instalable (PWA)
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('¡ColW quedó instalada!'); });
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
async function installApp() {
  if (installPrompt) {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    if (outcome === 'accepted') return;
  }
  const ios = isIOS();
  openModal(`<div class="modal-head"><h3>Instalar ColW</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><img src="img/icon-192.png" width="64" height="64" alt="" style="border-radius:16px;box-shadow:var(--shadow-sm)"><p style="margin:0;color:var(--muted)">Instala ColW para abrirla desde su ícono, a pantalla completa, como cualquier app.</p></div>
    <ol class="install-steps">
      ${ios
        ? `<li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> ${icon('upload', 18)} (arriba en iPad, abajo en iPhone).</li><li>Elige <b>Agregar a pantalla de inicio</b> y toca <b>Agregar</b>.</li>`
        : `<li>Abre esta página en <b>Chrome</b>.</li><li>Toca el menú <b>⋮</b> (arriba a la derecha).</li><li>Elige <b>Instalar aplicación</b> o <b>Agregar a la pantalla principal</b>.</li>`}
    </ol>
    <div class="form-actions"><button class="btn btn-primary" data-close>Entendido</button></div>`);
}

// ------------------------------------------------------------ API
async function api(method, path, body) {
  // Sin servidor: las rutas se resuelven en el navegador (js/mock-api.js).
  const res = await window.mockApi(method, path, body, state.token);
  const data = res.data || {};
  res.ok = res.status >= 200 && res.status < 300;
  if (res.status === 401 && state.token && !path.startsWith('/login')) { logoutLocal(); throw new Error(data.error || 'Sesión expirada.'); }
  if (!res.ok) throw new Error(data.error || 'Ocurrió un error.');
  return data;
}
function setSession(token, user) { state.token = token; state.me = user; store.set('colw_token', token); }
function logoutLocal() { state.token = null; state.me = null; store.set('colw_token', null); location.hash = '#/login'; }
async function refreshMe() { const { user } = await api('GET', '/me'); state.me = user; return user; }

// ------------------------------------------------------------ router
const routes = [
  [/^\/login$/, viewLogin, 'public'],
  [/^\/registro$/, viewRegister, 'public'],
  [/^\/recuperar$/, viewForgot, 'public'],
  [/^\/inicio$/, viewFeed],
  [/^\/explorar$/, viewExplore],
  [/^\/mensajes(?:\/([\w-]+))?$/, viewMessages],
  [/^\/mi-empresa$/, () => viewCompany(state.me.id)],
  [/^\/empresa\/([\w-]+)$/, viewCompany],
  [/^\/editar$/, viewEdit],
  [/^\/antecedentes$/, viewAntecedentes],
  [/^\/ajustes$/, viewSettings],
  [/^\/tienda\/([\w-]+)$/, viewStore],
  [/^\/producto\/([\w-]+)$/, viewProduct],
  [/^\/carrito$/, viewCart],
  [/^\/checkout$/, viewCheckout],
  [/^\/pedidos$/, viewOrders],
  [/^\/mis-productos$/, viewMyProducts],
  [/^\/producto-editar\/([\w-]+)$/, viewProductEdit],
  [/^\/tienda-ajustes$/, viewStoreSettings],
];
async function render() {
  clearTimers();
  closeNotif();
  const [path, qs] = (location.hash.slice(1) || '/inicio').split('?');
  const params = new URLSearchParams(qs || '');
  const route = routes.find(([re]) => re.test(path));
  if (!route) { location.hash = state.token ? '#/inicio' : '#/login'; return; }
  const [re, fn, kind] = route;
  if (!state.token && kind !== 'public') { location.hash = '#/login'; return; }
  if (state.token && kind === 'public') { location.hash = '#/inicio'; return; }
  if (state.token && !state.me) {
    try { await refreshMe(); } catch { return; }
  }
  if (!state.sectors.length) { try { state.sectors = (await api('GET', '/meta')).sectors; } catch {} }
  const m = path.match(re);
  window.scrollTo(0, 0);
  try { await fn(...m.slice(1), params); } catch (e) {
    console.error(e);
    app.innerHTML = shell(`<div class="card empty">${icon('info', 40)}<p>${esc(e.message)}</p><a class="btn btn-primary" href="#/inicio">Volver al inicio</a></div>`);
    bindShell();
  }
}
window.addEventListener('hashchange', render);

// ------------------------------------------------------------ estructura general
function shell(content, { active = '', left = 'plus', header = 'light', right = 'bell' } = {}) {
  const leftBtn = left === 'back'
    ? `<button class="round-btn" id="btn-back" aria-label="Volver">${icon('arrowLeft', 26)}</button>`
    : left === 'menu'
      ? `<a class="round-btn" href="#/ajustes" aria-label="Menú">${icon('menu', 26)}</a>`
      : `<button class="round-btn solid" id="btn-new-post" aria-label="Nueva publicación">${icon('plus', 30)}</button>`;
  const nav = [
    ['inicio', 'home', 'Inicio', '#/inicio'],
    ['explorar', 'search', 'Explorar', '#/explorar'],
    ['mensajes', 'message', 'Mensajes', '#/mensajes'],
    ['mi-empresa', 'building', 'Mi empresa', '#/mi-empresa'],
    ['ajustes', 'sliders', 'Ajustes', '#/ajustes'],
  ];
  return `
  <header class="app-header ${header === 'blue' ? 'is-blue' : ''}">
    ${leftBtn}
    <a href="#/inicio">${brand({ sub: 'red' })}</a>
    ${right === 'cart'
      ? `<a class="round-btn cart-btn" href="#/carrito" aria-label="Carrito">${icon('cart', 26)}<span class="cart-badge ${state.cartCount ? '' : 'zero'}">${state.cartCount || 0}</span></a>`
      : `<button class="round-btn" id="btn-bell" aria-label="Notificaciones">${icon('bell', 26)}<span class="badge ${state.unread ? '' : 'hidden'}" id="bell-dot"></span></button>`}
  </header>
  <main class="main">${content}</main>
  <nav class="bottom-nav">
    ${nav.map(([k, ic, label, href]) => `<a href="${href}" class="${active === k ? 'active' : ''}">${icon(ic, 26)}<span>${label}</span>${k === 'mensajes' ? `<span class="nav-badge ${state.unreadMessages ? '' : 'hidden'}" id="msg-badge">${state.unreadMessages}</span>` : ''}</a>`).join('')}
  </nav>`;
}
function bindShell() {
  $('#btn-back')?.addEventListener('click', () => (history.length > 1 ? history.back() : (location.hash = '#/inicio')));
  $('#btn-new-post')?.addEventListener('click', () => openPostModal());
  $('#btn-bell')?.addEventListener('click', toggleNotif);
  pollNotifications();
  state.timers.push(setInterval(pollNotifications, 10000));
}
async function pollNotifications() {
  if (!state.token) return;
  try {
    const d = await api('GET', '/notifications');
    state.unread = d.unread; state.unreadMessages = d.unreadMessages; state.notifications = d.notifications;
    $('#bell-dot')?.classList.toggle('hidden', !d.unread);
    const mb = $('#msg-badge');
    if (mb) { mb.textContent = d.unreadMessages; mb.classList.toggle('hidden', !d.unreadMessages); }
  } catch {}
}
function closeNotif() { $('#notif-panel')?.remove(); }
async function toggleNotif(e) {
  e.stopPropagation();
  if ($('#notif-panel')) return closeNotif();
  await pollNotifications();
  const list = state.notifications || [];
  const el = document.createElement('div');
  el.id = 'notif-panel';
  el.className = 'notif-panel';
  el.innerHTML = `<div class="modal-head"><h3>Notificaciones</h3><button class="icon-btn" id="n-close">${icon('x')}</button></div>
    ${state.unreadMessages ? `<a class="notif unread" href="#/mensajes">${icon('message', 26)}<div><p><b>Tienes ${state.unreadMessages} mensaje(s) sin leer</b></p><small>Ir a mensajes</small></div></a>` : ''}
    ${list.length ? list.map((n) => `<div class="notif ${n.read ? '' : 'unread'}" data-from="${n.from.id || ''}">${avatar(n.from, 40)}<div><p>${esc(n.text)}</p><small>${timeAgo(n.createdAt)}</small></div></div>`).join('')
      : `<div class="empty">${icon('bell', 40)}<p>No tienes notificaciones todavía.</p></div>`}`;
  document.body.appendChild(el);
  $('#n-close', el).onclick = closeNotif;
  $$('.notif[data-from]', el).forEach((n) => n.addEventListener('click', () => { if (n.dataset.from) location.hash = '#/empresa/' + n.dataset.from; }));
  el.addEventListener('click', (ev) => ev.stopPropagation());
  if (state.unread) { api('POST', '/notifications/read').then(() => { state.unread = 0; $('#bell-dot')?.classList.add('hidden'); }); }
}
document.addEventListener('click', () => { closeNotif(); $$('.menu-pop').forEach((m) => m.remove()); });

function openModal(html, onMount) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="overlay"><div class="modal" role="dialog">${html}</div></div>`;
  const overlay = $('.overlay', root);
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  $$('[data-close]', root).forEach((b) => (b.onclick = close));
  onMount?.($('.modal', root), close);
  return close;
}

// ------------------------------------------------------------ AUTENTICACIÓN
function passwordToggle(root) {
  $$('.toggle-pass', root).forEach((b) => b.addEventListener('click', () => {
    const inp = b.parentElement.querySelector('input');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    b.innerHTML = icon(inp.type === 'password' ? 'eye' : 'eyeOff', 26);
  }));
}
function viewLogin() {
  app.innerHTML = `<div class="sky"><div class="auth-wrap">
    ${brand()}
    <form class="glass" id="login-form" novalidate>
      <div class="company-badge"><img src="img/codesah.svg" alt="CODESAH"></div>
      <h1 class="auth-title">Iniciar Sesión en Col<span class="w">W</span></h1>
      <p class="auth-sub">Accede a tu empresa y conecta con nuevas oportunidades</p>
      <div id="err"></div>
      <div class="field"><label for="login">Número de móvil</label>
        <div class="input">${icon('phone', 26)}<input id="login" name="login" autocomplete="username" placeholder="Ingresa tu número de móvil" required></div></div>
      <div class="field"><label for="password">Contraseña</label>
        <div class="input">${icon('lock', 26)}<input id="password" type="password" autocomplete="current-password" placeholder="Ingresa tu contraseña" required>
        <button type="button" class="icon-btn toggle-pass" aria-label="Mostrar contraseña">${icon('eye', 26)}</button></div></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:8px">Iniciar Sesión ${icon('arrowRight', 26)}</button>
      <a class="link-center" href="#/recuperar">${icon('lock', 22)} ¿Has Olvidado tu Contraseña?</a>
      <div class="divider">ó</div>
      <a class="btn btn-outline btn-block" href="#/registro">${icon('userPlus', 26)} Crear una cuenta</a>
      ${isStandalone() ? '' : `<button type="button" class="link-center" id="install-link" style="width:100%">${icon('plus', 20)} Instalar ColW en este dispositivo</button>`}
      <div class="demo-hint">Cuenta de ejemplo: <b>3176811433</b> · contraseña <b>codesah123</b></div>
    </form></div></div>`;
  passwordToggle(app);
  $('#install-link')?.addEventListener('click', installApp);
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const { token, user } = await api('POST', '/login', { login: $('#login').value, password: $('#password').value });
      setSession(token, user);
      toast(`¡Bienvenido, ${user.company.name}!`);
      location.hash = '#/inicio';
    } catch (err) {
      $('#err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  });
}
function viewRegister() {
  const opts = (arr) => arr.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  app.innerHTML = `<div class="sky"><a class="round-btn auth-back" href="#/login" aria-label="Volver">${icon('arrowLeft', 28)}</a><div class="auth-wrap">
    ${brand()}
    <form class="glass" id="reg-form" novalidate>
      <div class="company-badge"><img src="img/codesah.svg" alt="CODESAH"></div>
      <h1 class="auth-title">Empieza a usar Col<span class="w">W</span></h1>
      <p class="auth-sub2">Con una cuenta de <span>Codesah</span></p>
      <p class="auth-sub">Puedes acceder a varias tecnologías de Codesah de forma fácil y segura.</p>
      <div id="err"></div>
      <div class="field"><div class="input">${icon('phone', 24)}<input name="login" placeholder="Número de móvil o correo electrónico" autocomplete="username" required></div></div>
      <div class="field"><div class="input">${icon('lock', 24)}<input name="password" type="password" placeholder="Crea una contraseña (mín. 6 caracteres)" autocomplete="new-password" required>
        <button type="button" class="icon-btn toggle-pass" aria-label="Mostrar contraseña">${icon('eye', 26)}</button></div></div>
      <div class="field"><div class="input">${icon('building', 24)}<input name="name" placeholder="Nombre de Empresa o Negocio" required></div></div>
      <div class="field"><div class="input">${icon('tag', 24)}<input name="sigla" placeholder="Sigla Empresa (Opcional)"></div></div>
      <div class="field"><div class="input">${icon('idCard', 24)}<input name="nit" inputmode="numeric" placeholder="Nit o ID tributaria (Opcional)"></div></div>
      <div class="field"><div class="input">${icon('calendar', 24)}<input name="foundedAt" type="text" placeholder="Fecha de constitución" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" max="${new Date().toISOString().slice(0, 10)}"><span class="suffix">DÍA / MES / AÑO</span></div></div>
      <div class="field"><div class="input stack">${icon('store', 26)}<div class="stack-body"><b>Tipo de Negocio</b><select name="businessType" required><option value="">Selecciona el tipo de negocio</option>${opts(BUSINESS_TYPES)}</select></div>${icon('chevronDown', 24)}</div></div>
      <div class="field"><div class="input stack">${icon('globe', 26)}<div class="stack-body"><b>País</b><select name="country" required><option value="">Selecciona tu país</option>${opts(COUNTRIES)}</select></div>${icon('chevronDown', 24)}</div></div>
      <button class="btn btn-primary btn-block" type="submit" style="margin-top:6px">Crear cuenta ${icon('arrowRight', 26)}</button>
      <div class="divider">ó</div>
      <div class="link-center" style="margin-top:0"><span style="color:var(--blue-900);font-weight:500">¿Ya tienes una cuenta?</span> <a href="#/login"><b>Iniciar sesión</b></a></div>
    </form></div></div>`;
  passwordToggle(app);
  $('#reg-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const { token, user } = await api('POST', '/register', data);
      setSession(token, user);
      toast('¡Cuenta creada! Completa el perfil de tu empresa.');
      location.hash = '#/editar';
    } catch (err) {
      $('#err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      $('#err').scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.disabled = false;
    }
  });
}
function viewForgot() {
  app.innerHTML = `<div class="sky"><a class="round-btn auth-back" href="#/login" aria-label="Volver">${icon('arrowLeft', 28)}</a><div class="auth-wrap">
    ${brand()}
    <div class="glass">
      <div class="company-badge" style="width:90px;height:90px;color:var(--blue-600)">${icon('lock', 44)}</div>
      <h1 class="auth-title">Recuperar contraseña</h1>
      <p class="auth-sub">Te enviaremos un código de verificación para crear una nueva contraseña.</p>
      <div id="msg"></div>
      <form id="f1" novalidate>
        <div class="field"><label>Número de móvil o correo</label><div class="input">${icon('phone', 24)}<input id="f-login" placeholder="Ingresa tu número de móvil" required></div></div>
        <button class="btn btn-primary btn-block">Enviar código ${icon('send', 22)}</button>
      </form>
      <form id="f2" class="hidden" novalidate>
        <div class="field"><label>Código de verificación</label><div class="input">${icon('shield', 24)}<input id="f-code" inputmode="numeric" maxlength="6" placeholder="Código de 6 dígitos"></div></div>
        <div class="field"><label>Nueva contraseña</label><div class="input">${icon('lock', 24)}<input id="f-pass" type="password" placeholder="Mínimo 6 caracteres">
          <button type="button" class="icon-btn toggle-pass">${icon('eye', 26)}</button></div></div>
        <button class="btn btn-primary btn-block">Cambiar contraseña ${icon('check', 22)}</button>
      </form>
      <a class="link-center" href="#/login">${icon('arrowLeft', 20)} Volver a iniciar sesión</a>
    </div></div></div>`;
  passwordToggle(app);
  const msg = (html, ok) => ($('#msg').innerHTML = `<div class="${ok ? 'form-ok' : 'form-error'}">${html}</div>`);
  $('#f1').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const d = await api('POST', '/forgot', { login: $('#f-login').value });
      msg(`Código enviado. <b>Modo demostración:</b> tu código es <b>${d.demoCode}</b> (también aparece en la terminal de VS Code).`, true);
      $('#f1').classList.add('hidden'); $('#f2').classList.remove('hidden');
    } catch (err) { msg(esc(err.message)); }
  });
  $('#f2').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('POST', '/reset', { login: $('#f-login').value, code: $('#f-code').value, password: $('#f-pass').value });
      toast('Contraseña actualizada. Inicia sesión.');
      location.hash = '#/login';
    } catch (err) { msg(esc(err.message)); }
  });
}

// ------------------------------------------------------------ INICIO (FEED)
async function viewFeed(params) {
  if (params?.get('tag')) state.feed.q = '#' + params.get('tag');
  const f = state.feed;
  app.innerHTML = shell(`
    <section class="card">
      <form class="searchbar" id="search-form">
        <div class="input">${icon('search', 22)}<input id="q" placeholder="Buscar empresas, usuarios, publicaciones..." value="${esc(f.q)}"></div>
        <label class="select-pill">${icon('tag', 20)}<select id="sector"><option value="">Sectores</option>${state.sectors.map((s) => `<option ${f.sector === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>${icon('chevronDown', 18)}</label>
      </form>
      <div class="feed-tabs">
        <button class="chip ${f.tab === 'todos' ? 'active' : ''}" data-tab="todos">Todas</button>
        <button class="chip ${f.tab === 'following' ? 'active' : ''}" data-tab="following">Siguiendo</button>
        ${f.q || f.sector ? `<button class="chip" id="clear">${icon('x', 14)} Limpiar filtros</button>` : ''}
      </div>
    </section>
    <section class="card">
      <div class="section-title"><h2 style="text-transform:none;font-size:20px">Historias</h2><a href="#/explorar">Ver todas ${icon('arrowRight', 18)}</a></div>
      <div class="stories" id="stories"><div class="spinner" style="margin:10px"></div></div>
    </section>
    <div id="posts"><div class="spinner"></div></div>`, { active: 'inicio', header: 'blue' });
  bindShell();

  const load = async () => {
    const qs = new URLSearchParams();
    const q = f.q.replace(/^#/, '');
    if (q) qs.set('q', q);
    if (f.sector) qs.set('sector', f.sector);
    if (f.tab === 'following') qs.set('feed', 'following');
    const { posts } = await api('GET', '/posts?' + qs);
    renderPosts($('#posts'), posts, load);
  };
  $('#search-form').addEventListener('submit', (e) => { e.preventDefault(); f.q = $('#q').value.trim(); viewFeed(); });
  let deb;
  $('#q').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => { f.q = $('#q').value.trim(); load(); }, 350); });
  $('#sector').addEventListener('change', (e) => { f.sector = e.target.value; viewFeed(); });
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { f.tab = b.dataset.tab; viewFeed(); }));
  $('#clear')?.addEventListener('click', () => { f.q = ''; f.sector = ''; if (location.hash.includes('?')) location.hash = '#/inicio'; else viewFeed(); });

  // historias: la última publicación de cada cuenta
  Promise.all([api('GET', '/posts'), api('GET', '/companies')]).then(([{ posts }, { companies }]) => {
    const seen = new Map();
    posts.forEach((p) => { if (!seen.has(p.author.id)) seen.set(p.author.id, p); });
    // cuentas con historia (foto) aunque aún no tengan publicaciones
    companies.forEach((u, i) => {
      if (seen.has(u.id) || !STORIES[u.handle]) return;
      const p = { id: 'story-' + u.id, author: { id: u.id, handle: u.handle, name: u.company.name, logo: u.company.logo }, createdAt: new Date(Date.now() - (i + 2) * 3600e3).toISOString(), text: '', theme: 'tech' };
      seen.set(u.id, p); posts.push(p);
    });
    const me = state.me;
    $('#stories').innerHTML = `
      <button class="story" id="my-story"><div class="ring">${avatar(me.company, 68)}<span class="plus">${icon('plus', 14)}</span></div><span>Tu historia</span></button>
      ${[...seen.values()].filter((p) => p.author.id !== me.id).map((p) => `<button class="story" data-story="${p.id}"><div class="ring">${avatar(p.author, 68)}</div><span>${esc(p.author.name.split(' ').slice(0, 2).join(' '))}</span></button>`).join('')}
      <a class="story" href="#/explorar"><div class="ring" style="background:var(--blue-100)"><div class="avatar" style="width:68px;height:68px;color:var(--blue-600)">${icon('users', 30)}</div></div><span>Más historias</span></a>`;
    $('#my-story').onclick = () => openPostModal();
    const list = [...seen.values()].filter((p) => p.author.id !== me.id);
    $$('[data-story]').forEach((b) => (b.onclick = () => openStory(list, list.findIndex((p) => p.id === b.dataset.story))));
  }).catch(() => {});
  await load();
}
// Visor de historias estilo Instagram: toca a la derecha (o desliza a la izquierda) para la siguiente,
// a la izquierda para la anterior; desliza hacia abajo o toca la X para cerrar.
function openStory(list, start = 0) {
  const el = document.createElement('div');
  el.className = 'story-view';
  document.body.appendChild(el);
  let i = start, t = null, x0 = 0, y0 = 0;
  const close = () => { clearTimeout(t); el.remove(); document.removeEventListener('keydown', onKey); };
  const go = (n) => { if (n >= list.length) return close(); i = Math.max(0, n); show(); };
  const onKey = (e) => { if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === 'Escape') close(); };
  function show() {
    clearTimeout(t);
    const post = list[i];
    const st = STORIES[post.author.handle];
    el.innerHTML = `<div class="bars">${list.map((_, k) => `<span><i class="${k < i ? 'done' : k === i ? 'run' : ''}"></i></span>`).join('')}</div>
      <div class="who">${avatar(post.author, 40)} <span class="grow">${esc(post.author.name)} <small style="opacity:.7;font-weight:400">· ${timeAgo(post.createdAt)}</small></span>
        <button class="icon-btn sv-close" aria-label="Cerrar">${icon('x', 26)}</button></div>
      <div class="frame">${st ? `<div class="post-media story-photo"><img src="${esc(st.img)}" alt=""></div>` : banner(post)}
        <button class="sv-nav prev" aria-label="Historia anterior"></button><button class="sv-nav next" aria-label="Historia siguiente"></button></div>
      <p>${linkify(st ? st.text : post.text || '')}</p>
      <button class="btn btn-outline btn-sm" id="sv-go">Ver perfil ${icon('arrowRight', 16)}</button>`;
    t = setTimeout(() => go(i + 1), 5000);
  }
  el.addEventListener('click', (e) => {
    if (e.target.closest('#sv-go')) { const id = list[i].author.id; close(); location.hash = '#/empresa/' + id; }
    else if (e.target.closest('.sv-close')) close();
    else if (e.target.closest('.sv-nav.prev')) go(i - 1);
    else if (e.target.closest('.sv-nav.next')) go(i + 1);
    else if (e.target === el) close();
  });
  el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? i + 1 : i - 1);
  });
  document.addEventListener('keydown', onKey);
  show();
}

function renderPosts(container, posts, reload) {
  if (!posts.length) {
    container.innerHTML = `<div class="card empty">${icon('news', 44)}<p>No hay publicaciones para mostrar.</p><button class="btn btn-primary" id="first-post">${icon('plus', 20)} Crear publicación</button></div>`;
    $('#first-post', container).onclick = () => openPostModal();
    return;
  }
  state.followingSet = state.followingSet || new Set();
  posts.forEach((p) => (p.author.isFollowing ? state.followingSet.add(p.author.id) : state.followingSet.delete(p.author.id)));
  container.innerHTML = posts.map((p) => postCard(p)).join('');
  bindPosts(container, posts);
}
function postCard(p) {
  const mine = p.author.id === state.me.id;
  const following = state.me && state.followingSet?.has(p.author.id);
  return `<article class="card post" data-id="${p.id}">
    <div>
      <div class="post-head">
        <a href="#/empresa/${p.author.id}">${avatar(p.author, 72)}</a>
        <div class="who">
          <a href="#/empresa/${p.author.id}" class="name" style="color:inherit">${esc(p.author.name)} ${p.author.verified ? icon('verified', 20) : ''}</a>
          <div class="meta">@${esc(p.author.handle)} · ${esc(p.author.sector || 'Otro')}</div>
          ${p.author.location ? `<div class="loc">${icon('pin', 16)} ${esc(p.author.location)}</div>` : ''}
        </div>
      </div>
      <div class="post-text">${linkify(p.text || '')}</div>
      <div class="post-actions">
        <button class="${p.liked ? 'liked' : ''}" data-act="like" aria-label="Me gusta">${icon('heart', 26)} <span>${fmt(p.likes)}</span></button>
        <button data-act="comments" aria-label="Comentarios">${icon('comment', 26)} <span>${fmt(p.comments.length)}</span></button>
        <button data-act="share" aria-label="Compartir">${icon('share', 26)} <span>${fmt(p.shares)}</span></button>
      </div>
    </div>
    <div class="post-side">
      <div class="post-top">${timeAgo(p.createdAt)} <span style="position:relative"><button class="icon-btn" data-act="menu" aria-label="Opciones">${icon('more', 24)}</button></span></div>
      ${banner(p)}
      ${mine ? '' : `<button class="btn btn-outline btn-sm btn-rect follow-btn ${following ? 'following' : ''}" data-act="follow" data-user="${p.author.id}">${icon(following ? 'userCheck' : 'userPlus', 20)} ${following ? 'Siguiendo' : 'Seguir'}</button>`}
    </div>
    <div class="comments hidden"></div>
  </article>`;
}
function bindPosts(container, posts) {
  const byId = Object.fromEntries(posts.map((p) => [p.id, p]));
  $$('article.post', container).forEach((card) => bindCard(card, byId[card.dataset.id]));
}
function bindCard(card, post) {
    $$('.hashtag', card).forEach((h) => (h.onclick = () => {
      state.feed.q = '#' + h.dataset.tag;
      if (location.hash === '#/inicio') viewFeed(); else location.hash = '#/inicio';
    }));
    const replace = (np) => {
      Object.assign(post, np);
      const tmp = document.createElement('div');
      tmp.innerHTML = postCard(post);
      const n = tmp.firstElementChild;
      card.replaceWith(n);
      bindCard(n, post);
      return n;
    };
    card.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || !card.contains(b)) return;
      e.stopPropagation();
      const act = b.dataset.act;
      try {
        if (act === 'like') replace((await api('POST', `/posts/${post.id}/like`)).post);
        if (act === 'share') {
          const link = `${location.origin}/#/empresa/${post.author.id}`;
          try { await navigator.clipboard.writeText(`${post.title ? post.title + ' — ' : ''}${post.text}\n${link}`); } catch {}
          replace((await api('POST', `/posts/${post.id}/share`)).post);
          toast('Enlace copiado para compartir');
        }
        if (act === 'follow') {
          const { company } = await api('POST', `/companies/${b.dataset.user}/follow`);
          company.isFollowing ? state.followingSet.add(company.id) : state.followingSet.delete(company.id);
          toast(company.isFollowing ? `Ahora sigues a ${company.company.name}` : `Dejaste de seguir a ${company.company.name}`);
          $$(`[data-act=follow][data-user="${company.id}"]`).forEach((x) => {
            x.classList.toggle('following', company.isFollowing);
            x.innerHTML = `${icon(company.isFollowing ? 'userCheck' : 'userPlus', 20)} ${company.isFollowing ? 'Siguiendo' : 'Seguir'}`;
          });
        }
        if (act === 'comments') toggleComments(card, post, replace);
        if (act === 'menu') {
          $$('.menu-pop').forEach((m) => m.remove());
          const pop = document.createElement('div');
          pop.className = 'menu-pop';
          pop.innerHTML = `<button data-m="profile">${icon('building', 18)} Ver perfil</button>
            ${post.author.id !== state.me.id ? `<button data-m="msg">${icon('message', 18)} Enviar mensaje</button>` : ''}
            <button data-m="copy">${icon('copy', 18)} Copiar texto</button>
            ${post.author.id === state.me.id ? `<button data-m="del" class="danger">${icon('trash', 18)} Eliminar publicación</button>` : ''}`;
          b.parentElement.appendChild(pop);
          pop.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const m = ev.target.closest('[data-m]')?.dataset.m;
            pop.remove();
            if (m === 'profile') location.hash = '#/empresa/' + post.author.id;
            if (m === 'msg') location.hash = '#/mensajes/' + post.author.id;
            if (m === 'copy') { try { await navigator.clipboard.writeText(post.text); toast('Texto copiado'); } catch { toast('No se pudo copiar'); } }
            if (m === 'del') confirmDialog('¿Eliminar esta publicación?', 'Esta acción no se puede deshacer.', async () => {
              await api('DELETE', '/posts/' + post.id); toast('Publicación eliminada'); card.remove();
            });
          });
        }
      } catch (err) { toast(err.message); }
    });
}
function toggleComments(card, post, replace) {
  const box = $('.comments', card);
  if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.innerHTML = `${post.comments.map((c) => `<div class="comment"><a href="#/empresa/${c.author.id}">${avatar(c.author, 36)}</a><div class="bubble"><b>${esc(c.author.name)} <small style="font-weight:400;color:var(--muted)">· ${timeAgo(c.createdAt)}</small></b>${esc(c.text)}</div></div>`).join('') || '<p style="color:var(--muted);margin:0 0 10px">Sé el primero en comentar.</p>'}
    <form class="comment-form"><div class="input">${avatar(state.me.company, 30)}<input placeholder="Escribe un comentario..." maxlength="500"></div><button class="send-btn" aria-label="Enviar">${icon('send', 20)}</button></form>`;
  const input = $('input', box);
  input.focus();
  $('form', box).addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    try {
      const { post: np } = await api('POST', `/posts/${post.id}/comments`, { text: input.value });
      const nc = replace(np);
      $('[data-act=comments]', nc).click();
    } catch (err) { toast(err.message); }
  });
}
function confirmDialog(title, text, onOk) {
  openModal(`<div class="modal-head"><h3>${esc(title)}</h3></div><p style="color:var(--muted)">${esc(text)}</p>
    <div class="form-actions"><button class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary" id="ok">Confirmar</button></div>`,
  (m, close) => { $('#ok', m).onclick = async () => { close(); try { await onOk(); } catch (e) { toast(e.message); } }; });
}

function openPostModal() {
  let image = null, theme = 'tech';
  openModal(`<div class="modal-head"><h3>Nueva publicación</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">${avatar(state.me.company, 48)}<div><b>${esc(state.me.company.name)}</b><br><small style="color:var(--muted)">Publicación pública</small></div></div>
    <div id="perr"></div>
    <div class="field"><label>Título del banner</label><div class="input">${icon('megaphone', 22)}<input id="p-title" maxlength="60" placeholder="Ej: Ideas que transforman realidades"></div></div>
    <div class="field"><label>Texto</label><div class="input" style="align-items:flex-start"><textarea id="p-text" maxlength="1000" placeholder="¿Qué quieres compartir? Usa #hashtags para llegar a más empresas"></textarea></div></div>
    <div class="field"><label>Estilo del banner</label><div class="theme-pick">${Object.entries(THEMES).map(([k, t]) => `<button type="button" data-theme="${k}" class="${k === theme ? 'on' : ''}">${t.emoji} ${t.label}</button>`).join('')}</div></div>
    <div class="field"><label>Imagen (opcional)</label>
      <button type="button" class="btn btn-outline btn-sm btn-rect" id="p-pick">${icon('image', 18)} Subir imagen</button>
      <input type="file" id="p-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden>
      <div id="p-preview"></div></div>
    <div id="p-live" style="margin-bottom:10px"></div>
    <div class="form-actions"><button class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary" id="p-send">Publicar ${icon('send', 18)}</button></div>`,
  (m, close) => {
    const live = () => { $('#p-live', m).innerHTML = image ? '' : banner({ title: $('#p-title', m).value || 'Vista previa', theme }); };
    live();
    $('#p-title', m).addEventListener('input', live);
    $$('[data-theme]', m).forEach((b) => (b.onclick = () => { theme = b.dataset.theme; $$('[data-theme]', m).forEach((x) => x.classList.toggle('on', x === b)); live(); }));
    $('#p-pick', m).onclick = () => $('#p-file', m).click();
    $('#p-file', m).onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        image = await uploadImage(file);
        $('#p-preview', m).innerHTML = `<div class="img-preview"><img src="${image}" alt=""><button type="button" id="p-rm">${icon('x', 18)}</button></div>`;
        $('#p-rm', m).onclick = () => { image = null; $('#p-preview', m).innerHTML = ''; live(); };
        live();
      } catch (err) { $('#perr', m).innerHTML = `<div class="form-error">${esc(err.message)}</div>`; }
    };
    $('#p-send', m).onclick = async () => {
      try {
        await api('POST', '/posts', { title: $('#p-title', m).value, text: $('#p-text', m).value, image, theme });
        close();
        toast('¡Publicación creada!');
        if (location.hash.startsWith('#/inicio')) viewFeed(); else location.hash = '#/inicio';
      } catch (err) { $('#perr', m).innerHTML = `<div class="form-error">${esc(err.message)}</div>`; }
    };
  });
}

// ------------------------------------------------------------ PERFIL / PÁGINA DE EMPRESA
async function viewCompany(id) {
  const { company: u } = await api('GET', '/companies/' + id);
  const c = u.company;
  const isMe = u.isMe;
  const { posts } = await api('GET', '/posts?user=' + u.id);
  const { companies } = await api('GET', '/companies');
  state.followingSet = new Set(companies.filter((x) => x.isFollowing).map((x) => x.id));

  const products = c.products?.length ? c.products : [];
  app.innerHTML = shell(`
    <section class="card">
      <div class="profile-top">
        <div class="profile-logo">${avatar(c, 128)}${isMe ? `<a class="edit-dot" href="#/editar" aria-label="Editar">${icon('edit', 18)}</a>` : ''}</div>
        <div>
          <h1 class="profile-name">${esc(c.name)} ${c.verified ? icon('verified', 28) : ''}</h1>
          <div class="profile-line">${flag(c.country)} ${esc(c.country || '—')}</div>
          ${c.nit ? `<div class="profile-line">${icon('building', 24)} NIT: ${esc(c.nit)}</div>` : ''}
          <div class="profile-actions">
            ${isMe
              ? `<a class="btn btn-primary btn-sm" href="#/editar">${icon('edit', 18)} Editar perfil</a><a class="btn btn-outline btn-sm" href="#/antecedentes">${icon('file', 18)} Antecedentes</a>`
              : `<button class="btn btn-sm ${u.isFollowing ? 'btn-primary' : 'btn-outline'}" id="follow">${icon(u.isFollowing ? 'userCheck' : 'userPlus', 18)} ${u.isFollowing ? 'Siguiendo' : 'Seguir'}</button><a class="btn btn-outline btn-sm" href="#/mensajes/${u.id}">${icon('message', 18)} Enviar mensaje</a>`}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="stats">
            <div class="stat"><div class="ico">${icon('file', 26)}</div><b>${fmt(u.stats.posts)}</b><span>Publicaciones</span></div>
            <div class="stat"><div class="ico">${icon('users', 26)}</div><b>${fmt(u.stats.followers)}</b><span>Seguidores</span></div>
            <div class="stat"><div class="ico">${icon('user', 26)}</div><b>${fmt(u.stats.following)}</b><span>Seguidos</span></div>
          </div>
          ${c.phone || c.email ? `<div class="contact-box">
            <div class="tagline">Conectamos <span class="dot"></span> Informamos <span class="dot"></span> Transformamos</div>
            <b>Contáctanos:</b>
            ${c.phone ? `<a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${icon('phone', 20)} ${esc(c.phone)}</a>` : ''}
            ${c.email ? `<a href="mailto:${esc(c.email)}">${icon('mail', 20)} ${esc(c.email)}</a>` : ''}
          </div>` : ''}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="section-title"><h2>${icon('chart', 26)} Datos de la empresa</h2>${isMe ? `<a href="#/editar">Editar ${icon('arrowRight', 18)}</a>` : ''}</div>
      <div class="data-grid">
        <div class="data-item">${icon('calendar', 34)}<div><small>Antigüedad</small><b>${fmt(c.years)} ${c.years === 1 ? 'año' : 'años'}</b></div></div>
        <div class="data-item">${icon('users', 34)}<div><small>Empleados</small><b>${fmt(c.employees)}</b></div></div>
        <div class="data-item">${icon('users', 34)}<div><small>Clientes</small><b>${fmt(c.clients)}</b></div></div>
        <div class="data-item">${icon('pin', 34)}<div><small>Ubicación</small><b style="font-size:15px;color:var(--blue-900)">${esc(c.location || 'Sin definir')}</b></div></div>
        <div class="data-item">${icon('tag', 34)}<div><small>Sector</small><b style="font-size:15px;color:var(--blue-900)">${esc(c.sector || 'Otro')}</b></div></div>
      </div>
    </section>

    <section class="card" id="productos"><div class="spinner"></div></section>

    <div class="split">
      <section class="hero" id="hero"></section>
      <section class="bot" id="bot"></section>
    </div>

    <section class="card quick-links" style="margin-top:14px">
      <a href="${isMe ? '#/antecedentes' : '#/antecedentes?nit=' + encodeURIComponent(c.nit || '')}">${icon('file', 36)}<div><b>Antecedentes</b><small>Consulta y certifica</small></div></a>
      ${isMe ? `<button id="backup">${icon('upload', 36)}<div><b>Respaldo</b><small>Seguridad de datos</small></div></button>`
        : `<a href="#/mensajes/${u.id}">${icon('message', 36)}<div><b>Mensajes</b><small>Escríbele a la empresa</small></div></a>`}
      <a href="${DIAN_URL}" target="_blank" rel="noopener"><div style="text-align:center"><div class="dian">DIAN</div><small>Enlace directo</small></div></a>
    </section>

    <section class="card" id="publicaciones">
      <div class="section-title"><h2>${icon('news', 26)} Publicaciones</h2>${isMe ? `<button class="more-link" id="new-post-2">${icon('plus', 18)} Nueva</button>` : ''}</div>
      <div id="company-posts"></div>
    </section>

    <section class="card">
      <div class="section-title"><h2>${icon('building', 26)} Empresas y usuarios</h2><a href="#/explorar">Ver todas ${icon('arrowRight', 18)}</a></div>
      <div class="cats">${CATEGORIES.map((k) => `<a class="cat" href="#/explorar?sector=${encodeURIComponent(k.sector)}"><div class="bubble" style="background:${k.bg}">${k.emoji}</div>${k.label}</a>`).join('')}</div>
    </section>`, { active: isMe ? 'mi-empresa' : '', left: isMe ? 'plus' : 'back' });
  bindShell();

  $('#follow')?.addEventListener('click', async () => {
    try { const r = await api('POST', `/companies/${u.id}/follow`); toast(r.company.isFollowing ? `Ahora sigues a ${c.name}` : `Dejaste de seguir a ${c.name}`); viewCompany(id); } catch (e) { toast(e.message); }
  });
  $('#all-products')?.addEventListener('click', (e) => {
    $('#product-grid').innerHTML = products.map((p) => `<div class="product"><div class="pic">${productEmoji(p)}</div>${esc(p)}</div>`).join('');
    e.currentTarget.remove();
  });
  $('#backup')?.addEventListener('click', downloadBackup);
  $('#new-post-2')?.addEventListener('click', () => openPostModal());

  const cp = $('#company-posts');
  if (posts.length) { cp.innerHTML = ''; renderPosts(cp, posts, () => viewCompany(id)); cp.querySelectorAll('.card').forEach((x) => (x.style.boxShadow = 'none')); }
  else cp.innerHTML = `<div class="empty" style="padding:16px">Sin publicaciones todavía.</div>`;

  mountProfileStore($('#productos'), u);
  mountHero($('#hero'), u, companies.length);
  mountBot($('#bot'), u, posts);
}
function mountHero(el, u, total) {
  const c = u.company;
  const slides = [
    { h: `Soluciones empresariales<br><span style="font-weight:500">para un futuro más</span> <em>eficiente, inteligente e innovador</em>` },
    { h: `${esc(c.slogan || c.name)}` },
    { h: `Conecta con <em>${fmt(total)} empresas</em> y usuarios en ColW` },
  ];
  let i = 0;
  const draw = () => {
    el.innerHTML = `<span class="slide-mark">Col<b>W</b></span>
      <h3>${slides[i].h}</h3>
      <div class="pillars"><span>${icon('bulb', 20)} Innovación</span><span>${icon('chart', 20)} Crecimiento</span><span>${icon('users', 20)} Alianzas</span><span>${icon('globe', 20)} Sostenibilidad</span></div>
      <div><button class="btn btn-primary" id="hero-more">Conoce más ${icon('arrowRight', 20)}</button></div>
      <div class="dots">${slides.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-k="${k}" aria-label="Diapositiva ${k + 1}"></button>`).join('')}</div>`;
    $('#hero-more', el).onclick = () => $('#productos').scrollIntoView({ behavior: 'smooth' });
    $$('[data-k]', el).forEach((b) => (b.onclick = () => { i = +b.dataset.k; draw(); }));
  };
  draw();
  state.timers.push(setInterval(() => { if (document.body.contains(el)) { i = (i + 1) % slides.length; draw(); } }, 6000));
}
function mountBot(el, u, posts) {
  const c = u.company;
  const botName = 'Bot ' + (c.sigla || c.name).split(' ')[0];
  el.innerHTML = `<div class="bot-head"><div class="bot-av">${icon('bot', 26)}</div><div><b>${esc(botName)}</b><small>En línea</small></div><button class="min icon-btn" id="bot-min" style="color:#fff" aria-label="Minimizar">${icon('chevronDown', 22)}</button></div>
    <div class="bot-body" id="bot-body"></div>
    <div class="bot-foot"><input id="bot-in" placeholder="Escribe tu mensaje..." maxlength="200"><button class="send-btn" id="bot-send" aria-label="Enviar">${icon('send', 20)}</button></div>`;
  const body = $('#bot-body', el);
  const add = (html, me) => { const d = document.createElement('div'); d.className = 'bot-msg' + (me ? ' me' : ''); d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; };
  const options = () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:8px';
    wrap.innerHTML = [['productos', 'package', 'Información de productos'], ['noticias', 'calendar', 'Noticias y novedades'], ['soporte', 'headset', 'Soporte técnico'], ['asesor', 'user', 'Hablar con un asesor']]
      .map(([k, ic, t]) => `<button class="bot-opt" data-o="${k}">${icon(ic, 20)} ${t}</button>`).join('');
    body.appendChild(wrap);
    $$('[data-o]', wrap).forEach((b) => (b.onclick = () => { add(esc(b.textContent.trim()), true); reply(b.dataset.o); }));
    body.scrollTop = body.scrollHeight;
  };
  const wa = c.phone ? `https://wa.me/${c.phone.replace(/\D/g, '')}` : null;
  const answers = {
    productos: () => c.products?.length ? `Estos son nuestros productos y servicios:<br>• ${c.products.map(esc).join('<br>• ')}` : 'Pronto publicaremos nuestro catálogo.',
    noticias: () => posts.length ? `Últimas novedades:<br>${posts.slice(0, 3).map((p) => `• <b>${esc(p.title || 'Publicación')}</b> <small>(${timeAgo(p.createdAt)})</small>`).join('<br>')}` : 'Aún no tenemos novedades publicadas.',
    soporte: () => `Nuestro equipo de soporte te atiende en:<br>${c.phone ? `📞 <a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a><br>` : ''}${c.email ? `✉️ <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}${!c.phone && !c.email ? 'Escríbenos por Mensajes en ColW.' : ''}`,
    asesor: () => `¡Con gusto! ${wa ? `Habla con un asesor por <a href="${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${!u.isMe ? `${wa ? ' o ' : ''}<a href="#/mensajes/${u.id}">envía un mensaje en ColW</a>` : ''}.`,
    ubicacion: () => `Estamos ubicados en <b>${esc(c.location || c.country || 'Colombia')}</b>.`,
    nit: () => c.nit ? `Nuestro NIT es <b>${esc(c.nit)}</b>.` : 'No tenemos NIT registrado en ColW.',
    saludo: () => `¡Hola! 👋 ¿En qué puedo ayudarte?`,
    gracias: () => '¡Con gusto! ¿Algo más en lo que te pueda ayudar?',
  };
  const reply = (key) => setTimeout(() => { add(answers[key]()); if (key !== 'gracias') options(); }, 450);
  const understand = (t) => {
    t = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/hola|buen(os|as)/.test(t)) return 'saludo';
    if (/gracias/.test(t)) return 'gracias';
    if (/precio|cotiz|comprar|asesor|venta|humano|persona/.test(t)) return 'asesor';
    if (/soporte|falla|ayuda|problema|contact|telefono|correo/.test(t)) return 'soporte';
    if (/noticia|novedad|public/.test(t)) return 'noticias';
    if (/donde|ubica|direccion|ciudad/.test(t)) return 'ubicacion';
    if (/nit|tributari/.test(t)) return 'nit';
    if (/producto|servicio|ofrec|catalogo|venden/.test(t)) return 'productos';
    const hit = (c.products || []).find((p) => t.includes(p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[0]));
    if (hit) { answers.hit = () => `¡Sí! Ofrecemos <b>${esc(hit)}</b>. ¿Quieres hablar con un asesor para una cotización?`; return 'hit'; }
    return null;
  };
  const sendText = () => {
    const inp = $('#bot-in', el); const t = inp.value.trim(); if (!t) return;
    add(esc(t), true); inp.value = '';
    const k = understand(t);
    if (k) reply(k); else setTimeout(() => { add('No estoy seguro de haber entendido. Elige una opción:'); options(); }, 450);
  };
  $('#bot-send', el).onclick = sendText;
  $('#bot-in', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') sendText(); });
  $('#bot-min', el).onclick = () => { body.classList.toggle('hidden'); $('.bot-foot', el).classList.toggle('hidden'); };
  add(`¡Hola! 👋<br>Soy el asistente virtual de <b>${esc(c.name)}</b><br>¿En qué puedo ayudarte hoy?`);
  options();
}
async function downloadBackup() {
  try {
    const data = await api('GET', '/me/backup');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `respaldo-colw-${state.me.handle}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Respaldo descargado');
  } catch (e) { toast(e.message); }
}

// ------------------------------------------------------------ EDITAR PERFIL
async function viewEdit() {
  await refreshMe();
  const u = state.me;
  const d = structuredClone(u.company);
  app.innerHTML = shell(`
    <section class="card">
      <div class="profile-top" style="grid-template-columns:auto 1fr auto">
        <div class="profile-logo" style="width:120px;height:120px">${avatar(d, 104)}<button class="edit-dot" id="logo-dot" aria-label="Cambiar logo">${icon('edit', 16)}</button></div>
        <div>
          <div style="font-size:26px;font-weight:800">PERFIL EMPRESA</div>
          <h1 class="profile-name" style="font-size:24px">${esc(d.name)} ${d.verified ? icon('verified', 22) : ''}</h1>
          <div class="profile-line">${flag(d.country)} ${esc(d.country || '')}</div>
          ${d.nit ? `<div class="profile-line">${icon('building', 22)} NIT: ${esc(d.nit)}</div>` : ''}
        </div>
        <div class="stats">
          <div class="stat"><div class="ico">${icon('file', 24)}</div><b>${fmt(u.stats.posts)}</b><span>Publicaciones</span></div>
          <div class="stat"><div class="ico">${icon('users', 24)}</div><b>${fmt(u.stats.followers)}</b><span>Seguidores</span></div>
          <div class="stat"><div class="ico">${icon('user', 24)}</div><b>${fmt(u.stats.following)}</b><span>Seguidos</span></div>
        </div>
      </div>
    </section>
    <div id="save-err"></div>

    <section class="card">
      <div class="step-head"><div class="step-num">1</div><div><h2>Productos o servicios</h2><p>Añade los productos o servicios que ofrece tu empresa.</p></div></div>
      <form class="add-row" id="add-form">
        <div class="input"><input id="prod-in" maxlength="40" placeholder="Ejemplo: Desarrollo de software, Consultoría empresarial, Impresión 3D..."></div>
        <button class="btn btn-primary btn-rect">${icon('plus', 22)} Agregar</button>
      </form>
      <div class="subhead">Productos o servicios agregados</div>
      <div class="pchips" id="pchips"></div>
    </section>

    <section class="card">
      <div class="step-head"><div class="step-num">2</div><div><h2>Identidad corporativa</h2><p>Fortalece la imagen de tu empresa en ColW.</p></div></div>
      <div class="identity">
        <label class="dropzone" id="drop">
          ${icon('upload', 56)}
          <div style="font-size:18px;margin-top:10px">Arrastra tu logo aquí<br>o haz clic para seleccionar</div>
          <small>Formatos: JPG, PNG, SVG<br>Tamaño máximo: 2MB</small>
          <input type="file" id="logo-file" accept="image/png,image/jpeg,image/svg+xml" hidden>
        </label>
        <div class="preview">
          <div class="label">VISTA PREVIA</div>
          <div class="box"><div id="logo-prev"></div><em id="slogan-prev"></em></div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm btn-rect" id="change-logo">${icon('edit', 18)} Cambiar logo</button>
            <button class="btn btn-danger btn-sm btn-rect ${d.logo ? '' : 'hidden'}" id="rm-logo">${icon('trash', 18)} Quitar</button>
          </div>
        </div>
        <div>
          <div class="slogan-box">
            <h4>${icon('megaphone', 26)} SLOGAN O ESLOGAN <span title="Frase corta que resume la propuesta de valor de tu empresa." style="margin-left:auto;color:var(--blue-600)">${icon('help', 24)}</span></h4>
            <p>Ingresa el slogan o frase que representa tu empresa.</p>
            <textarea id="slogan" maxlength="80" placeholder="Ej: Innovación que impulsa un futuro sostenible">${esc(d.slogan || '')}</textarea>
            <div class="count" id="slogan-count"></div>
          </div>
          <div class="tip">${icon('bulb', 26)} Ejemplos: "Tecnología que transforma", "Soluciones para crecer juntos"</div>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="step-head"><div class="step-num">3</div><div><h2>Datos de la empresa</h2><p>Información general y estadística de tu empresa.</p></div></div>
      <div class="data-edit">
        <div class="de"><div class="ico">${icon('calendar', 28)}</div><h5>Años de experiencia</h5><input type="number" min="0" id="years" value="${d.years || 0}"><small>Ingresa los años de experiencia de tu empresa.</small></div>
        <div class="de"><div class="ico">${icon('users', 28)}</div><h5># Empleos</h5><input type="number" min="0" id="employees" value="${d.employees || 0}"><small>Número total de empleos generados por tu empresa.</small></div>
        <div class="de"><div class="ico">${icon('pin', 28)}</div><h5>Ubicación</h5><input id="location" list="cities" value="${esc(d.location || '')}" placeholder="Ciudad" style="font-size:15px"><datalist id="cities">${CITIES.map((x) => `<option value="${esc(x)}">`).join('')}</datalist><small>Ciudad o región donde se encuentra tu empresa.</small></div>
        <div class="de"><div class="ico">${icon('tag', 28)}</div><h5>Sector al que pertenece</h5><select id="sector" style="font-size:15px">${state.sectors.map((s) => `<option ${d.sector === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select><small>Selecciona el sector principal de tu empresa.</small></div>
        <div class="de"><div class="ico">${icon('users', 28)}</div><h5>Clientes</h5><input type="number" min="0" id="clients" value="${d.clients || 0}"><small>Número total de clientes activos de tu empresa.</small></div>
      </div>
    </section>

    <section class="card">
      <div class="step-head"><div class="step-num">4</div><div><h2>Contacto e información legal</h2><p>Así te encontrarán otras empresas.</p></div></div>
      <div class="data-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
        <div class="field"><label>Nombre de la empresa</label><div class="input">${icon('building', 22)}<input id="name" maxlength="60" value="${esc(d.name)}"></div></div>
        <div class="field"><label>Sigla</label><div class="input">${icon('tag', 22)}<input id="sigla" maxlength="15" value="${esc(d.sigla || '')}"></div></div>
        <div class="field"><label>NIT</label><div class="input">${icon('idCard', 22)}<input id="nit" maxlength="20" inputmode="numeric" value="${esc(d.nit || '')}"></div></div>
        <div class="field"><label>Teléfono de contacto</label><div class="input">${icon('phone', 22)}<input id="phone" maxlength="25" value="${esc(d.phone || '')}" placeholder="+57 300 000 0000"></div></div>
        <div class="field"><label>Correo de contacto</label><div class="input">${icon('mail', 22)}<input id="email" type="email" maxlength="80" value="${esc(d.email || '')}" placeholder="contacto@empresa.com"></div></div>
        <div class="field"><label>País</label><div class="input">${icon('globe', 22)}<select id="country">${COUNTRIES.map((x) => `<option ${d.country === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
      </div>
      <div class="form-actions">
        <a class="btn btn-outline btn-rect" href="#/mi-empresa" style="min-width:170px">Cancelar</a>
        <button class="btn btn-primary btn-rect" id="save" style="min-width:220px">${icon('check', 22)} Guardar cambios</button>
      </div>
    </section>`, { active: 'mi-empresa', left: 'back' });
  bindShell();

  const drawChips = () => {
    $('#pchips').innerHTML = d.products.length
      ? d.products.map((p, i) => `<div class="pchip"><span class="pic">${productEmoji(p)}</span><span>${esc(p)}</span><button type="button" data-rm="${i}" aria-label="Quitar">${icon('x', 16)}</button></div>`).join('')
      : `<p style="color:var(--muted);margin:0">Todavía no has agregado productos o servicios.</p>`;
    $$('[data-rm]').forEach((b) => (b.onclick = () => { d.products.splice(+b.dataset.rm, 1); drawChips(); }));
  };
  const drawPreview = () => {
    $('#logo-prev').innerHTML = avatar(d, 150);
    $('#slogan-prev').textContent = d.slogan ? `"${d.slogan}"` : '';
    $('#slogan-count').textContent = `${(d.slogan || '').length}/80`;
    $('#rm-logo').classList.toggle('hidden', !d.logo);
  };
  drawChips(); drawPreview();

  $('#add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#prod-in').value.trim();
    if (!v) return;
    v.split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => { if (!d.products.some((p) => p.toLowerCase() === x.toLowerCase())) d.products.push(x); });
    $('#prod-in').value = '';
    drawChips();
  });
  $('#slogan').addEventListener('input', (e) => { d.slogan = e.target.value; drawPreview(); });

  const handleFile = async (file) => {
    if (!file) return;
    try { toast('Subiendo logo...'); d.logo = await uploadImage(file); drawPreview(); toast('Logo cargado. Recuerda guardar los cambios.'); }
    catch (err) { toast(err.message); }
  };
  const fileIn = $('#logo-file');
  fileIn.onchange = (e) => handleFile(e.target.files[0]);
  $('#change-logo').onclick = () => fileIn.click();
  $('#logo-dot').onclick = () => fileIn.click();
  $('#rm-logo').onclick = () => { d.logo = null; drawPreview(); };
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

  $('#save').onclick = async () => {
    const btn = $('#save'); btn.disabled = true;
    const val = (id) => $('#' + id).value;
    try {
      await api('PUT', '/me/company', {
        ...d, years: val('years'), employees: val('employees'), clients: val('clients'), location: val('location'), sector: val('sector'),
        name: val('name'), sigla: val('sigla'), nit: val('nit'), phone: val('phone'), email: val('email'), country: val('country'),
      });
      await refreshMe();
      toast('¡Cambios guardados!');
      location.hash = '#/mi-empresa';
    } catch (err) { $('#save-err').innerHTML = `<div class="form-error">${esc(err.message)}</div>`; btn.disabled = false; }
  };
}

// ------------------------------------------------------------ ANTECEDENTES
async function viewAntecedentes(params) {
  const c = state.me.company;
  const nitParam = params instanceof URLSearchParams ? params.get('nit') : null;
  const nit = nitParam || c.nit || '';
  app.innerHTML = shell(`
    <section class="card">
      <div class="section-title" style="justify-content:flex-start;gap:14px">
        <button class="icon-btn" onclick="history.back()" aria-label="Volver" style="color:var(--blue-600)">${icon('arrowLeft', 26)}</button>
        ${icon('file', 32)}<div><h2 style="margin:0">Antecedentes</h2><small style="color:var(--blue-800)">Consulta y generación de certificados</small></div>
      </div>
      <div class="ant-grid">
        <div class="ant-info">
          <div style="color:var(--blue-700);margin-bottom:10px">Información de la empresa</div>
          <div style="display:flex;align-items:center;gap:12px">${avatar(c, 70)}<b style="font-size:20px">${esc(c.name)}</b></div>
          <dl style="margin:0">
            <dt>NIT</dt><dd>${esc(c.nit || 'Sin registrar')}</dd>
            <dt>País</dt><dd>${esc(c.country || '—')}</dd>
            <dt>Ubicación</dt><dd>${esc(c.location || '—')}</dd>
            <dt>Sector</dt><dd>${esc(c.sector || '—')}</dd>
          </dl>
        </div>
        <div class="ant-main">
          <h3>Generar certificado</h3>
          <p style="color:var(--blue-700);margin:0;font-size:14px">Esta opción te permite consultar y descargar el Certificado de Antecedentes Fiscales expedido por la Contraloría General de la República.</p>
          <div class="info-bar">${icon('info', 26)} El NIT se copiará automáticamente para que solo tengas que pegarlo (Ctrl+V) en el sitio oficial de la Contraloría.</div>
          <div class="ant-row">
            <div class="field" style="margin:0"><label style="font-weight:500;font-size:13px">NIT a consultar</label>
              <div class="input"><input id="nit" value="${esc(nit)}" inputmode="numeric" placeholder="Ingresa el NIT sin dígito de verificación"><button class="icon-btn" id="copy" aria-label="Copiar NIT">${icon('copy', 22)}</button></div></div>
            <div class="field" style="margin:0"><label style="font-weight:500;font-size:13px">País</label>
              <div class="input">${flag('Colombia')}<select id="country"><option>Colombia</option></select></div></div>
          </div>
          <div class="cgr">
            <div class="cgr-logo"><div class="circle"><i></i></div><div><b>CONTRALORÍA</b><small>GENERAL DE LA REPÚBLICA</small></div></div>
            <ol>
              <li><span class="n">1</span><div><b>Generar certificado</b>Serás redirigido al sitio oficial de la Contraloría.</div></li>
              <li><span class="n">2</span><div><b>Consultar</b>Realiza la consulta del certificado con el NIT de tu empresa.</div></li>
              <li><span class="n">3</span><div><b>Descargar</b>Descarga el certificado una vez generado.</div></li>
            </ol>
          </div>
          <div style="text-align:center">
            <button class="btn btn-primary" id="gen" style="min-width:min(100%,420px)">Generar certificado ${icon('external', 20)}</button>
            <p style="font-size:12px;color:var(--blue-700);margin-top:8px">Serás redirigido al sitio oficial de la Contraloría General de la República (Colombia).</p>
          </div>
        </div>
      </div>
    </section>
    <section class="card quick-links">
      <a href="${CONTRALORIA_URL}" target="_blank" rel="noopener">${icon('shield', 32)}<div><b>Contraloría</b><small>Persona jurídica</small></div></a>
      <button id="backup">${icon('upload', 32)}<div><b>Respaldo</b><small>Descargar mis datos</small></div></button>
      <a href="${DIAN_URL}" target="_blank" rel="noopener"><div style="text-align:center"><div class="dian">DIAN</div><small>Enlace directo</small></div></a>
    </section>`, { active: 'mi-empresa', left: 'menu' });
  bindShell();
  const copyNit = async () => {
    const v = $('#nit').value.trim();
    try { await navigator.clipboard.writeText(v); return true; } catch { return false; }
  };
  $('#copy').onclick = async () => toast((await copyNit()) ? 'NIT copiado' : 'No se pudo copiar el NIT');
  $('#gen').onclick = async () => {
    if (!$('#nit').value.trim()) { toast('Ingresa un NIT para consultar'); $('#nit').focus(); return; }
    const w = window.open(CONTRALORIA_URL, '_blank', 'noopener');
    const ok = await copyNit();
    toast(ok ? 'NIT copiado. Pégalo en el formulario de la Contraloría.' : 'Abriendo la Contraloría...');
    if (!w) location.href = CONTRALORIA_URL;
  };
  $('#backup').onclick = downloadBackup;
}

// ------------------------------------------------------------ EXPLORAR
async function viewExplore(params) {
  let sector = params?.get?.('sector') || '';
  let q = '';
  app.innerHTML = shell(`
    <section class="card">
      <form class="searchbar" id="ex-form">
        <div class="input">${icon('search', 22)}<input id="ex-q" placeholder="Buscar por nombre, producto, ciudad..." autofocus></div>
      </form>
    </section>
    <section class="card">
      <div class="section-title"><h2>${icon('building', 26)} Empresas y usuarios</h2>${sector ? `<button class="more-link" id="ex-all">Ver todas ${icon('x', 16)}</button>` : ''}</div>
      <div class="cats">${CATEGORIES.map((k) => `<a class="cat ${sector === k.sector ? 'active' : ''}" href="#/explorar?sector=${encodeURIComponent(k.sector)}"><div class="bubble" style="background:${k.bg}">${k.emoji}</div>${k.label}</a>`).join('')}</div>
    </section>
    <div class="company-grid" id="ex-list"><div class="spinner"></div></div>`, { active: 'explorar' });
  bindShell();
  $('#ex-all')?.addEventListener('click', () => (location.hash = '#/explorar'));
  const load = async () => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (sector) qs.set('sector', sector);
    const { companies } = await api('GET', '/companies?' + qs);
    const list = $('#ex-list');
    if (!companies.length) { list.innerHTML = `<div class="card empty" style="grid-column:1/-1">${icon('search', 40)}<p>No encontramos resultados.</p></div>`; return; }
    list.innerHTML = companies.map((u) => `<div class="card company-card">
      <div class="top" data-go="${u.id}">${avatar(u.company, 58)}<div style="min-width:0"><b>${esc(u.company.name)} ${u.company.verified ? icon('verified', 16) : ''}</b><small>@${esc(u.handle)} · ${esc(u.company.sector || 'Otro')}</small><small>${icon('pin', 13)} ${esc(u.company.location || u.company.country || '')}</small></div></div>
      <p>${u.company.slogan ? `"${esc(u.company.slogan)}"` : ''}</p>
      <small style="color:var(--muted)">${fmt(u.stats.followers)} seguidores · ${fmt(u.stats.posts)} publicaciones</small>
      <div class="row">
        <a class="btn btn-outline btn-sm btn-rect" href="#/empresa/${u.id}">Ver perfil</a>
        ${u.isMe ? `<a class="btn btn-primary btn-sm btn-rect" href="#/editar">Editar</a>` : `<button class="btn btn-sm btn-rect ${u.isFollowing ? 'btn-primary' : 'btn-outline'}" data-f="${u.id}">${u.isFollowing ? 'Siguiendo' : 'Seguir'}</button>`}
      </div></div>`).join('');
    $$('[data-go]').forEach((x) => (x.onclick = () => (location.hash = '#/empresa/' + x.dataset.go)));
    $$('[data-f]').forEach((b) => (b.onclick = async () => {
      try { const r = await api('POST', `/companies/${b.dataset.f}/follow`); toast(r.company.isFollowing ? `Ahora sigues a ${r.company.company.name}` : 'Dejaste de seguir'); load(); } catch (e) { toast(e.message); }
    }));
  };
  let deb;
  $('#ex-q').addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { q = e.target.value.trim(); load(); }, 300); });
  $('#ex-form').addEventListener('submit', (e) => { e.preventDefault(); q = $('#ex-q').value.trim(); load(); });
  await load();
}

// ------------------------------------------------------------ MENSAJES
async function viewMessages(otherId) {
  if (otherId instanceof URLSearchParams) otherId = undefined;
  app.innerHTML = shell(`
    <div class="chat-layout ${otherId ? 'in-chat' : ''}">
      <section class="card conv-list">
        <div class="section-title"><h2>${icon('message', 24)} Mensajes</h2><button class="more-link" id="new-chat">${icon('plus', 18)} Nuevo</button></div>
        <div id="convs"><div class="spinner"></div></div>
      </section>
      <section class="card chat" id="chat">
        <div class="empty" style="margin:auto">${icon('message', 50)}<p>Selecciona una conversación o inicia una nueva.</p></div>
      </section>
    </div>`, { active: 'mensajes', left: otherId ? 'back' : 'plus' });
  bindShell();
  $('#new-chat').onclick = pickRecipient;

  const loadConvs = async () => {
    const { conversations } = await api('GET', '/conversations');
    const el = $('#convs');
    if (!el) return;
    el.innerHTML = conversations.length ? conversations.map((cv) => `<a class="conv ${cv.user.id === otherId ? 'active' : ''}" href="#/mensajes/${cv.user.id}">${avatar(cv.user, 48)}
      <div class="txt"><b>${esc(cv.user.name)}</b><span>${cv.last.from === state.me.id ? 'Tú: ' : ''}${esc(cv.last.text)}</span></div>
      <div style="text-align:right"><small style="color:var(--muted);font-size:11px">${timeAgo(cv.last.createdAt).replace('Hace ', '')}</small><br>${cv.unread ? `<span class="unread">${cv.unread}</span>` : ''}</div></a>`).join('')
      : `<div class="empty">${icon('message', 36)}<p>Aún no tienes conversaciones.</p><button class="btn btn-primary btn-sm" id="start">Iniciar conversación</button></div>`;
    $('#start')?.addEventListener('click', pickRecipient);
  };
  await loadConvs();
  if (!otherId) return;

  let lastCount = -1;
  const loadChat = async (first) => {
    const { user, messages } = await api('GET', '/messages/' + otherId);
    if (!first && messages.length === lastCount) return;
    lastCount = messages.length;
    const chat = $('#chat');
    if (!chat) return;
    if (first) {
      chat.innerHTML = `<div class="chat-head"><a href="#/empresa/${user.id}" style="display:flex;align-items:center;gap:12px;color:inherit">${avatar(user, 42)}<div><b>${esc(user.name)}</b><br><small style="color:var(--muted)">@${esc(user.handle)} · ${esc(user.sector || '')}</small></div></a></div>
        <div class="chat-body" id="chat-body"></div>
        <form class="chat-foot" id="chat-form"><input id="chat-in" placeholder="Escribe un mensaje..." maxlength="1000" autocomplete="off"><button class="send-btn" aria-label="Enviar">${icon('send', 20)}</button></form>`;
      $('#chat-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inp = $('#chat-in'); const text = inp.value.trim(); if (!text) return;
        inp.value = '';
        try { await api('POST', '/messages/' + otherId, { text }); await loadChat(false); loadConvs(); } catch (err) { toast(err.message); }
      });
      $('#chat-in').focus();
    }
    const body = $('#chat-body');
    body.innerHTML = messages.length ? messages.map((m) => `<div class="msg ${m.from === state.me.id ? 'me' : ''}">${esc(m.text)}<time>${new Date(m.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</time></div>`).join('')
      : `<div class="empty" style="margin:auto">Escribe el primer mensaje a ${esc(user.name)} 👋</div>`;
    body.scrollTop = body.scrollHeight;
    if (!first) loadConvs();
    pollNotifications();
  };
  await loadChat(true);
  state.timers.push(setInterval(() => loadChat(false).catch(() => {}), 4000));
}
async function pickRecipient() {
  const { companies } = await api('GET', '/companies');
  openModal(`<div class="modal-head"><h3>Nuevo mensaje</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div class="input" style="margin-bottom:10px">${icon('search', 20)}<input id="r-q" placeholder="Buscar empresa o usuario..."></div>
    <div id="r-list" class="conv-list"></div>`, (m, close) => {
    const draw = (q = '') => {
      $('#r-list', m).innerHTML = companies.filter((u) => !u.isMe && u.company.name.toLowerCase().includes(q.toLowerCase()))
        .map((u) => `<button class="conv" data-id="${u.id}">${avatar(u.company, 44)}<div class="txt"><b>${esc(u.company.name)}</b><span>@${esc(u.handle)} · ${esc(u.company.sector)}</span></div></button>`).join('');
      $$('[data-id]', m).forEach((b) => (b.onclick = () => { close(); location.hash = '#/mensajes/' + b.dataset.id; }));
    };
    draw();
    $('#r-q', m).addEventListener('input', (e) => draw(e.target.value));
    $('#r-q', m).focus();
  });
}

// ------------------------------------------------------------ AJUSTES
async function viewSettings() {
  const { login } = await api('GET', '/me');
  const c = state.me.company;
  app.innerHTML = shell(`
    <section class="card">
      <div style="display:flex;gap:16px;align-items:center">${avatar(c, 72)}<div><b style="font-size:20px">${esc(c.name)}</b><br><small style="color:var(--muted)">@${esc(state.me.handle)} · Usuario: ${esc(login)}</small></div></div>
    </section>
    <section class="card settings-list">
      ${isStandalone() ? '' : `<button id="s-install">${icon('plus', 24)}<span class="grow"><b style="color:var(--blue-600)">Instalar ColW como app</b><br><small style="font-weight:500;color:var(--muted)">Ícono en tu pantalla de inicio y pantalla completa</small></span>${icon('chevronRight', 20)}</button>`}
      <a href="#/mi-empresa">${icon('building', 24)}<span class="grow">Ver mi empresa</span>${icon('chevronRight', 20)}</a>
      <a href="#/tienda/${state.me.id}">${icon('bag', 24)}<span class="grow">Mi tienda</span>${icon('chevronRight', 20)}</a>
      <a href="#/mis-productos">${icon('edit', 24)}<span class="grow">Mis productos</span>${icon('chevronRight', 20)}</a>
      <a href="#/tienda-ajustes">${icon('link', 24)}<span class="grow">Tienda Shopify</span>${icon('chevronRight', 20)}</a>
      <a href="#/carrito">${icon('cart', 24)}<span class="grow">Mi carrito</span>${icon('chevronRight', 20)}</a>
      <a href="#/pedidos">${icon('receipt', 24)}<span class="grow">Mis pedidos</span>${icon('chevronRight', 20)}</a>
      <a href="#/editar">${icon('edit', 24)}<span class="grow">Editar perfil de empresa</span>${icon('chevronRight', 20)}</a>
      <a href="#/antecedentes">${icon('file', 24)}<span class="grow">Antecedentes y certificados</span>${icon('chevronRight', 20)}</a>
      <button id="s-pass">${icon('lock', 24)}<span class="grow">Cambiar contraseña</span>${icon('chevronRight', 20)}</button>
      <button id="s-backup">${icon('upload', 24)}<span class="grow">Descargar respaldo de mis datos</span>${icon('chevronRight', 20)}</button>
      <a href="${DIAN_URL}" target="_blank" rel="noopener">${icon('external', 24)}<span class="grow">Portal DIAN</span>${icon('chevronRight', 20)}</a>
      <button id="s-reset">${icon('trash', 24)}<span class="grow">Restablecer datos de ejemplo</span>${icon('chevronRight', 20)}</button>
      <button id="s-about">${icon('info', 24)}<span class="grow">Acerca de ColW</span>${icon('chevronRight', 20)}</button>
      <button id="s-logout" class="danger" style="border-bottom:0">${icon('logout', 24)}<span class="grow">Cerrar sesión</span></button>
    </section>`, { active: 'ajustes', left: 'plus' });
  bindShell();
  $('#s-backup').onclick = downloadBackup;
  $('#s-install')?.addEventListener('click', installApp);
  $('#s-reset').onclick = () => confirmDialog('¿Restablecer datos?', 'Se borran los datos guardados en este dispositivo y vuelven los datos de ejemplo.', () => {
    window.mockApiReset(); logoutLocal(); toast('Datos de ejemplo restablecidos');
  });
  $('#s-logout').onclick = () => confirmDialog('¿Cerrar sesión?', 'Podrás volver a ingresar con tu móvil y contraseña.', async () => {
    try { await api('POST', '/logout'); } catch {}
    logoutLocal(); toast('Sesión cerrada');
  });
  $('#s-about').onclick = () => openModal(`<div class="modal-head"><h3>Acerca de ColW</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div style="background:linear-gradient(180deg,#1a3fc4,#2a5ee8);border-radius:16px;padding:18px">${brand()}</div>
    <p>ColW es la red empresarial de <b>CODESAH</b> que conecta empresas, informa novedades y transforma oportunidades en negocios.</p>
    <p style="color:var(--muted);font-size:14px">Versión 1.0.0</p>`);
  $('#s-pass').onclick = () => openModal(`<div class="modal-head"><h3>Cambiar contraseña</h3><button class="icon-btn" data-close>${icon('x')}</button></div>
    <div id="cp-err"></div>
    <div class="field"><label>Contraseña actual</label><div class="input">${icon('lock', 22)}<input type="password" id="cp-cur"></div></div>
    <div class="field"><label>Nueva contraseña</label><div class="input">${icon('lock', 22)}<input type="password" id="cp-new" placeholder="Mínimo 6 caracteres"></div></div>
    <div class="form-actions"><button class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary" id="cp-ok">Guardar</button></div>`, (m, close) => {
    $('#cp-ok', m).onclick = async () => {
      try { await api('PUT', '/me/password', { current: $('#cp-cur', m).value, password: $('#cp-new', m).value }); close(); toast('Contraseña actualizada'); }
      catch (e) { $('#cp-err', m).innerHTML = `<div class="form-error">${esc(e.message)}</div>`; }
    };
  });
}

// ------------------------------------------------------------ inicio
(async function boot() {
  if (state.token) {
    try {
      await refreshMe();
      const { companies } = await api('GET', '/companies');
      state.followingSet = new Set(companies.filter((x) => x.isFollowing).map((x) => x.id));
    } catch { /* token inválido */ }
  }
  state.followingSet = state.followingSet || new Set();
  render();
})();
