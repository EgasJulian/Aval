/* =====================================================================
   ColW — Tienda: catálogo, detalle, carrito, datos de envío y paso a Shopify.
   Se carga antes de app.js; usa sus utilidades ($, api, shell, icon...) al ejecutarse.
   ===================================================================== */
'use strict';

const CO_DEPARTMENTS = ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'];
const CURRENCY_SYMBOL = { EUR: '€', USD: 'US$', COP: '$', MXN: 'MX$', PEN: 'S/', CLP: '$' };
const CATEGORY_COPY = {
  'Equipos de cómputo': 'Laptops, computadores y accesorios para tu empresa',
  'Dispositivos móviles': 'Celulares y tabletas para trabajar desde cualquier lugar',
  'Cámaras de seguridad': 'Vigilancia de día y de noche para tu negocio',
  'Redes y conectividad': 'Wi-Fi, routers y switches para mantenerte en línea',
  'Audio y accesorios': 'Audífonos, periféricos y almacenamiento',
  'Impresión y escaneo': 'Impresoras multifuncionales de bajo costo por página',
  'Servicios tecnológicos': 'Mantenimiento, instalación y soporte técnico',
};

// ------------------------------------------------------------ utilidades
function money(n, cur = 'EUR') {
  const v = Number(n || 0);
  return `${CURRENCY_SYMBOL[cur] || cur} ${v.toLocaleString('es-CO', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}
function stars(r, size = 16) {
  return `<span class="stars" aria-label="${r.toFixed(1)} de 5">${[1, 2, 3, 4, 5].map((i) => icon(r >= i - 0.25 ? 'starFill' : 'star', size, r >= i - 0.25 ? 'on' : '')).join('')}</span>`;
}
function productImg(p, cls = '') {
  const src = p.images?.[0];
  return src ? `<img class="${cls}" src="${esc(src)}" alt="${esc(p.name)}" loading="lazy">` : `<div class="${cls} pimg-empty">${productEmoji(p.category || p.name)}</div>`;
}
function heartBtn(p) {
  return `<button class="fav ${p.isFavorite ? 'on' : ''}" data-fav="${p.id}" aria-label="${p.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${icon('heart', 20)}</button>`;
}
function productCard(p, { action = 'buy' } = {}) {
  return `<article class="pcard glass-card" data-pid="${p.id}">
    ${heartBtn(p)}
    <a class="pcard-img" href="#/producto/${p.id}">${productImg(p)}</a>
    <a class="pcard-name" href="#/producto/${p.id}">${esc(p.name)}</a>
    <div class="pcard-hl">${p.highlights.map(esc).join('<br>') || '&nbsp;'}</div>
    <div class="pcard-price">${money(p.price, p.currency)}${p.compareAt ? ` <s>${money(p.compareAt, p.currency)}</s>` : ''}</div>
    ${!p.inStock ? '<div class="pcard-out">Agotado</div>'
      : action === 'options' ? `<a class="btn btn-primary btn-sm btn-block-sm" href="#/producto/${p.id}">Ver opciones ${icon('arrowRight', 16)}</a>`
      : `<button class="btn btn-primary btn-sm btn-block-sm" data-add="${p.id}">${icon('cart', 17)} ${action === 'add' ? 'Agregar' : 'Comprar'}</button>`}
  </article>`;
}
function bindProductCards(root, onChange) {
  $$('[data-fav]', root).forEach((b) => (b.onclick = async (e) => {
    e.preventDefault();
    try {
      const { isFavorite } = await api('POST', `/products/${b.dataset.fav}/favorite`);
      b.classList.toggle('on', isFavorite);
      toast(isFavorite ? 'Agregado a favoritos' : 'Quitado de favoritos');
    } catch (err) { toast(err.message); }
  }));
  $$('[data-add]', root).forEach((b) => (b.onclick = () => addToCart(b.dataset.add, 1).then((ok) => ok && onChange?.())));
}
async function addToCart(productId, qty = 1, { silent = false } = {}) {
  const run = async (replace) => {
    const cart = await api('POST', '/cart', { productId, qty, replace });
    setCartCount(cart.count);
    if (!silent) toastAction('Producto agregado al carrito', 'Ver carrito', '#/carrito');
    return true;
  };
  try { return await run(false); } catch (e) {
    if (/una sola tienda/.test(e.message)) {
      return new Promise((resolve) => confirmDialog('¿Cambiar de tienda?', `${e.message} ¿Quieres vaciar tu carrito y agregar este producto?`, async () => resolve(await run(true))));
    }
    toast(e.message);
    return false;
  }
}
function toastAction(msg, label, href) {
  const t = $('#toast');
  t.innerHTML = `${esc(msg)} <a href="${href}" class="toast-link">${esc(label)}</a>`;
  t.classList.add('show', 'interactive');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show', 'interactive'), 3500);
}
function setCartCount(n) {
  state.cartCount = n;
  $$('.cart-badge').forEach((b) => { b.textContent = n; b.classList.toggle('zero', !n); });
}
async function refreshCartCount() { try { setCartCount((await api('GET', '/cart')).count); } catch {} }

function storeBar({ storeId, q = '', back = false } = {}) {
  return `<section class="store-bar glass-card">
    ${back ? `<button class="round-btn sm" data-back aria-label="Volver">${icon('chevronLeft', 22)}</button>` : ''}
    <form class="store-search" id="store-search">
      <div class="input">${icon('search', 20)}<input id="store-q" value="${esc(q)}" placeholder="Buscar productos, marcas o categorías..." enterkeyhint="search"></div>
      <button class="btn btn-primary btn-rect">Buscar</button>
    </form>
    <a class="round-btn sm cart-btn" href="#/carrito" aria-label="Carrito">${icon('cart', 22)}<span class="cart-badge ${state.cartCount ? '' : 'zero'}">${state.cartCount || 0}</span></a>
    <a class="bar-link" href="#/pedidos">${icon('receipt', 20)}<span>Mis pedidos</span></a>
    ${storeId ? `<a class="bar-link" href="#/mensajes/${storeId}">${icon('headset', 20)}<span>Ayuda</span></a>` : ''}
  </section>`;
}
function bindStoreBar(storeId) {
  $('[data-back]')?.addEventListener('click', () => (history.length > 1 ? history.back() : (location.hash = '#/inicio')));
  $('#store-search')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#store-q').value.trim();
    location.hash = `#/tienda/${storeId || state.lastStore || state.me.id}${q ? '?q=' + encodeURIComponent(q) : ''}`;
  });
}
function crumbs(items, right = '') {
  return `<nav class="crumbs" aria-label="Ruta"><a href="#/inicio" aria-label="Inicio">${icon('home', 18)}</a>${items.map(([label, href]) => `${icon('chevronRight', 14)}${href ? `<a href="${href}">${esc(label)}</a>` : `<b>${esc(label)}</b>`}`).join('')}${right ? `<span class="crumbs-right">${right}</span>` : ''}</nav>`;
}
function companyStrip(c, id) {
  return `<section class="glass-card company-strip">
    <a href="#/empresa/${id}" class="cs-logo">${avatar(c, 84)}</a>
    <div class="cs-main"><a href="#/empresa/${id}" class="cs-name">${esc(c.name)} ${c.verified ? icon('verified', 22) : ''}</a>
      <div class="profile-line">${flag(c.country)} ${esc(c.country || '')}</div>${c.nit ? `<div class="profile-line">${icon('building', 20)} NIT: ${esc(c.nit)}</div>` : ''}</div>
    ${c.phone || c.email ? `<div class="contact-box"><div class="tagline">Conectamos <span class="dot"></span> Informamos <span class="dot"></span> Transformamos</div><b>Contáctanos:</b>
      ${c.phone ? `<span class="cline">${icon('phone', 18)} ${esc(c.phone)}</span>` : ''}${c.email ? `<span class="cline">${icon('mail', 18)} ${esc(c.email)}</span>` : ''}</div>` : ''}
  </section>`;
}
function carouselControls(track) {
  const wrap = track.parentElement;
  const step = () => Math.max(track.clientWidth * 0.8, 200);
  $('[data-prev]', wrap)?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-next]', wrap)?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  const dots = $('.dots-row', wrap);
  if (!dots) return;
  const pages = () => Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth - 0.05));
  const draw = () => {
    const n = pages(), cur = Math.round(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth) * (n - 1)) || 0;
    dots.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i === cur ? 'on' : ''}"></i>`).join('') : '';
  };
  track.addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true });
  draw();
}

// ------------------------------------------------------------ TIENDA en el perfil de la empresa
async function mountProfileStore(el, u) {
  let data;
  try { data = await api('GET', '/store/' + u.id); } catch { el.innerHTML = ''; return; }
  const { products, categories, store } = data;
  const featured = (products.filter((p) => p.featured).length ? products.filter((p) => p.featured) : products).slice(0, 10);
  const cats = categories.filter((c) => c.count);
  if (!products.length) {
    el.innerHTML = `<div class="section-title"><h2>${icon('bag', 26)} Tienda</h2></div>
      <div class="empty" style="padding:16px">${store.isMine ? `Tu tienda aún no tiene productos. <a href="#/producto-editar/nuevo">Agregar el primero</a>` : 'Esta empresa aún no publicó productos en su tienda.'}</div>
      ${cats.length ? `<div class="subhead-row"><h3>${icon('grid', 22)} Productos y servicios</h3></div><div class="cat-cards">${cats.map((c) => `<div class="cat-card glass-card"><div class="cat-card-img">${productEmoji(c.name)}</div><span>${esc(c.name)}</span></div>`).join('')}</div>` : ''}`;
    return;
  }
  el.innerHTML = `
    <div class="section-title"><h2>${icon('bag', 26)} Tienda</h2>${store.isMine ? `<a href="#/mis-productos">${icon('edit', 16)} Administrar</a>` : ''}</div>
    <div class="subhead-row"><h3>${icon('starFill', 22, 'gold')} Productos destacados</h3><a href="#/tienda/${u.id}">Ver todos los productos ${icon('arrowRight', 18)}</a></div>
    <div class="carousel">
      <div class="track" id="feat-track">${featured.map((p) => productCard(p, { action: 'options' })).join('')}</div>
      <div class="carousel-nav"><button class="round-btn sm" data-prev aria-label="Anteriores">${icon('chevronLeft', 20)}</button><div class="dots-row"></div><button class="round-btn sm" data-next aria-label="Siguientes">${icon('chevronRight', 20)}</button></div>
    </div>
    <div class="subhead-row"><h3>${icon('grid', 22)} Productos por categoría</h3><a href="#/tienda/${u.id}">Ver todas las categorías ${icon('arrowRight', 18)}</a></div>
    <div class="cat-cards">${cats.map((c) => `<a class="cat-card glass-card" href="#/tienda/${u.id}?cat=${encodeURIComponent(c.name)}">
      <div class="cat-card-img">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : productEmoji(c.name)}</div>
      <span>${esc(c.name)}</span><span class="btn btn-primary btn-xs">Ingresar ${icon('arrowRight', 14)}</span></a>`).join('')}</div>`;
  bindProductCards(el);
  carouselControls($('#feat-track', el));
}

// ------------------------------------------------------------ CATÁLOGO (imagen 4)
async function viewStore(id, params) {
  const [{ company: u }, data] = await Promise.all([api('GET', '/companies/' + id), api('GET', '/store/' + id)]);
  state.lastStore = id;
  const { products, store } = data;
  const q = params?.get?.('q') || '';
  const cats = data.categories.filter((c) => c.count);
  let cat = params?.get?.('cat') || (q ? '' : cats[0]?.name || '');
  const c = u.company;
  app.innerHTML = shell(`
    ${companyStrip(c, u.id)}
    ${storeBar({ storeId: u.id, q, back: true })}
    ${!store.connected && store.isMine ? `<a class="notice" href="#/tienda-ajustes">${icon('link', 20)} Tu tienda aún no está conectada a Shopify. Conéctala para que tus clientes puedan pagar. ${icon('arrowRight', 16)}</a>` : ''}
    <div class="store-head"><h1>${icon('bag', 28)} Tienda</h1>${store.isMine ? `<a class="btn btn-outline btn-sm" href="#/mis-productos">${icon('edit', 16)} Administrar productos</a>` : ''}</div>
    <div class="cat-tabs" role="tablist">${cats.map((k) => `<button role="tab" class="cat-tab glass-card ${k.name === cat ? 'active' : ''}" data-cat="${esc(k.name)}" aria-selected="${k.name === cat}">
      <span class="ct-img">${k.image ? `<img src="${esc(k.image)}" alt="">` : productEmoji(k.name)}</span><span>${esc(k.name)}</span></button>`).join('')}</div>
    <section class="store-hero" id="store-hero"></section>
    <section class="glass-card section-pad">
      <div class="subhead-row"><h3 id="grid-title"></h3><span class="muted" id="grid-count"></span></div>
      <div class="pgrid" id="pgrid"></div>
    </section>`, { left: 'back' });
  bindShell();
  bindStoreBar(u.id);
  refreshCartCount();

  const draw = () => {
    const list = q && !cat
      ? products.filter((p) => [p.name, p.brand, p.category, ...p.highlights].join(' ').toLowerCase().includes(q.toLowerCase()))
      : products.filter((p) => p.category === cat);
    $('#grid-title').innerHTML = q && !cat ? `${icon('search', 22)} Resultados para "${esc(q)}"` : `${icon('starFill', 22, 'gold')} ${cat === cats[0]?.name && !params?.get?.('cat') ? 'Productos destacados' : esc(cat)}`;
    $('#grid-count').textContent = `${list.length} ${list.length === 1 ? 'producto' : 'productos'}`;
    $('#pgrid').innerHTML = list.length ? list.map((p) => productCard(p)).join('') : `<div class="empty" style="grid-column:1/-1">${icon('search', 40)}<p>No encontramos productos${q ? ` para "${esc(q)}"` : ''}.</p></div>`;
    bindProductCards($('#pgrid'));
    $$('.cat-tab').forEach((t) => { const on = t.dataset.cat === cat; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
    mountStoreHero($('#store-hero'), cat || cats[0]?.name, products);
  };
  $$('.cat-tab').forEach((t) => (t.onclick = () => { cat = t.dataset.cat; draw(); t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }));
  draw();
}
function mountStoreHero(el, cat, products) {
  if (!cat) { el.hidden = true; return; }
  el.hidden = false;
  const items = products.filter((p) => p.category === cat && p.images?.length);
  const slides = [
    { title: cat, text: CATEGORY_COPY[cat] || 'Encuentra lo que tu empresa necesita', imgs: items.slice(0, 2) },
    ...items.filter((p) => p.featured || p.compareAt).slice(0, 2).map((p) => ({ title: p.name, text: p.highlights.join(' · '), imgs: [p], price: money(p.price, p.currency), pid: p.id })),
  ];
  let i = 0;
  const show = () => {
    const s = slides[i];
    el.innerHTML = `<div class="sh-text"><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>
        ${s.price ? `<div class="sh-price">${s.price}</div>` : ''}
        ${s.pid ? `<a class="btn btn-primary" href="#/producto/${s.pid}">Ver producto ${icon('arrowRight', 18)}</a>` : `<button class="btn btn-primary" id="sh-all">Ver todos los productos ${icon('arrowRight', 18)}</button>`}</div>
      <div class="sh-art">${s.imgs.map((p, k) => `<img class="sh-img sh-img-${k}" src="${esc(p.images[0])}" alt="">`).join('')}</div>
      ${slides.length > 1 ? `<button class="round-btn sm sh-prev" aria-label="Anterior">${icon('chevronLeft', 20)}</button><button class="round-btn sm sh-next" aria-label="Siguiente">${icon('chevronRight', 20)}</button>
      <div class="sh-dots">${slides.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>` : ''}`;
    $('#sh-all', el)?.addEventListener('click', () => $('#pgrid').scrollIntoView({ behavior: 'smooth' }));
    $('.sh-prev', el)?.addEventListener('click', () => { i = (i - 1 + slides.length) % slides.length; show(); });
    $('.sh-next', el)?.addEventListener('click', () => { i = (i + 1) % slides.length; show(); });
  };
  show();
}

// ------------------------------------------------------------ DETALLE DE PRODUCTO (imagen 5)
async function viewProduct(id) {
  const { product: p, related, reviews } = await api('GET', '/products/' + id);
  state.lastStore = p.userId;
  let qty = 1, img = 0;
  const isMine = p.userId === state.me.id;
  const ship = p.shipping || {};
  const intro = (p.description || '').split(/(?<=\.)\s/).slice(0, 2).join(' ');
  app.innerHTML = shell(`
    ${storeBar({ storeId: p.userId })}
    ${crumbs([['Tienda', `#/tienda/${p.userId}`], [p.category, `#/tienda/${p.userId}?cat=${encodeURIComponent(p.category)}`], [p.name]], `<a href="#/tienda/${p.userId}">${icon('arrowLeft', 18)} Volver a la tienda</a>`)}
    <section class="pd-top">
      <div class="glass-card pd-gallery">
        <div class="pd-main">${heartBtn(p)}<div id="pd-img"></div>
          ${p.images.length > 1 ? `<button class="round-btn sm pd-prev" aria-label="Imagen anterior">${icon('chevronLeft', 20)}</button><button class="round-btn sm pd-next" aria-label="Imagen siguiente">${icon('chevronRight', 20)}</button>` : ''}</div>
        ${p.images.length > 1 ? `<div class="pd-thumbs">${p.images.map((s, k) => `<button class="pd-thumb glass-card" data-img="${k}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}
      </div>
      <div class="glass-card pd-info">
        <div class="pd-brandrow"><span class="brand-chip">${esc(p.brand || p.store.name)}</span><span class="stock ${p.inStock ? '' : 'out'}">${icon(p.inStock ? 'checkCircle' : 'x', 18)} ${p.inStock ? 'En stock' : 'Agotado'}</span></div>
        <h1 class="pd-name">${esc(p.name)}</h1>
        <div class="pd-meta">${[p.model && `Modelo: ${esc(p.model)}`, p.sku && `SKU: ${esc(p.sku)}`].filter(Boolean).join('<span class="sep">|</span>')}</div>
        <a class="pd-rating" href="#" data-tab-link="valoraciones">${p.reviews ? `${stars(p.rating)} <b>${p.rating.toFixed(1)}</b> <u>(${p.reviews} ${p.reviews === 1 ? 'valoración' : 'valoraciones'})</u>` : `${stars(0)} <u>Sé el primero en valorar</u>`}</a>
        <div class="pd-price">${money(p.price, p.currency)}${p.compareAt ? ` <s>${money(p.compareAt, p.currency)}</s>` : ''}</div>
        <div class="muted">${ship.taxIncluded ? 'Precio incluye IVA' : `Precio + IVA (${ship.taxRate}%)`}</div>
        ${intro ? `<p class="pd-intro">${esc(intro)}</p>` : ''}
        <div class="qty-row"><b>Cantidad:</b><div class="qty"><button data-q="-1" aria-label="Menos">${icon('minus', 18)}</button><span id="qty">1</span><button data-q="1" aria-label="Más">${icon('plus', 18)}</button></div></div>
        <div class="pd-actions">
          <button class="btn btn-outline btn-lg" id="add-cart" ${p.inStock ? '' : 'disabled'}>${icon('cart', 22)} Añadir al carrito</button>
          <button class="btn btn-primary btn-lg" id="buy-now" ${p.inStock ? '' : 'disabled'}>${icon('bag', 22)} Comprar ahora</button>
        </div>
        <div class="perks">
          ${ship.freeShippingFrom > 0 ? `<div>${icon('truck', 26)}<span><b>Envío gratis</b>A partir de ${money(ship.freeShippingFrom, p.currency)}</span></div>` : `<div>${icon('truck', 26)}<span><b>Envío</b>Se calcula al pagar</span></div>`}
          <div>${icon('shield', 26)}<span><b>Garantía oficial</b>Del fabricante</span></div>
          <div>${icon('lock', 26)}<span><b>Pago seguro</b>Con Shopify</span></div>
        </div>
        ${isMine ? `<a class="btn btn-ghost btn-sm" href="#/producto-editar/${p.id}">${icon('edit', 16)} Editar este producto</a>` : ''}
      </div>
    </section>
    <div class="tabs glass-card" role="tablist">
      ${[['descripcion', 'file', 'Descripción'], ['especificaciones', 'sliders', 'Especificaciones'], ['galeria', 'image', 'Galería'], ['valoraciones', 'star', 'Valoraciones'], ['envio', 'truck', 'Envío y devoluciones']]
        .map(([k, ic, l], n) => `<button role="tab" class="tab ${n === 0 ? 'active' : ''}" data-tab="${k}">${icon(ic, 20)} <span>${l}</span></button>`).join('')}
    </div>
    <div id="tab-body"></div>
    ${related.length ? `<section class="glass-card section-pad">
      <div class="subhead-row"><h3>${icon('grid', 22)} Productos relacionados</h3><a href="#/tienda/${p.userId}">Ver más productos ${icon('arrowRight', 18)}</a></div>
      <div class="carousel"><div class="track" id="rel-track">${related.map((r) => productCard(r, { action: 'options' })).join('')}</div></div></section>` : ''}`, { left: 'back' });
  bindShell();
  bindStoreBar(p.userId);
  refreshCartCount();
  bindProductCards(app);

  const drawImg = () => {
    $('#pd-img').innerHTML = productImg({ ...p, images: p.images.slice(img) }, 'pd-img');
    $$('.pd-thumb').forEach((t) => t.classList.toggle('active', +t.dataset.img === img));
  };
  drawImg();
  $$('.pd-thumb').forEach((t) => (t.onclick = () => { img = +t.dataset.img; drawImg(); }));
  $('.pd-prev')?.addEventListener('click', () => { img = (img - 1 + p.images.length) % p.images.length; drawImg(); });
  $('.pd-next')?.addEventListener('click', () => { img = (img + 1) % p.images.length; drawImg(); });
  $$('[data-q]').forEach((b) => (b.onclick = () => { qty = Math.max(1, Math.min(99, qty + +b.dataset.q)); $('#qty').textContent = qty; }));
  $('#add-cart').onclick = () => addToCart(p.id, qty);
  $('#buy-now').onclick = async () => { if (await addToCart(p.id, qty, { silent: true })) location.hash = '#/carrito'; };

  const specsTable = (rows) => rows.length ? `<table class="specs">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>` : '<p class="muted">La tienda aún no agregó especificaciones.</p>';
  const tabs = {
    descripcion: () => `<div class="pd-cols">
        <section class="glass-card section-pad"><h3 class="h3">Descripción del producto</h3><p class="lead">${esc(p.description || 'Sin descripción por ahora.')}</p>
          ${p.features.length ? `<h3 class="h3">Características principales</h3><ul class="checks">${p.features.map((f) => `<li>${icon('checkCircle', 20)} ${esc(f)}</li>`).join('')}</ul>` : ''}
          ${p.inBox.length ? `<div class="inbox"><h4>${icon('info', 20)} ¿Qué incluye la caja?</h4><div class="inbox-row">${p.inBox.map((x, k) => `<div>${icon(['briefcase', 'link', 'file', 'shield'][k % 4], 30)}<span>${esc(x)}</span></div>`).join('')}</div></div>` : ''}
        </section>
        <section class="glass-card section-pad"><h3 class="h3">${icon('sliders', 22)} Especificaciones técnicas</h3>${specsTable(p.specs)}</section></div>`,
    especificaciones: () => `<section class="glass-card section-pad"><h3 class="h3">Especificaciones técnicas</h3>${specsTable(p.specs)}</section>`,
    galeria: () => `<section class="glass-card section-pad"><div class="gallery-grid">${p.images.map((s) => `<div class="glass-card"><img src="${esc(s)}" alt="${esc(p.name)}"></div>`).join('') || '<p class="muted">Sin imágenes.</p>'}</div></section>`,
    valoraciones: () => `<section class="glass-card section-pad">
        <div class="rv-summary"><div class="rv-big">${p.reviews ? p.rating.toFixed(1) : '–'}</div><div>${stars(p.rating, 22)}<div class="muted">${p.reviews} ${p.reviews === 1 ? 'valoración' : 'valoraciones'}</div></div></div>
        ${isMine ? '' : `<form class="rv-form" id="rv-form"><b>Tu valoración</b><div class="rv-stars" id="rv-stars">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-r="${i}" aria-label="${i} estrellas">${icon('star', 28)}</button>`).join('')}</div>
          <div class="input"><input id="rv-text" maxlength="600" placeholder="Cuéntale a otras empresas qué te pareció (opcional)"></div><button class="btn btn-primary btn-sm">Publicar valoración</button></form>`}
        <div class="rv-list">${reviews.length ? reviews.map((r) => `<div class="rv">${avatar(r.author, 40)}<div><b>${esc(r.author.name)}</b> ${stars(r.rating, 14)} <small class="muted">${timeAgo(r.createdAt)}</small>${r.text ? `<p>${esc(r.text)}</p>` : ''}</div></div>`).join('') : '<p class="muted">Todavía no hay valoraciones.</p>'}</div></section>`,
    envio: () => `<section class="glass-card section-pad prose"><h3 class="h3">Envío y devoluciones</h3>
        <p>${icon('lock', 18)} El pago se hace en la plataforma segura de <b>Shopify</b> de ${esc(p.store.name)}. Allí verás el costo final de envío y los métodos de pago disponibles.</p>
        <p>${icon('truck', 18)} ${ship.freeShippingFrom > 0 ? `Envío gratis en compras desde <b>${money(ship.freeShippingFrom, p.currency)}</b>.` : 'El costo de envío se calcula según tu dirección.'}</p>
        <p>${icon('headset', 18)} Para cambios, devoluciones o garantías escríbele a la tienda desde <a href="#/mensajes/${p.userId}">Mensajes</a>.</p></section>`,
  };
  let rating = 0;
  const showTab = (k) => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === k));
    $('#tab-body').innerHTML = tabs[k]();
    if (k === 'valoraciones' && $('#rv-form')) {
      const paint = () => $$('#rv-stars button').forEach((b) => { b.innerHTML = icon(+b.dataset.r <= rating ? 'starFill' : 'star', 28); b.classList.toggle('on', +b.dataset.r <= rating); });
      $$('#rv-stars button').forEach((b) => (b.onclick = () => { rating = +b.dataset.r; paint(); }));
      $('#rv-form').onsubmit = async (e) => {
        e.preventDefault();
        try { await api('POST', `/products/${p.id}/reviews`, { rating, text: $('#rv-text').value }); toast('¡Gracias por tu valoración!'); viewProduct(p.id).then(() => $('[data-tab="valoraciones"]').click()); }
        catch (err) { toast(err.message); }
      };
    }
  };
  $$('.tab').forEach((t) => (t.onclick = () => showTab(t.dataset.tab)));
  $('[data-tab-link]').onclick = (e) => { e.preventDefault(); showTab('valoraciones'); $('.tabs').scrollIntoView({ behavior: 'smooth' }); };
  showTab('descripcion');
}

// ------------------------------------------------------------ CARRITO (imagen 6, sin métodos de pago)
function summaryRows(t, { compact = false } = {}) {
  return `<dl class="sum">
    <div><dt>Subtotal</dt><dd>${money(t.subtotal, t.currency)}</dd></div>
    ${compact ? '' : `<div><dt>Descuento</dt><dd>- ${money(t.discount, t.currency)}</dd></div>`}
    <div><dt>Envío</dt><dd class="${t.freeShipping ? 'ok' : ''}">${t.freeShipping ? 'Gratis' : 'Se calcula en Shopify'}</dd></div>
    <div><dt>${t.taxIncluded ? `IVA incluido (${t.taxRate}%)` : `IVA (${t.taxRate}%)`}</dt><dd>${money(t.tax, t.currency)}</dd></div>
  </dl>
  <div class="sum-total"><span>${compact ? 'Total a pagar' : 'Total'}</span><b>${money(t.total, t.currency)}</b></div>
  <div class="muted right">${t.taxIncluded ? 'Precio final con IVA incluido' : 'IVA sumado al total'}${t.freeShipping ? '' : ' · más envío'}</div>`;
}
async function viewCart() {
  const cart = await api('GET', '/cart');
  setCartCount(cart.count);
  const storeId = cart.store?.id || state.lastStore;
  let suggestions = [];
  if (storeId) {
    try { suggestions = (await api('GET', `/products?company=${storeId}`)).products.filter((p) => !cart.items.some((i) => i.product.id === p.id) && p.inStock).sort((a, b) => a.price - b.price).slice(0, 8); } catch {}
  }
  const t = cart.totals;
  app.innerHTML = shell(`
    ${storeBar({ storeId })}
    ${crumbs([['Carrito de compras']])}
    ${cart.items.length ? `<div class="cart-layout">
      <section class="glass-card section-pad">
        <div class="subhead-row"><h2 class="h2">${icon('cart', 28)} Carrito de compras <small>(${cart.count} ${cart.count === 1 ? 'producto' : 'productos'})</small></h2><button class="btn btn-ghost btn-sm" id="empty-cart">${icon('trash', 18)} Vaciar carrito</button></div>
        ${cart.store ? `<div class="muted cart-store">Compra en la tienda de <a href="#/empresa/${cart.store.id}"><b>${esc(cart.store.name)}</b></a></div>` : ''}
        <div class="cart-items">${cart.items.map(({ product: p, qty }) => `<article class="cart-item glass-card" data-pid="${p.id}">
          <a href="#/producto/${p.id}" class="ci-img">${productImg(p)}</a>
          <div class="ci-body"><a href="#/producto/${p.id}" class="ci-name">${esc(p.name)}</a>
            <div class="muted">${[p.model && `Modelo: ${esc(p.model)}`, p.sku && `SKU: ${esc(p.sku)}`].filter(Boolean).join(' | ')}</div>
            <div class="muted">${p.highlights.map(esc).join(' | ')}</div>
            <div class="ci-row"><span class="stock ${p.inStock ? '' : 'out'}">${icon(p.inStock ? 'checkCircle' : 'x', 18)} ${p.inStock ? 'En stock' : 'Agotado'}</span>
              <div class="qty"><button data-dq="-1" aria-label="Menos">${icon('minus', 16)}</button><span>${qty}</span><button data-dq="1" aria-label="Más">${icon('plus', 16)}</button></div></div>
          </div>
          <div class="ci-side"><button class="icon-btn" data-del aria-label="Quitar">${icon('trash', 22)}</button><b class="ci-price">${money(p.price * qty, p.currency)}</b>${qty > 1 ? `<small class="muted">${money(p.price, p.currency)} c/u</small>` : ''}</div>
        </article>`).join('')}</div>
        <a href="#/tienda/${storeId}" class="back-link">${icon('arrowLeft', 18)} Seguir comprando</a>
      </section>
      <aside class="cart-side">
        <section class="glass-card section-pad">
          <h2 class="h2">${icon('receipt', 26)} Resumen de compra</h2>
          ${summaryRows(t)}
          ${!t.freeShipping && t.freeShippingFrom > 0 ? `<div class="hint">${icon('truck', 20)} Te faltan <b>${money(t.freeShippingFrom - t.subtotal, t.currency)}</b> para el envío gratis.</div>` : t.freeShipping ? `<div class="hint ok">${icon('truck', 20)} <span><b>Envío gratis</b><br>En compras desde ${money(t.freeShippingFrom, t.currency)}</span></div>` : ''}
          <a class="btn btn-primary btn-lg btn-block" href="#/checkout">${icon('lock', 20)} Finalizar compra ${icon('arrowRight', 20)}</a>
        </section>
        <section class="trust glass-card">
          <div>${icon('shield', 26)}<b>Compra segura</b><small>Pago en Shopify</small></div>
          <div>${icon('truck', 26)}<b>Envío</b><small>A tu dirección</small></div>
          <div>${icon('package', 26)}<b>Garantía</b><small>Del fabricante</small></div>
        </section>
      </aside></div>`
    : `<section class="glass-card empty big-empty">${icon('cart', 56)}<h2>Tu carrito está vacío</h2><p>Explora la tienda y agrega los productos que necesitas.</p>${storeId ? `<a class="btn btn-primary" href="#/tienda/${storeId}">Ir a la tienda ${icon('arrowRight', 18)}</a>` : `<a class="btn btn-primary" href="#/explorar">Explorar empresas</a>`}</section>`}
    ${suggestions.length ? `<section class="glass-card section-pad">
      <div class="subhead-row"><h3>${icon('starFill', 22, 'gold')} También te puede interesar</h3><a href="#/tienda/${storeId}">Ver más productos ${icon('arrowRight', 18)}</a></div>
      <div class="carousel"><div class="track">${suggestions.map((p) => productCard(p, { action: 'add' })).join('')}</div>
      <div class="carousel-nav"><button class="round-btn sm" data-prev aria-label="Anteriores">${icon('chevronLeft', 20)}</button><div class="dots-row"></div><button class="round-btn sm" data-next aria-label="Siguientes">${icon('chevronRight', 20)}</button></div></div></section>` : ''}`, { left: 'back' });
  bindShell();
  bindStoreBar(storeId);
  bindProductCards(app, () => viewCart());
  $$('.carousel .track').forEach(carouselControls);
  $$('.cart-item').forEach((row) => {
    const item = cart.items.find((i) => i.product.id === row.dataset.pid);
    $$('[data-dq]', row).forEach((b) => (b.onclick = async () => {
      const qty = item.qty + +b.dataset.dq;
      try {
        if (qty < 1) await api('DELETE', '/cart/' + item.product.id);
        else await api('POST', '/cart', { productId: item.product.id, qty, mode: 'set' });
        viewCart();
      } catch (e) { toast(e.message); }
    }));
    $('[data-del]', row).onclick = async () => { await api('DELETE', '/cart/' + item.product.id); toast('Producto quitado del carrito'); viewCart(); };
  });
  $('#empty-cart')?.addEventListener('click', () => confirmDialog('¿Vaciar el carrito?', 'Se quitarán todos los productos.', async () => { await api('DELETE', '/cart'); viewCart(); }));
}

// ------------------------------------------------------------ DATOS DE ENVÍO (imagen 7 ajustada) → Shopify
function checkoutSteps(current) {
  const steps = ['Carrito', 'Datos de envío', 'Pago en Shopify', 'Confirmación'];
  return `<ol class="stepper glass-card">${steps.map((s, i) => `<li class="${i < current ? 'done' : i === current ? 'now' : ''}">
    <span class="dot">${i < current ? icon('check', 18) : i + 1}</span><span class="lbl">${s}</span></li>`).join('')}</ol>`;
}
async function viewCheckout() {
  const [cart, { address: saved }] = await Promise.all([api('GET', '/cart'), api('GET', '/me/address')]);
  setCartCount(cart.count);
  if (!cart.items.length) { location.hash = '#/carrito'; return; }
  const me = state.me.company;
  const a = saved || { fullName: '', phone: me.phone || '', email: '', address1: '', address2: '', city: '', province: '', zip: '', country: me.country || 'Colombia' };
  const t = cart.totals;
  app.innerHTML = shell(`
    ${checkoutSteps(1)}
    <div class="checkout-grid">
      <section class="glass-card section-pad">
        <div class="subhead-row"><h2 class="h2">${icon('pin', 28)} Dirección de envío</h2>${saved ? `<button class="btn btn-outline btn-xs" id="use-saved" type="button">${icon('check', 16)} Usar mi dirección guardada</button>` : ''}</div>
        <form id="ship-form" class="ship-form" novalidate>
          <div class="field"><label for="f-name">Nombre completo *</label><div class="input">${icon('user', 20)}<input id="f-name" autocomplete="name" placeholder="Ej. Juan Pérez" required></div></div>
          <div class="field"><label for="f-phone">Teléfono *</label><div class="input">${icon('phone', 20)}<input id="f-phone" type="tel" autocomplete="tel" placeholder="+57 300 123 4567" required></div></div>
          <div class="field span2"><label for="f-addr">Dirección *</label><div class="input">${icon('pin', 20)}<input id="f-addr" autocomplete="address-line1" placeholder="Calle 12 # 34 - 56" required></div></div>
          <div class="field span2"><label for="f-addr2">Apartamento, oficina o referencia</label><div class="input">${icon('building', 20)}<input id="f-addr2" autocomplete="address-line2" placeholder="Opcional"></div></div>
          <div class="field"><label for="f-country">País *</label><div class="input">${icon('globe', 20)}<select id="f-country" autocomplete="country-name">${COUNTRIES.filter((x) => x !== 'Otro').map((x) => `<option>${x}</option>`).join('')}</select>${icon('chevronDown', 18)}</div></div>
          <div class="field"><label for="f-prov" id="f-prov-label">Departamento *</label><div class="input" id="prov-wrap"></div></div>
          <div class="field"><label for="f-city">Ciudad *</label><div class="input">${icon('storeFront', 20)}<input id="f-city" list="co-cities" autocomplete="address-level2" placeholder="Ej. Popayán" required><datalist id="co-cities">${CITIES.map((x) => `<option value="${esc(x.split(',')[0])}">`).join('')}</datalist></div></div>
          <div class="field"><label for="f-zip">Código postal *</label><div class="input">${icon('mail', 20)}<input id="f-zip" inputmode="numeric" autocomplete="postal-code" placeholder="Ej. 190001" required></div></div>
          <div class="field span2"><label for="f-email">Correo para la confirmación</label><div class="input">${icon('mail', 20)}<input id="f-email" type="email" autocomplete="email" placeholder="Opcional: Shopify te enviará el recibo aquí"></div></div>
          <label class="check span2"><input type="checkbox" id="f-save" checked> Guardar esta dirección en mi cuenta</label>
        </form>
      </section>
      <aside class="glass-card section-pad co-summary">
        <div class="subhead-row"><h2 class="h2">${icon('cart', 26)} Resumen de pedido</h2><a href="#/carrito">Editar carrito</a></div>
        <div class="co-items">${cart.items.map(({ product: p, qty }) => `<div class="co-item"><div class="co-img">${productImg(p)}</div><div class="co-txt"><b>${esc(p.name)}</b><small>Cant. ${qty}</small></div><b>${money(p.price * qty, p.currency)}</b></div>`).join('')}</div>
        ${summaryRows(t, { compact: true })}
        <div id="co-err"></div>
        <button class="btn btn-primary btn-xl btn-block" id="go-shopify">${icon('lock', 22)} Ir a comprar ${icon('arrowRight', 22)}</button>
        <div class="secure-note">${icon('shield', 30)}<span><b>Pago 100% seguro en Shopify</b>Al continuar te llevamos a la tienda Shopify de ${esc(cart.store?.name || 'la empresa')} con tu carrito y tu dirección listos.</span></div>
      </aside>
    </div>
    <section class="glass-card section-pad how-next">
      <div class="hn">${icon('pin', 28)}<span><b>1. Confirma tu dirección</b>Revisa que los datos de envío estén completos.</span></div>
      <div class="hn">${icon('lock', 28)}<span><b>2. Paga en Shopify</b>Eliges el método de pago y el envío en la plataforma segura de Shopify.</span></div>
      <div class="hn">${icon('mail', 28)}<span><b>3. Recibe la confirmación</b>Shopify te envía el recibo y el seguimiento de tu pedido.</span></div>
    </section>`, { left: 'back', header: 'blue', right: 'cart' });
  bindShell();

  const fill = (x) => {
    $('#f-name').value = x.fullName || ''; $('#f-phone').value = x.phone || ''; $('#f-addr').value = x.address1 || ''; $('#f-addr2').value = x.address2 || '';
    $('#f-country').value = COUNTRIES.includes(x.country) ? x.country : 'Colombia'; drawProvince(x.province || '');
    $('#f-city').value = x.city || ''; $('#f-zip').value = x.zip || ''; $('#f-email').value = x.email || '';
  };
  function drawProvince(value) {
    const co = $('#f-country').value === 'Colombia';
    $('#f-prov-label').textContent = co ? 'Departamento *' : 'Estado / provincia *';
    $('#prov-wrap').innerHTML = co
      ? `${icon('globe', 20)}<select id="f-prov" required><option value="">Selecciona</option>${CO_DEPARTMENTS.map((d) => `<option ${d === value ? 'selected' : ''}>${d}</option>`).join('')}</select>${icon('chevronDown', 18)}`
      : `${icon('globe', 20)}<input id="f-prov" value="${esc(value)}" placeholder="Estado o provincia" required>`;
  }
  $('#f-country').onchange = () => drawProvince('');
  $('#ship-form').addEventListener('input', (e) => { e.target.closest('.input')?.classList.remove('invalid'); if (!$('.ship-form .invalid')) $('#co-err').innerHTML = ''; });
  $('#ship-form').addEventListener('change', (e) => { e.target.closest('.input')?.classList.remove('invalid'); });
  fill(a);
  $('#use-saved')?.addEventListener('click', () => { fill(saved); toast('Dirección guardada aplicada'); });

  $('#go-shopify').onclick = async () => {
    const btn = $('#go-shopify');
    const address = {
      fullName: $('#f-name').value, phone: $('#f-phone').value, address1: $('#f-addr').value, address2: $('#f-addr2').value,
      country: $('#f-country').value, province: $('#f-prov').value, city: $('#f-city').value, zip: $('#f-zip').value, email: $('#f-email').value,
    };
    const empty = [['f-name', address.fullName], ['f-phone', address.phone], ['f-addr', address.address1], ['f-prov', address.province], ['f-city', address.city], ['f-zip', address.zip]].filter(([, v]) => !String(v).trim());
    $$('.ship-form .input').forEach((i) => i.classList.remove('invalid'));
    if (empty.length) {
      empty.forEach(([id]) => $('#' + id).closest('.input').classList.add('invalid'));
      $('#co-err').innerHTML = `<div class="form-error">Completa los campos marcados para continuar.</div>`;
      $('#' + empty[0][0]).focus();
      return;
    }
    btn.disabled = true;
    try {
      const { url } = await api('POST', '/checkout', { address, save: $('#f-save').checked });
      setCartCount(0);
      redirectToShopify(url, cart.store?.name);
    } catch (e) {
      $('#co-err').innerHTML = `<div class="form-error">${esc(e.message)}</div>`;
      btn.disabled = false;
    }
  };
}
function redirectToShopify(url, storeName) {
  const el = document.createElement('div');
  el.className = 'redirect-screen';
  el.innerHTML = `<div class="glass-card redirect-card">
    ${checkoutSteps(2)}
    <div class="shopify-word">${icon('bag', 40)}<span>Shopify</span></div>
    <div class="ring" aria-hidden="true"></div>
    <h2>Redirigiendo a la tienda…</h2>
    <p>En unos segundos serás dirigido a la plataforma de compra segura de Shopify${storeName ? ` de <b>${esc(storeName)}</b>` : ''}, con tu carrito y tu dirección listos.</p>
    <div class="secure-note">${icon('shield', 30)}<span><b>Conexión segura</b>Allí eliges el método de pago y finalizas tu compra.</span></div>
    <a class="btn btn-primary btn-block" href="${esc(url)}" rel="noopener">Ir ahora ${icon('arrowRight', 18)}</a>
    <a class="back-link" href="#/pedidos">Ver mis pedidos</a>
  </div>`;
  document.body.appendChild(el);
  setTimeout(() => { if (document.body.contains(el)) window.location.href = url; }, 1800);
  window.addEventListener('hashchange', () => el.remove(), { once: true });
}

// ------------------------------------------------------------ MIS PEDIDOS
async function viewOrders(params) {
  const { orders, received } = await api('GET', '/orders');
  let tab = params?.get?.('t') === 'recibidos' ? 'recibidos' : 'compras';
  app.innerHTML = shell(`
    ${storeBar({ storeId: state.lastStore })}
    ${crumbs([['Mis pedidos']])}
    <section class="glass-card section-pad">
      <div class="subhead-row"><h2 class="h2">${icon('receipt', 28)} Pedidos</h2></div>
      <div class="feed-tabs"><button class="chip" data-t="compras">Mis compras (${orders.length})</button><button class="chip" data-t="recibidos">Pedidos de mi tienda (${received.length})</button></div>
      <div id="olist" class="olist"></div>
    </section>`, { left: 'back' });
  bindShell(); bindStoreBar(state.lastStore); refreshCartCount();
  const draw = () => {
    $$('[data-t]').forEach((b) => b.classList.toggle('active', b.dataset.t === tab));
    const list = tab === 'compras' ? orders : received;
    $('#olist').innerHTML = list.length ? list.map((o) => `<article class="order glass-card">
      <div class="o-head"><b>${esc(o.id)}</b><span class="pill">${icon('external', 14)} ${esc(o.status)}</span><small class="muted">${new Date(o.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
      <div class="o-who muted">${tab === 'compras' ? `Tienda: <a href="#/empresa/${o.store.id}">${esc(o.store.name)}</a>` : `Cliente: <a href="#/empresa/${o.buyer.id}">${esc(o.buyer.name)}</a> · ${esc(o.address.city)}, ${esc(o.address.province)}`}</div>
      <div class="o-items">${o.items.map((i) => `<div class="o-it"><div class="co-img">${i.image ? `<img src="${esc(i.image)}" alt="">` : ''}</div><span>${esc(i.name)} × ${i.qty}</span></div>`).join('')}</div>
      <div class="o-foot"><b>${money(o.totals.total, o.totals.currency)}</b>${tab === 'compras' ? `<a class="btn btn-outline btn-xs" href="${esc(o.url)}" target="_blank" rel="noopener">Abrir en Shopify ${icon('external', 14)}</a>` : `<small class="muted">El pago y el estado final se ven en tu panel de Shopify.</small>`}</div>
    </article>`).join('') : `<div class="empty">${icon('receipt', 44)}<p>${tab === 'compras' ? 'Aún no has hecho compras.' : 'Tu tienda aún no ha recibido pedidos.'}</p></div>`;
  };
  $$('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
  draw();
}

// ------------------------------------------------------------ ADMINISTRAR PRODUCTOS
async function viewMyProducts() {
  const [{ products }, { store }] = await Promise.all([api('GET', `/products?company=${state.me.id}`), api('GET', '/me/store')]);
  const full = await Promise.all(products.map((p) => api('GET', '/products/' + p.id).then((r) => r.product)));
  const unlinked = full.filter((p) => !p.shopifyVariantId).length;
  app.innerHTML = shell(`
    <section class="glass-card section-pad">
      <div class="subhead-row"><h2 class="h2">${icon('bag', 28)} Mis productos</h2><a class="btn btn-primary btn-sm" href="#/producto-editar/nuevo">${icon('plus', 18)} Nuevo producto</a></div>
      <div class="shop-status ${store.shopifyDomain && !unlinked ? 'ok' : 'warn'}">
        ${icon(store.shopifyDomain ? 'link' : 'info', 22)}
        <span>${store.shopifyDomain ? `Conectada a <b>${esc(store.shopifyDomain)}</b>.` : 'Tu tienda aún no está conectada a Shopify.'}
        ${unlinked ? ` <b>${unlinked}</b> ${unlinked === 1 ? 'producto no tiene' : 'productos no tienen'} ID de variante de Shopify: no se podrán comprar hasta agregarlo.` : store.shopifyDomain ? ' Todos los productos están listos para comprar.' : ''}</span>
        <a class="btn btn-outline btn-xs" href="#/tienda-ajustes">${store.shopifyDomain ? 'Ajustes' : 'Conectar'}</a>
      </div>
      <div class="mp-list">${full.length ? full.map((p) => `<div class="mp-row glass-card">
        <div class="co-img">${productImg(p)}</div>
        <div class="mp-txt"><b>${esc(p.name)} ${p.featured ? icon('starFill', 16, 'gold') : ''}</b><small class="muted">${esc(p.category)} · ${money(p.price, p.currency)}${p.inStock ? '' : ' · Agotado'}</small></div>
        <span class="pill ${p.shopifyVariantId ? 'ok' : 'warn'}">${p.shopifyVariantId ? `${icon('check', 14)} Shopify` : 'Sin vincular'}</span>
        <a class="icon-btn" href="#/producto-editar/${p.id}" aria-label="Editar">${icon('edit', 20)}</a>
        <a class="icon-btn" href="#/producto/${p.id}" aria-label="Ver">${icon('eye', 20)}</a>
      </div>`).join('') : `<div class="empty">${icon('bag', 44)}<p>Aún no tienes productos.</p></div>`}</div>
    </section>`, { active: 'mi-empresa', left: 'back' });
  bindShell();
}
async function viewProductEdit(id) {
  const isNew = id === 'nuevo';
  const p = isNew ? { name: '', brand: '', model: '', sku: '', category: '', price: '', compareAt: '', stock: '', featured: false, highlights: [], description: '', features: [], specs: [], inBox: [], images: [], shopifyVariantId: '' }
    : (await api('GET', '/products/' + id)).product;
  if (!isNew && p.userId !== state.me.id) { location.hash = '#/producto/' + id; return; }
  const cats = state.me.company.products || [];
  let images = [...(p.images || [])];
  app.innerHTML = shell(`
    <section class="glass-card section-pad">
      <div class="subhead-row"><h2 class="h2">${icon(isNew ? 'plus' : 'edit', 26)} ${isNew ? 'Nuevo producto' : 'Editar producto'}</h2></div>
      ${cats.length ? '' : `<div class="form-error">Primero agrega categorías en <a href="#/editar">Productos o servicios</a> de tu perfil.</div>`}
      <div id="pe-err"></div>
      <form id="pe" class="pe-form" novalidate>
        <div class="field span2"><label>Imágenes (la primera es la principal)</label>
          <div class="pe-images" id="pe-images"></div>
          <input type="file" id="pe-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" multiple hidden></div>
        <div class="field span2"><label for="pe-name">Nombre *</label><div class="input"><input id="pe-name" maxlength="80" value="${esc(p.name)}" placeholder='Ej. Laptop HP 15"'></div></div>
        <div class="field"><label for="pe-brand">Marca</label><div class="input"><input id="pe-brand" maxlength="40" value="${esc(p.brand)}"></div></div>
        <div class="field"><label for="pe-cat">Categoría *</label><div class="input"><select id="pe-cat">${cats.map((c) => `<option ${c === p.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>${icon('chevronDown', 18)}</div></div>
        <div class="field"><label for="pe-model">Modelo</label><div class="input"><input id="pe-model" maxlength="40" value="${esc(p.model)}"></div></div>
        <div class="field"><label for="pe-sku">SKU</label><div class="input"><input id="pe-sku" maxlength="40" value="${esc(p.sku)}"></div></div>
        <div class="field"><label for="pe-price">Precio *</label><div class="input"><input id="pe-price" inputmode="decimal" value="${esc(p.price)}" placeholder="450"></div></div>
        <div class="field"><label for="pe-compare">Precio antes (opcional)</label><div class="input"><input id="pe-compare" inputmode="decimal" value="${esc(p.compareAt || '')}" placeholder="Para mostrar descuento"></div></div>
        <div class="field"><label for="pe-stock">Unidades disponibles</label><div class="input"><input id="pe-stock" inputmode="numeric" value="${p.stock ?? ''}" placeholder="Vacío = sin límite · 0 = agotado"></div></div>
        <label class="check"><input type="checkbox" id="pe-featured" ${p.featured ? 'checked' : ''}> Mostrar en "Productos destacados"</label>
        <div class="field span2 shopify-field"><label for="pe-variant">${icon('link', 18)} ID de variante de Shopify *</label><div class="input"><input id="pe-variant" inputmode="numeric" value="${esc(p.shopifyVariantId || '')}" placeholder="Ej. 44012345678901"></div>
          <small class="muted">Necesario para comprar. En tu panel de Shopify abre el producto, toca la variante y copia el número final de la dirección (…/variants/<b>44012345678901</b>).</small></div>
        <div class="field span2"><label for="pe-hl">Datos cortos para la tarjeta (máx. 2 líneas)</label><div class="input"><textarea id="pe-hl" rows="2" placeholder="Procesador i5&#10;8 GB RAM | 512 GB SSD">${esc(p.highlights.join('\n'))}</textarea></div></div>
        <div class="field span2"><label for="pe-desc">Descripción</label><div class="input"><textarea id="pe-desc" rows="4" maxlength="2000">${esc(p.description)}</textarea></div></div>
        <div class="field"><label for="pe-feat">Características (una por línea)</label><div class="input"><textarea id="pe-feat" rows="5">${esc(p.features.join('\n'))}</textarea></div></div>
        <div class="field"><label for="pe-specs">Especificaciones (una por línea: Nombre: valor)</label><div class="input"><textarea id="pe-specs" rows="5" placeholder="Procesador: Intel Core i5&#10;Memoria RAM: 8 GB">${esc(p.specs.map(([k, v]) => `${k}: ${v}`).join('\n'))}</textarea></div></div>
        <div class="field span2"><label for="pe-box">¿Qué incluye la caja? (una por línea)</label><div class="input"><textarea id="pe-box" rows="3">${esc(p.inBox.join('\n'))}</textarea></div></div>
      </form>
      <div class="form-actions">
        ${isNew ? '' : `<button class="btn btn-danger btn-rect" id="pe-del">${icon('trash', 18)} Eliminar</button>`}
        <a class="btn btn-outline btn-rect" href="#/mis-productos">Cancelar</a>
        <button class="btn btn-primary btn-rect" id="pe-save">${icon('check', 20)} Guardar producto</button>
      </div>
    </section>`, { active: 'mi-empresa', left: 'back' });
  bindShell();
  const drawImages = () => {
    $('#pe-images').innerHTML = images.map((s, i) => `<div class="pe-img glass-card"><img src="${esc(s)}" alt="">
      ${i ? `<button type="button" data-main="${i}" title="Usar como principal">${icon('star', 16)}</button>` : '<span class="main-tag">Principal</span>'}
      <button type="button" data-rm="${i}" title="Quitar">${icon('x', 16)}</button></div>`).join('') +
      (images.length < 8 ? `<button type="button" class="pe-add glass-card" id="pe-add">${icon('upload', 30)}<span>Subir imagen</span><small>JPG, PNG o SVG · 2 MB</small></button>` : '');
    $('#pe-add')?.addEventListener('click', () => $('#pe-file').click());
    $$('[data-rm]').forEach((b) => (b.onclick = () => { images.splice(+b.dataset.rm, 1); drawImages(); }));
    $$('[data-main]').forEach((b) => (b.onclick = () => { const [x] = images.splice(+b.dataset.main, 1); images.unshift(x); drawImages(); }));
  };
  drawImages();
  $('#pe-file').onchange = async (e) => {
    for (const f of [...e.target.files].slice(0, 8 - images.length)) {
      try { images.push(await uploadImage(f)); drawImages(); } catch (err) { toast(err.message); }
    }
    e.target.value = '';
  };
  $('#pe-save').onclick = async () => {
    const v = (x) => $('#' + x).value;
    const body = {
      name: v('pe-name'), brand: v('pe-brand'), category: v('pe-cat'), model: v('pe-model'), sku: v('pe-sku'), price: v('pe-price'), compareAt: v('pe-compare'),
      stock: v('pe-stock'), featured: $('#pe-featured').checked, shopifyVariantId: v('pe-variant'), highlights: v('pe-hl'), description: v('pe-desc'),
      features: v('pe-feat'), specs: v('pe-specs'), inBox: v('pe-box'), images,
    };
    try {
      const { product } = await api(isNew ? 'POST' : 'PUT', isNew ? '/products' : '/products/' + id, body);
      toast('Producto guardado');
      location.hash = '#/producto/' + product.id;
    } catch (e) { $('#pe-err').innerHTML = `<div class="form-error">${esc(e.message)}</div>`; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  $('#pe-del')?.addEventListener('click', () => confirmDialog('¿Eliminar este producto?', 'Se quitará de tu tienda y de los carritos donde esté.', async () => {
    await api('DELETE', '/products/' + id); toast('Producto eliminado'); location.hash = '#/mis-productos';
  }));
}

// ------------------------------------------------------------ AJUSTES DE TIENDA SHOPIFY
async function viewStoreSettings() {
  const { store: s } = await api('GET', '/me/store');
  const { products } = await api('GET', `/products?company=${state.me.id}`);
  app.innerHTML = shell(`
    <section class="glass-card section-pad">
      <div class="subhead-row"><h2 class="h2">${icon('link', 28)} Tienda Shopify</h2></div>
      <p class="muted" style="margin-top:0">Cuando un cliente toca <b>Ir a comprar</b>, ColW lo envía a tu tienda Shopify con el carrito y la dirección de envío ya llenos. Allí paga y Shopify registra el pedido.</p>
      <div id="ss-err"></div>
      <form id="ss" class="pe-form" novalidate>
        <div class="field span2"><label for="ss-domain">Dominio de tu tienda Shopify</label><div class="input">${icon('globe', 20)}<input id="ss-domain" value="${esc(s.shopifyDomain)}" placeholder="mitienda.myshopify.com o mitienda.com" autocapitalize="off" spellcheck="false"></div>
          <small class="muted">Lo ves en Shopify → Configuración → Dominios. Debe ser la tienda donde están creados tus productos.</small></div>
        <div class="field"><label for="ss-cur">Moneda de los precios</label><div class="input"><select id="ss-cur">${Object.keys(CURRENCY_SYMBOL).map((c) => `<option ${c === s.currency ? 'selected' : ''}>${c}</option>`).join('')}</select>${icon('chevronDown', 18)}</div></div>
        <div class="field"><label for="ss-free">Envío gratis desde</label><div class="input"><input id="ss-free" inputmode="decimal" value="${s.freeShippingFrom}"></div><small class="muted">0 = el envío siempre se calcula en Shopify.</small></div>
        <div class="field"><label for="ss-tax">IVA (%)</label><div class="input"><input id="ss-tax" inputmode="decimal" value="${s.taxRate}"></div></div>
        <label class="check"><input type="checkbox" id="ss-taxinc" ${s.taxIncluded ? 'checked' : ''}> Mis precios ya incluyen IVA</label>
        <fieldset class="field span2 radio-cards"><legend>Al tocar "Ir a comprar" abrir en Shopify:</legend>
          <label class="glass-card"><input type="radio" name="mode" value="checkout" ${s.checkoutMode !== 'cart' ? 'checked' : ''}><span><b>El pago directamente</b>Con la dirección de envío ya llena. Recomendado.</span></label>
          <label class="glass-card"><input type="radio" name="mode" value="cart" ${s.checkoutMode === 'cart' ? 'checked' : ''}><span><b>El carrito de Shopify</b>El cliente revisa el carrito y luego toca "Finalizar compra". Shopify puede pedir la dirección otra vez.</span></label>
        </fieldset>
      </form>
      <div class="form-actions"><a class="btn btn-outline btn-rect" href="#/mis-productos">Mis productos</a><button class="btn btn-primary btn-rect" id="ss-save">${icon('check', 20)} Guardar</button></div>
    </section>
    <section class="glass-card section-pad prose">
      <h3 class="h3">${icon('info', 22)} Cómo vincular tus productos</h3>
      <ol class="install-steps">
        <li>En Shopify crea cada producto con el mismo precio que en ColW.</li>
        <li>Abre el producto, toca la variante y copia el número al final de la dirección: <code>…/variants/<b>44012345678901</b></code>.</li>
        <li>En ColW ve a <a href="#/mis-productos">Mis productos</a>, edita el producto y pega ese número en <b>ID de variante de Shopify</b>.</li>
      </ol>
      <p class="muted">${products.length} productos en tu tienda de ColW.</p>
    </section>`, { active: 'ajustes', left: 'back' });
  bindShell();
  $('#ss-save').onclick = async () => {
    try {
      await api('PUT', '/me/store', {
        shopifyDomain: $('#ss-domain').value, currency: $('#ss-cur').value, freeShippingFrom: $('#ss-free').value,
        taxRate: $('#ss-tax').value, taxIncluded: $('#ss-taxinc').checked, checkoutMode: $('input[name=mode]:checked').value,
      });
      await refreshMe();
      toast('Ajustes de la tienda guardados');
      viewStoreSettings();
    } catch (e) { $('#ss-err').innerHTML = `<div class="form-error">${esc(e.message)}</div>`; }
  };
}
