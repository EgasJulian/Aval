/**
 * ColW — backend simulado en el navegador.
 * Reemplaza al servidor Node (server.js + store-api.js) para que la app funcione
 * como sitio estático (GitHub Pages) e instalable en el iPhone. Las rutas, validaciones
 * y datos de ejemplo son los mismos del servidor original; la base de datos se guarda
 * en localStorage de este dispositivo.
 * Archivo generado a partir del backend original: edita con cuidado.
 */
(function () {
  'use strict';
  const DB_KEY = 'colw_db';
  const SEED_VERSION = 2; // al cambiar los datos de ejemplo, súbelo para recargarlos en los dispositivos

  // ---------------------------------------------------------------- utilidades
  const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
  const uid = () => hex(8);
  const now = () => new Date().toISOString();
  // Hash simple (prototipo local, no es seguridad real: los datos viven solo en este dispositivo).
  function digest(s) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let r = 0; r < 64; r++) {
      for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    }
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }
  function hashPassword(password, salt = hex(16)) { return { salt, hash: digest(salt + ':' + password) }; }
  function checkPassword(password, salt, hash) { return digest(salt + ':' + password) === hash; }
function normLogin(v) {
  v = String(v || '').trim().toLowerCase();
  if (v.includes('@')) return v;
  return v.replace(/[^\d+]/g, '');
}
function handleOf(name) {
  return String(name || 'empresa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'empresa';
}

const findUser = (id) => db.users.find((u) => u.id === id);

function publicUser(u, viewerId) {
  if (!u) return null;
  const followers = db.users.filter((x) => x.following.includes(u.id)).length;
  return {
    id: u.id,
    handle: u.handle,
    kind: u.kind || 'empresa',
    company: u.company,
    stats: {
      posts: db.posts.filter((p) => p.userId === u.id).length,
      followers,
      following: u.following.length,
    },
    isFollowing: viewerId ? !!findUser(viewerId)?.following.includes(u.id) : false,
    isMe: viewerId === u.id,
  };
}
function miniUser(u) {
  if (!u) return { id: null, name: 'Usuario eliminado', handle: '', logo: null };
  return { id: u.id, name: u.company.name, handle: u.handle, logo: u.company.logo, sector: u.company.sector, location: u.company.location, verified: !!u.company.verified, kind: u.kind || 'empresa' };
}
function publicPost(p, viewerId) {
  const author = miniUser(findUser(p.userId));
  author.isFollowing = viewerId ? !!findUser(viewerId)?.following.includes(p.userId) : false;
  return {
    id: p.id,
    author,
    title: p.title,
    text: p.text,
    tags: p.tags,
    image: p.image,
    theme: p.theme,
    createdAt: p.createdAt,
    likes: p.likes.length,
    liked: viewerId ? p.likes.includes(viewerId) : false,
    shares: p.shares || 0,
    comments: p.comments.map((c) => ({ ...c, author: miniUser(findUser(c.userId)) })),
  };
}
function notify(userId, fromId, type, text, extra = {}) {
  if (userId === fromId) return;
  db.notifications.push({ id: uid(), userId, fromId, type, text, read: false, createdAt: now(), ...extra });
}

  // ---------------------------------------------------------------- base de datos (localStorage)
  const seed = (function () { const module = { exports: {} };
// Datos de ejemplo que se cargan la primera vez que se ejecuta ColW.
// Para reiniciar la base de datos borra la carpeta /data y vuelve a ejecutar.
module.exports = function seed({ hashPassword, uid }) {
  const ago = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  const users = [];
  const mk = (login, password, handle, company, kind = 'empresa') => {
    const { salt, hash } = hashPassword(password);
    const u = { id: uid(), login, salt, hash, handle, kind, following: [], createdAt: ago(24 * 30), company: {
      name: '', sigla: '', nit: '', foundedAt: '', businessType: 'S.A.S.', country: 'Colombia', logo: null, slogan: '',
      location: '', sector: 'Otro', years: 0, employees: 0, clients: 0, products: [], phone: '', email: '', verified: true, ...company } };
    users.push(u);
    return u;
  };

  const codesah = mk('3176811433', 'codesah123', 'codesah', {
    name: 'CODESAH', sigla: 'CODESAH', nit: '901359546', foundedAt: '2018-03-15', logo: 'img/codesah.svg',
    slogan: 'Innovación que impulsa un futuro sostenible', location: 'Cali, Valle del Cauca', sector: 'Tecnología',
    years: 8, employees: 25, clients: 25, phone: '+57 317 681 1433', email: 'gerenciacodesah@gmail.com',
    products: ['Equipos de cómputo', 'Dispositivos móviles', 'Cámaras de seguridad', 'Redes y conectividad', 'Audio y accesorios', 'Impresión y escaneo', 'Servicios tecnológicos', 'Consultoría empresarial', 'Desarrollo de software', 'Soporte técnico'],
  });
  const andes = mk('andestech@colw.co', 'colw123', 'andestech', { name: 'AndesTech', sigla: 'AT', nit: '900123456', location: 'Bogotá, Colombia', sector: 'Tecnología', years: 6, employees: 60, clients: 120, slogan: 'Tecnología que transforma', products: ['Inteligencia artificial', 'Desarrollo de software', 'Soluciones en la nube'], email: 'hola@andestech.co' });
  const agro = mk('agrosostenible@colw.co', 'colw123', 'agrosostenible', { name: 'AgroSostenible', nit: '900222333', location: 'Popayán, Cauca', sector: 'Agroindustria', years: 10, employees: 40, clients: 80, slogan: 'El campo también innova', products: ['Café especial', 'Asesoría agrícola', 'Abonos orgánicos'] });
  const maria = mk('3001234567', 'colw123', 'mariafer_ruiz', { name: 'María Fernanda Ruiz', businessType: 'Persona natural', location: 'Cali, Valle', sector: 'Consultoría', years: 12, clients: 45, slogan: 'Sin fronteras para tus ideas', products: ['Internacionalización', 'Consultoría empresarial', 'Comercio exterior'] }, 'persona');
  const constru = mk('construandes@colw.co', 'colw123', 'construandes', { name: 'ConstruAndes', nit: '900444555', location: 'Medellín, Antioquia', sector: 'Construcción', years: 15, employees: 200, clients: 60, slogan: 'Espacios que conectan personas', products: ['Vivienda', 'Obras civiles', 'Interventoría'] });
  const eco = mk('ecosolar@colw.co', 'colw123', 'ecosolar', { name: 'EcoSolar', nit: '900666777', location: 'Barranquilla, Atlántico', sector: 'Energía', years: 5, employees: 30, clients: 150, slogan: 'Energía limpia para todos', products: ['Paneles solares', 'Instalación', 'Mantenimiento'] });
  const logi = mk('logitrans@colw.co', 'colw123', 'logitrans', { name: 'LogiTrans', nit: '900888999', location: 'Buenaventura, Valle', sector: 'Transporte', years: 20, employees: 150, clients: 300, slogan: 'Llevamos tu negocio más lejos', products: ['Carga nacional', 'Logística portuaria', 'Última milla'] });
  const agrof = mk('agrofuturo@colw.co', 'colw123', 'agrofuturo', { name: 'AgroFuturo', nit: '901000111', location: 'Pereira, Risaralda', sector: 'Agroindustria', years: 4, employees: 18, clients: 35, products: ['Invernaderos', 'Riego tecnificado'] });
  const laura = mk('3109876543', 'colw123', 'lauragomez', { name: 'Laura Gómez', businessType: 'Persona natural', location: 'Bogotá, Colombia', sector: 'Comercio y servicios', years: 7, slogan: 'Marketing con propósito', products: ['Marketing digital', 'Branding'] }, 'persona');
  const indus = mk('induspacifico@colw.co', 'colw123', 'induspacifico', { name: 'Industrias del Pacífico', nit: '900333444', location: 'Yumbo, Valle', sector: 'Industria', years: 25, employees: 320, clients: 90, products: ['Metalmecánica', 'Automatización'] });

  codesah.following = [andes.id, maria.id, eco.id];
  [andes, agro, maria, constru, eco, logi, laura].forEach((u) => u.following.push(codesah.id));
  andes.following.push(eco.id, maria.id);
  maria.following.push(andes.id, agro.id);

  const likers = (n) => users.slice(0, n).map((u) => u.id);
  // Publicaciones de ejemplo con fotos reales (CC0, StockSnap) en img/feed/
  const P = (author, h, likes, title, text, image, comments = []) => ({ author, h, likes, title, text, image, comments });
  const C = (author, h, text) => ({ author, h, text });
  const seedPosts = [
    P(andes, 2, 9, 'Laboratorio de IA para pymes', 'Abrimos nuestro laboratorio de IA aplicada para pymes colombianas 🚀 Durante octubre hacemos un diagnóstico gratuito: te mostramos qué procesos de tu empresa se pueden automatizar. Cupos limitados, escríbenos por mensaje. #InteligenciaArtificial #Pymes #Innovación', 'andes-ia',
      [C(codesah, 1, '¡Excelente iniciativa! Nos encantaría colaborar.'), C(maria, 1.5, 'Me interesa para mis clientes de comercio exterior 🙌')]),
    P(agro, 4, 8, 'Floración en el Cauca', 'Así se ven nuestros cafetales en plena floración 🌸☕ En unos ocho meses esta flor será la cosecha del próximo año. Seguimos midiendo la humedad con sensores para tener trazabilidad de cada lote. ¿Tienes tecnología para el campo? Hablemos. #CaféEspecial #Cauca #AgroTech', 'agro-cafe'),
    P(codesah, 6, 8, 'Seguridad para tu negocio', 'Este mes instalamos cámaras de seguridad y redes para 5 nuevos clientes en Cali 📹 Monitoreo desde el celular, grabación en la nube y soporte técnico incluido. ¡Gracias por confiar en nosotros! #Seguridad #Tecnología #Cali', 'codesah-camaras',
      [C(maria, 5, 'Muy buen servicio, los recomiendo 👏')]),
    P(laura, 9, 10, '5 claves para vender en redes', '5 claves para que tu pyme venda en redes sociales 📱 1) Define a quién le hablas. 2) Publica con constancia, no con prisa. 3) Muestra tu equipo y tu proceso. 4) Responde rápido los mensajes. 5) Mide y ajusta cada mes. ¿Cuál te cuesta más? #MarketingDigital #Emprendimiento', 'laura-tips',
      [C(andes, 8, 'La 4 es clave: responder rápido vende 💯')]),
    P(constru, 20, 6, 'Inicio de obra', 'Arrancamos la obra de 240 apartamentos de vivienda VIS en el Valle de Aburrá 🏗️ Generaremos más de 300 empleos directos en la región. Buscamos proveedores de acero, concreto y acabados. #Construcción #Vivienda #Antioquia', 'constru-vivienda'),
    P(maria, 26, 10, 'Taller: exporta tus servicios', 'Taller gratuito este jueves: cómo exportar tus servicios a Latinoamérica en 90 días 🌎 Veremos precios internacionales, contratos y cómo cobrar desde el exterior. Cupos limitados, inscríbete por mensaje. #Internacionalización #Negocios', 'maria-taller'),
    P(eco, 30, 7, '150 techos solares', 'Llegamos a 150 techos solares instalados en la Costa Caribe ☀️ Nuestros clientes ahorran en promedio un 60 % en su factura de energía. ¿Quieres saber cuánto ahorrarías? Te hacemos el estudio sin costo. #EnergíaSolar #Sostenibilidad', 'eco-techos',
      [C(constru, 28, '¿Trabajan también con proyectos de vivienda? Nos interesa para la nueva obra.')]),
    P(indus, 36, 5, 'Nueva línea de producción', 'Pusimos en marcha una nueva línea de producción en nuestra planta de Yumbo ⚙️ Más capacidad para piezas metalmecánicas a la medida y entregas más rápidas para nuestros clientes. #Industria #Metalmecánica #Valle', 'indus-planta'),
    P(logi, 44, 4, 'Nueva ruta diaria', 'Nueva ruta diaria Buenaventura – Bogotá 🚛 Salida todas las noches y entrega en 24 horas, con rastreo en tiempo real. Ideal para la carga de importación que llega al puerto. #Logística #Transporte', 'logi-ruta'),
    P(agrof, 52, 6, 'Invernaderos que producen más', 'Nuevas plántulas en nuestro invernadero de Pereira 🌱 Con riego tecnificado usamos 40 % menos agua y la germinación es más pareja. Visitas guiadas para productores los sábados. #Agricultura #RiegoTecnificado #Risaralda', 'agrofuturo-invernadero'),
    P(andes, 60, 9, '¡Estamos contratando!', '¡Estamos contratando! 👩‍💻 Buscamos 3 desarrolladores backend y 1 diseñador UX para nuestro equipo en Bogotá. Trabajo híbrido y proyectos de IA reales. Envía tu hoja de vida por mensaje. #Empleo #Tecnología #Bogotá', 'andes-equipo'),
    P(codesah, 72, 5, 'Redes que no fallan', 'Cableado estructurado categoría 6 para oficinas 🔌 Terminamos la red de una empresa con 40 puestos de trabajo en solo 3 días, sin detener su operación. #Redes #Conectividad', 'codesah-redes'),
    P(agro, 80, 10, 'Primer contenedor a Corea', '¡Lo logramos! Despachamos nuestro primer contenedor de café especial caucano a Corea del Sur ☕ Gracias a nuestros caficultores aliados por la calidad de cada grano. #Exportación #CaféEspecial', 'agro-export',
      [C(maria, 78, '¡Felicitaciones! Un gran ejemplo de internacionalización 👏'), C(logi, 77, '¡Orgullosos de haber movido esa carga hasta el puerto!')]),
    P(logi, 96, 5, 'Logística portuaria', 'Más de 1.200 contenedores movidos este trimestre en el puerto de Buenaventura 📦 Nos encargamos de trámites, almacenamiento y transporte hasta tu bodega. #ComercioExterior #Logística', 'logi-contenedores'),
    P(indus, 110, 7, 'Becas para soldadores', 'Abrimos 10 becas para formar soldadores certificados en Yumbo 🔥 Al terminar, los mejores se vinculan a nuestra planta. Inscripciones abiertas hasta el 30 de octubre. #Empleo #Formación #Industria', 'indus-soldadura'),
  ];
  const posts = seedPosts.map((p) => ({ id: uid(), userId: p.author.id, title: p.title, text: p.text, tags: (p.text.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1)),
    image: `img/feed/${p.image}.jpg`, theme: 'tech', createdAt: ago(p.h), likes: likers(p.likes).filter((id) => id !== p.author.id),
    comments: p.comments.map((c) => ({ id: uid(), userId: c.author.id, text: c.text, createdAt: ago(c.h) })), shares: Math.floor(p.likes * 1.5) }));

  const messages = [
    { id: uid(), from: andes.id, to: codesah.id, text: 'Hola CODESAH, ¿manejan suministro de equipos de cómputo por volumen?', read: false, createdAt: ago(3) },
    { id: uid(), from: maria.id, to: codesah.id, text: 'Buen día, quisiera una cotización de soporte técnico mensual.', read: true, createdAt: ago(28) },
    { id: uid(), from: codesah.id, to: maria.id, text: '¡Claro María! Te enviamos la propuesta hoy mismo.', read: true, createdAt: ago(27) },
  ];
  const notifications = [
    { id: uid(), userId: codesah.id, fromId: andes.id, type: 'follow', text: 'AndesTech comenzó a seguirte.', read: false, createdAt: ago(4) },
    { id: uid(), userId: codesah.id, fromId: maria.id, type: 'comment', text: 'María Fernanda Ruiz comentó: "Muy buen servicio, los recomiendo 👏"', read: false, createdAt: ago(5), postId: posts[2].id },
  ];

  return { users, posts, messages, notifications, sessions: {}, resets: {} };
};

return module.exports; })();
  const seedStore = (function () { const module = { exports: {} };
// Catálogo de ejemplo de la tienda CODESAH (se carga una sola vez).
// Los productos empiezan SIN "ID de variante de Shopify": se agrega en Mis productos
// con los IDs reales de tu tienda Shopify para poder comprar.
module.exports = function seedStore({ uid, codesahId }) {
  const ago = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  let n = 0;
  const P = (o) => ({
    id: uid(), userId: codesahId, createdAt: ago(n++), stock: 10, featured: false, compareAt: null, shopifyVariantId: '',
    highlights: [], features: [], specs: [], inBox: [], description: '', ...o,
  });
  const laptopSpecs = (cpu, ram, ssd, screen, extra = []) => [
    ['Procesador', cpu], ['Memoria RAM', ram], ['Almacenamiento', ssd], ['Pantalla', screen], ...extra,
  ];
  return [
    P({
      name: 'Laptop HP 15"', brand: 'HP', model: '15-fd0003la', sku: 'HP15-001', category: 'Equipos de cómputo', price: 450, featured: true,
      images: ['img/products/laptop-blue.svg', 'img/products/laptop-blue-side.svg', 'img/products/laptop-closed.svg', 'img/products/laptop-blue-angle.svg'],
      highlights: ['Procesador i5', '8 GB RAM | 512 GB SSD'],
      description: 'La Laptop HP 15" combina rendimiento, portabilidad y diseño moderno para acompañarte en tus actividades diarias. Equipada con procesador Intel Core i5, 8 GB de RAM y almacenamiento SSD, ofrece una experiencia rápida y fiable, ideal para el trabajo, la educación y el entretenimiento.',
      features: ['Rendimiento confiable para múltiples tareas', 'Pantalla de 15.6" Full HD con gran calidad de imagen', 'Diseño delgado y ligero', 'Ideal para estudio, trabajo y uso personal', 'Sistema operativo Windows 11 Home', 'Batería de larga duración'],
      specs: [['Marca', 'HP'], ['Modelo', '15-fd0003la'], ['Procesador', 'Intel Core i5-1235U (10 núcleos, hasta 4.4 GHz)'], ['Memoria RAM', '8 GB DDR4'], ['Almacenamiento', '512 GB SSD'], ['Pantalla', '15.6" Full HD (1920 x 1080)'], ['Tarjeta gráfica', 'Intel Iris Xe Graphics'], ['Sistema operativo', 'Windows 11 Home'], ['Conectividad', 'Wi-Fi 6, Bluetooth 5.2'], ['Puertos', '2 x USB-A, 1 x USB-C, 1 x HDMI, 1 x Audio 3.5 mm'], ['Batería', 'Hasta 8 horas de autonomía'], ['Peso', '1.69 kg'], ['Dimensiones', '35.8 x 24.2 x 1.8 cm'], ['Color', 'Plata natural']],
      inBox: ['Laptop HP 15"', 'Cargador original', 'Manual de usuario', 'Garantía oficial HP'],
    }),
    P({ name: 'Laptop Lenovo IdeaPad 3', brand: 'Lenovo', model: '15IAU7', sku: 'LEN-IP3-15', category: 'Equipos de cómputo', price: 430, images: ['img/products/laptop-mountain.svg', 'img/products/laptop-closed.svg'], highlights: ['Procesador i5', '8 GB RAM | 512 GB SSD'], specs: laptopSpecs('Intel Core i5-1235U', '8 GB DDR4', '512 GB SSD', '15.6" Full HD'), inBox: ['Laptop', 'Cargador', 'Manual de usuario'], description: 'Portátil versátil para trabajo y estudio, con buen rendimiento y pantalla Full HD.' }),
    P({ name: 'Laptop Dell Inspiron 15"', brand: 'Dell', model: 'Inspiron 3520', sku: 'DELL-INS-15', category: 'Equipos de cómputo', price: 650, images: ['img/products/laptop-wave.svg', 'img/products/laptop-closed.svg'], highlights: ['Procesador i7', '16 GB RAM | 1 TB SSD'], specs: laptopSpecs('Intel Core i7-1255U', '16 GB DDR4', '1 TB SSD', '15.6" Full HD 120 Hz'), inBox: ['Laptop', 'Cargador', 'Manual de usuario'], description: 'Más potencia para multitarea, hojas de cálculo grandes y edición ligera.' }),
    P({ name: 'MacBook Air M2', brand: 'Apple', model: 'MLY33', sku: 'APL-MBA-M2', category: 'Equipos de cómputo', price: 1050, images: ['img/products/laptop-sunset.svg', 'img/products/laptop-closed-dark.svg'], highlights: ['Procesador Apple M2', '8 GB RAM | 256 GB SSD'], specs: laptopSpecs('Apple M2 (8 núcleos)', '8 GB unificada', '256 GB SSD', '13.6" Liquid Retina'), inBox: ['MacBook Air', 'Cargador USB-C 30 W', 'Cable USB-C a MagSafe 3'], description: 'Ultradelgada y silenciosa, con batería para todo el día.' }),
    P({ name: 'Computador de escritorio', brand: 'CODESAH', model: 'Office Pro i5', sku: 'CDS-PC-I5', category: 'Equipos de cómputo', price: 580, images: ['img/products/desktop.svg'], highlights: ['Procesador i5', '16 GB RAM | 1 TB SSD'], specs: [['Procesador', 'Intel Core i5-12400'], ['Memoria RAM', '16 GB DDR4'], ['Almacenamiento', '1 TB SSD NVMe'], ['Incluye', 'Monitor 21.5", teclado y mouse']], inBox: ['Torre', 'Monitor 21.5"', 'Teclado y mouse', 'Cables'], description: 'Equipo completo para oficina, armado y probado por CODESAH.' }),
    P({ name: 'Computador Todo en Uno', brand: 'HP', model: 'AIO 24-cr0', sku: 'HP-AIO-24', category: 'Equipos de cómputo', price: 690, images: ['img/products/aio.svg'], highlights: ['Pantalla 24" Full HD', 'Procesador i5 | 16 GB RAM'], specs: [['Pantalla', '23.8" Full HD'], ['Procesador', 'Intel Core i5-1335U'], ['Memoria RAM', '16 GB'], ['Almacenamiento', '512 GB SSD']], inBox: ['Equipo todo en uno', 'Teclado y mouse', 'Cargador'], description: 'Todo en una sola pieza: ahorra espacio en tu escritorio.' }),
    P({ name: 'Laptop Gamer ASUS TUF', brand: 'ASUS', model: 'TUF F15', sku: 'ASUS-TUF-15', category: 'Equipos de cómputo', price: 1200, images: ['img/products/laptop-gamer.svg'], highlights: ['Procesador i7', '16 GB RAM | 1 TB SSD'], specs: laptopSpecs('Intel Core i7-12700H', '16 GB DDR5', '1 TB SSD', '15.6" 144 Hz', [['Gráfica', 'NVIDIA RTX 4050 6 GB']]), inBox: ['Laptop', 'Cargador', 'Manual de usuario'], description: 'Rendimiento para juegos, diseño 3D y edición de video.' }),
    P({ name: 'Monitor LG 24" Full HD', brand: 'LG', model: '24MP400', sku: 'LG-24-FHD', category: 'Equipos de cómputo', price: 160, images: ['img/products/monitor.svg'], highlights: ['IPS | 75 Hz', 'HDMI | VGA'], specs: [['Tamaño', '23.8"'], ['Panel', 'IPS'], ['Resolución', '1920 x 1080'], ['Frecuencia', '75 Hz'], ['Entradas', 'HDMI, VGA']], inBox: ['Monitor', 'Base', 'Cable HDMI', 'Adaptador de corriente'] }),
    P({ name: 'Smartphone Samsung Galaxy A55', brand: 'Samsung', model: 'SM-A556', sku: 'SAM-A55-128', category: 'Dispositivos móviles', price: 320, featured: true, images: ['img/products/phone.svg'], highlights: ['5G | 8 GB RAM', '128 GB | Cámara 50 MP'], specs: [['Pantalla', '6.6" Super AMOLED 120 Hz'], ['Memoria', '8 GB RAM / 128 GB'], ['Cámara', '50 MP + 12 MP + 5 MP'], ['Batería', '5000 mAh'], ['Red', '5G']], inBox: ['Teléfono', 'Cable USB-C', 'Herramienta para SIM'], description: 'Pantalla fluida, gran batería y cámara de 50 MP con estabilización.' }),
    P({ name: 'Cámara de seguridad Domo 4MP', brand: 'Hikvision', model: 'DS-2CD1143G2', sku: 'HIK-DOMO-4MP', category: 'Cámaras de seguridad', price: 85, featured: true, images: ['img/products/camera-dome.svg'], highlights: ['Visión nocturna', 'Detección de movimiento'], specs: [['Resolución', '4 MP'], ['Visión nocturna', 'Hasta 30 m'], ['Protección', 'IP67'], ['Alimentación', 'PoE / 12 V']], inBox: ['Cámara', 'Kit de montaje', 'Manual'], description: 'Cámara domo para interiores y exteriores, con imagen nítida de día y de noche.' }),
    P({ name: 'Router Wi-Fi 6 doble banda', brand: 'TP-Link', model: 'Archer AX23', sku: 'TPL-AX23', category: 'Redes y conectividad', price: 90, images: ['img/products/router.svg'], highlights: ['Wi-Fi 6 AX1800', '4 antenas'], specs: [['Estándar', 'Wi-Fi 6 (802.11ax)'], ['Velocidad', 'Hasta 1.8 Gbps'], ['Puertos', '4 x Gigabit LAN, 1 x WAN']], inBox: ['Router', 'Adaptador de corriente', 'Cable Ethernet'] }),
    P({ name: 'Audífonos Bluetooth Sony WH-CH520', brand: 'Sony', model: 'WH-CH520', sku: 'SONY-CH520', category: 'Audio y accesorios', price: 65, featured: true, images: ['img/products/headphones.svg'], highlights: ['Hasta 50 horas', 'Conexión multipunto'], specs: [['Batería', 'Hasta 50 horas'], ['Conexión', 'Bluetooth 5.2'], ['Carga rápida', '3 min = 1.5 horas'], ['Peso', '147 g']], inBox: ['Audífonos', 'Cable USB-C'], description: 'Livianos y cómodos, con batería que dura toda la semana.' }),
    P({ name: 'Mouse inalámbrico HP', brand: 'HP', model: 'X200', sku: 'HP-X200', category: 'Audio y accesorios', price: 25, images: ['img/products/mouse.svg'], highlights: ['Inalámbrico 2.4 GHz', 'Hasta 18 meses de pila'] }),
    P({ name: 'Morral para laptop', brand: 'CODESAH', model: 'Urban 15.6', sku: 'CDS-MOR-15', category: 'Audio y accesorios', price: 35, images: ['img/products/backpack.svg'], highlights: ['Para laptops de hasta 15.6"', 'Resistente al agua'] }),
    P({ name: 'Adaptador USB-C multipuerto', brand: 'UGREEN', model: '5 en 1', sku: 'UGR-HUB-5', category: 'Audio y accesorios', price: 28, images: ['img/products/usb-hub.svg'], highlights: ['HDMI 4K | 3 x USB 3.0', 'Carga PD 100 W'] }),
    P({ name: 'Disco duro externo 1TB', brand: 'Seagate', model: 'Expansion', sku: 'SEA-EXP-1TB', category: 'Audio y accesorios', price: 75, images: ['img/products/hdd.svg'], highlights: ['USB 3.0', 'Compatible con Windows y Mac'] }),
    P({ name: 'Impresora Multifuncional Epson L3250', brand: 'Epson', model: 'L3250', sku: 'EPS-L3250', category: 'Impresión y escaneo', price: 180, featured: true, images: ['img/products/printer.svg'], highlights: ['Impresión, copia y escaneo', 'Wi-Fi | Tinta continua'], specs: [['Funciones', 'Imprime, copia y escanea'], ['Conectividad', 'Wi-Fi, Wi-Fi Direct, USB'], ['Sistema', 'Tanque de tinta EcoTank'], ['Rendimiento', 'Hasta 4.500 páginas en negro']], inBox: ['Impresora', '4 botellas de tinta', 'Cable de alimentación', 'Manual'], description: 'Imprime mucho a bajo costo con su sistema de tanques recargables.' }),
    P({ name: 'Mantenimiento preventivo de equipo', brand: 'CODESAH', model: 'Servicio', sku: 'CDS-SRV-MANT', category: 'Servicios tecnológicos', price: 40, stock: null, images: ['img/products/service.svg'], highlights: ['Limpieza interna y externa', 'Revisión de software'], description: 'Limpieza, cambio de pasta térmica, revisión de discos y optimización del sistema.' }),
  ];
};

return module.exports; })();
  const storeApi = (function () { const module = { exports: {} };
/**
 * ColW — API de la tienda: productos, favoritos, valoraciones, carrito,
 * dirección de envío, pedidos y enlace de compra en Shopify.
 *
 * El pago NO ocurre en ColW: al confirmar los datos de envío se genera un
 * "enlace de carrito" de Shopify (cart permalink) con los productos, las
 * cantidades y la dirección, y el comprador termina la compra en Shopify.
 * Documentación: https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks
 */

const COUNTRY_CODES = {
  Colombia: 'CO', Argentina: 'AR', Chile: 'CL', Ecuador: 'EC', 'España': 'ES', 'Estados Unidos': 'US',
  'México': 'MX', 'Panamá': 'PA', 'Perú': 'PE', Venezuela: 'VE',
};
const CURRENCIES = ['EUR', 'COP', 'USD', 'MXN', 'PEN', 'CLP'];
const DEFAULT_STORE = {
  shopifyDomain: '',          // ej: colwstore.myshopify.com o colwstore.com
  currency: 'EUR',
  freeShippingFrom: 100,      // envío gratis desde este valor (0 = siempre se calcula en Shopify)
  taxRate: 19,                // IVA en %
  taxIncluded: true,          // los precios ya incluyen IVA
  checkoutMode: 'checkout',   // 'checkout' = pago directo con la dirección llena · 'cart' = abrir el carrito de Shopify
};

module.exports = function storeApi(ctx) {
  const { getDb, saveDB, uid, now, findUser, miniUser, notify } = ctx;

  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const num = (v, min = 0, max = 1e9) => Math.min(max, Math.max(min, Number(String(v ?? '').replace(',', '.')) || 0));
  const storeOf = (u) => ({ ...DEFAULT_STORE, ...(u?.company?.store || {}) });
  const round2 = (n) => Math.round(n * 100) / 100;

  function cleanDomain(d) {
    d = str(d, 120).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : '';
  }
  function reviewsOf(productId) { return getDb().reviews.filter((r) => r.productId === productId); }
  function ratingOf(productId) {
    const rs = reviewsOf(productId);
    return { rating: rs.length ? round2(rs.reduce((s, r) => s + r.rating, 0) / rs.length) : 0, reviews: rs.length };
  }
  function publicProduct(p, viewer, { full = false } = {}) {
    const owner = findUser(p.userId);
    const out = {
      id: p.id, userId: p.userId, name: p.name, brand: p.brand, model: p.model, sku: p.sku, category: p.category,
      price: p.price, compareAt: p.compareAt || null, currency: storeOf(owner).currency,
      highlights: p.highlights || [], images: p.images || [], inStock: p.stock !== 0, stock: p.stock ?? null,
      featured: !!p.featured, ...ratingOf(p.id),
      isFavorite: !!viewer?.favorites?.includes(p.id),
      canBuy: !!(storeOf(owner).shopifyDomain && p.shopifyVariantId),
      store: { id: owner?.id, name: owner?.company.name, logo: owner?.company.logo },
    };
    if (full) {
      Object.assign(out, {
        description: p.description || '', features: p.features || [], specs: p.specs || [], inBox: p.inBox || [],
        shipping: storeOf(owner),
      });
      if (viewer && viewer.id === p.userId) out.shopifyVariantId = p.shopifyVariantId || '';
    }
    delete out.shipping?.shopifyDomain;
    return out;
  }
  function cleanProduct(input, current, owner) {
    const p = { ...current };
    const cats = owner.company.products || [];
    if ('name' in input) { const n = str(input.name, 80); if (n) p.name = n; }
    if ('brand' in input) p.brand = str(input.brand, 40);
    if ('model' in input) p.model = str(input.model, 40);
    if ('sku' in input) p.sku = str(input.sku, 40);
    if ('category' in input) p.category = cats.includes(input.category) ? input.category : (cats[0] || 'General');
    if ('price' in input) p.price = round2(num(input.price, 0, 1e9));
    if ('compareAt' in input) p.compareAt = input.compareAt ? round2(num(input.compareAt)) : null;
    if ('stock' in input) p.stock = input.stock === '' || input.stock == null ? null : Math.round(num(input.stock, 0, 1e7));
    if ('featured' in input) p.featured = !!input.featured;
    if ('description' in input) p.description = str(input.description, 2000);
    if ('shopifyVariantId' in input) p.shopifyVariantId = String(input.shopifyVariantId || '').replace(/\D/g, '').slice(0, 20);
    const list = (v, n, max) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((x) => str(x, max)).filter(Boolean).slice(0, n);
    if ('highlights' in input) p.highlights = list(input.highlights, 3, 60);
    if ('features' in input) p.features = list(input.features, 12, 120);
    if ('inBox' in input) p.inBox = list(input.inBox, 8, 60);
    if ('specs' in input) {
      const rows = Array.isArray(input.specs) ? input.specs : String(input.specs || '').split('\n').map((l) => l.split(/:(.+)/));
      p.specs = rows.map(([k, v]) => [str(k, 40), str(v, 120)]).filter(([k, v]) => k && v).slice(0, 30);
    }
    if ('images' in input && Array.isArray(input.images)) {
      p.images = input.images.filter((u) => typeof u === 'string' && (u.startsWith('data:image/') || u.startsWith('img/products/'))).slice(0, 8);
    }
    return p;
  }

  // ------------------------------------------------ carrito
  function cartOf(me) {
    const db = getDb();
    me.cart = (me.cart || []).filter((i) => db.products.some((p) => p.id === i.productId));
    const items = me.cart.map((i) => ({ qty: i.qty, product: publicProduct(db.products.find((p) => p.id === i.productId), me) }));
    const owner = items.length ? findUser(items[0].product.userId) : null;
    const st = storeOf(owner);
    const subtotal = round2(items.reduce((s, i) => s + i.product.price * i.qty, 0));
    const freeShipping = st.freeShippingFrom > 0 && subtotal >= st.freeShippingFrom;
    const tax = st.taxIncluded ? round2(subtotal - subtotal / (1 + st.taxRate / 100)) : round2(subtotal * st.taxRate / 100);
    const total = st.taxIncluded ? subtotal : round2(subtotal + tax);
    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      store: owner ? { id: owner.id, name: owner.company.name, logo: owner.company.logo, connected: !!st.shopifyDomain } : null,
      totals: { currency: st.currency, subtotal, discount: 0, freeShipping, freeShippingFrom: st.freeShippingFrom, taxRate: st.taxRate, taxIncluded: st.taxIncluded, tax, total },
      missingVariants: items.filter((i) => !db.products.find((p) => p.id === i.product.id)?.shopifyVariantId).map((i) => i.product.name),
    };
  }

  // ------------------------------------------------ enlace de Shopify
  function shopifyUrl(owner, me, address, orderId) {
    const db = getDb();
    const st = storeOf(owner);
    const lines = me.cart.map((i) => `${db.products.find((p) => p.id === i.productId).shopifyVariantId}:${i.qty}`).join(',');
    const q = new URLSearchParams();
    if (st.checkoutMode === 'cart') q.set('storefront', 'true');
    const [first, ...rest] = address.fullName.split(/\s+/);
    q.set('checkout[shipping_address][first_name]', first || '');
    q.set('checkout[shipping_address][last_name]', rest.join(' '));
    q.set('checkout[shipping_address][address1]', address.address1);
    if (address.address2) q.set('checkout[shipping_address][address2]', address.address2);
    q.set('checkout[shipping_address][city]', address.city);
    q.set('checkout[shipping_address][province]', address.province);
    q.set('checkout[shipping_address][zip]', address.zip);
    q.set('checkout[shipping_address][country]', COUNTRY_CODES[address.country] || address.country);
    if (address.email) q.set('checkout[email]', address.email);
    q.set('attributes[pedido_colw]', orderId);
    q.set('attributes[telefono]', address.phone);
    q.set('ref', 'colw');
    return `https://${st.shopifyDomain}/cart/${lines}?${q.toString()}`;
  }
  function cleanAddress(a) {
    a = a || {};
    const out = {
      fullName: str(a.fullName, 80), phone: str(a.phone, 25), email: str(a.email, 80),
      address1: str(a.address1, 120), address2: str(a.address2, 120), city: str(a.city, 60),
      province: str(a.province, 60), zip: str(a.zip, 12), country: str(a.country || 'Colombia', 40),
    };
    const missing = [];
    if (out.fullName.split(/\s+/).length < 2) missing.push('nombre y apellido');
    if (out.phone.replace(/\D/g, '').length < 7) missing.push('teléfono');
    if (!out.address1) missing.push('dirección');
    if (!out.city) missing.push('ciudad');
    if (!out.province) missing.push('departamento');
    if (!out.zip) missing.push('código postal');
    if (out.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(out.email)) missing.push('correo válido');
    return { address: out, missing };
  }

  // ------------------------------------------------ rutas
  return function handle({ method, parts, query, body, me, send, fail }) {
    const db = getDb();
    const [a, b, c] = parts;
    const need = () => { if (!me) { fail(401, 'Debes iniciar sesión.'); return false; } return true; };

    // Tienda de una empresa
    if (a === 'store' && b && method === 'GET') {
      const owner = findUser(b);
      if (!owner) return fail(404, 'Tienda no encontrada.');
      const st = storeOf(owner);
      const products = db.products.filter((p) => p.userId === owner.id);
      const categories = (owner.company.products || []).map((name) => ({
        name, count: products.filter((p) => p.category === name).length,
        image: products.find((p) => p.category === name)?.images?.[0] || null,
      }));
      return send(200, {
        store: { id: owner.id, name: owner.company.name, logo: owner.company.logo, verified: !!owner.company.verified, currency: st.currency, freeShippingFrom: st.freeShippingFrom, connected: !!st.shopifyDomain, isMine: me?.id === owner.id },
        categories,
        products: products.sort((x, y) => (y.featured - x.featured) || y.createdAt.localeCompare(x.createdAt)).map((p) => publicProduct(p, me)),
      });
    }
    if (a === 'me' && b === 'store') {
      if (!need()) return;
      if (method === 'GET') return send(200, { store: storeOf(me) });
      if (method === 'PUT') {
        const cur = storeOf(me);
        const next = { ...cur };
        if ('shopifyDomain' in body) {
          const d = cleanDomain(body.shopifyDomain);
          if (body.shopifyDomain && !d) return fail(400, 'Escribe el dominio de tu tienda Shopify, por ejemplo: mitienda.myshopify.com');
          next.shopifyDomain = d;
        }
        if ('currency' in body) next.currency = CURRENCIES.includes(body.currency) ? body.currency : cur.currency;
        if ('freeShippingFrom' in body) next.freeShippingFrom = num(body.freeShippingFrom);
        if ('taxRate' in body) next.taxRate = num(body.taxRate, 0, 50);
        if ('taxIncluded' in body) next.taxIncluded = !!body.taxIncluded;
        if ('checkoutMode' in body) next.checkoutMode = body.checkoutMode === 'cart' ? 'cart' : 'checkout';
        me.company.store = next;
        saveDB();
        return send(200, { store: next });
      }
    }

    // Productos
    if (a === 'products' && !b && method === 'GET') {
      const q = str(query.get('q'), 60).toLowerCase();
      let list = db.products.filter((p) =>
        (!query.get('company') || p.userId === query.get('company')) &&
        (!query.get('category') || p.category === query.get('category')) &&
        (!query.get('featured') || p.featured) &&
        (!q || [p.name, p.brand, p.model, p.category, ...(p.highlights || [])].join(' ').toLowerCase().includes(q)));
      if (query.get('favorites') && me) list = list.filter((p) => me.favorites?.includes(p.id));
      return send(200, { products: list.slice(0, 200).map((p) => publicProduct(p, me)) });
    }
    if (a === 'products' && !b && method === 'POST') {
      if (!need()) return;
      if (!(me.company.products || []).length) return fail(400, 'Primero agrega al menos una categoría en "Productos o servicios" de tu perfil.');
      const p = cleanProduct({ category: me.company.products[0], ...body }, { id: uid(), userId: me.id, createdAt: now(), images: [], highlights: [], features: [], specs: [], inBox: [], price: 0, stock: null }, me);
      if (!p.name) return fail(400, 'Escribe el nombre del producto.');
      if (!(p.price > 0)) return fail(400, 'Escribe un precio mayor que cero.');
      db.products.push(p);
      saveDB();
      return send(201, { product: publicProduct(p, me, { full: true }) });
    }
    if (a === 'products' && b) {
      const p = db.products.find((x) => x.id === b);
      if (!p) return fail(404, 'Producto no encontrado.');
      if (!c && method === 'GET') {
        const related = db.products.filter((x) => x.userId === p.userId && x.id !== p.id)
          .sort((x, y) => (y.category === p.category) - (x.category === p.category)).slice(0, 8);
        const reviews = reviewsOf(p.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).map((r) => ({ ...r, author: miniUser(findUser(r.userId)) }));
        return send(200, { product: publicProduct(p, me, { full: true }), related: related.map((x) => publicProduct(x, me)), reviews });
      }
      if (!need()) return;
      if (!c && (method === 'PUT' || method === 'DELETE')) {
        if (p.userId !== me.id) return fail(403, 'Solo la empresa dueña puede modificar este producto.');
        if (method === 'DELETE') {
          db.products = db.products.filter((x) => x.id !== p.id);
          db.users.forEach((u) => { if (u.cart) u.cart = u.cart.filter((i) => i.productId !== p.id); });
          saveDB();
          return send(200, { ok: true });
        }
        Object.assign(p, cleanProduct(body, p, me));
        if (!(p.price > 0)) return fail(400, 'Escribe un precio mayor que cero.');
        saveDB();
        return send(200, { product: publicProduct(p, me, { full: true }) });
      }
      if (c === 'favorite' && method === 'POST') {
        me.favorites = me.favorites || [];
        const i = me.favorites.indexOf(p.id);
        if (i >= 0) me.favorites.splice(i, 1); else me.favorites.push(p.id);
        saveDB();
        return send(200, { isFavorite: i < 0 });
      }
      if (c === 'reviews' && method === 'POST') {
        if (p.userId === me.id) return fail(400, 'No puedes valorar tus propios productos.');
        const rating = Math.round(num(body.rating, 0, 5));
        if (rating < 1) return fail(400, 'Elige de 1 a 5 estrellas.');
        const text = str(body.text, 600);
        const existing = db.reviews.find((r) => r.productId === p.id && r.userId === me.id);
        if (existing) Object.assign(existing, { rating, text, createdAt: now() });
        else db.reviews.push({ id: uid(), productId: p.id, userId: me.id, rating, text, createdAt: now() });
        notify(p.userId, me.id, 'review', `${me.company.name} valoró ${p.name} con ${rating} ★`);
        saveDB();
        return send(201, { ...ratingOf(p.id) });
      }
    }

    // Carrito
    if (a === 'cart') {
      if (!need()) return;
      me.cart = me.cart || [];
      if (!b && method === 'GET') return send(200, cartOf(me));
      if (!b && method === 'POST') {
        const p = db.products.find((x) => x.id === body.productId);
        if (!p) return fail(404, 'Producto no encontrado.');
        if (p.stock === 0) return fail(400, 'Este producto está agotado.');
        const first = me.cart[0] && db.products.find((x) => x.id === me.cart[0].productId);
        if (first && first.userId !== p.userId) {
          if (!body.replace) return fail(409, `Tu carrito tiene productos de ${findUser(first.userId)?.company.name}. Cada compra se hace con una sola tienda.`);
          me.cart = [];
        }
        const qty = Math.max(1, Math.min(99, Math.round(num(body.qty, 1, 99))));
        const line = me.cart.find((i) => i.productId === p.id);
        if (line) line.qty = body.mode === 'set' ? qty : Math.min(99, line.qty + qty);
        else me.cart.push({ productId: p.id, qty });
        saveDB();
        return send(200, cartOf(me));
      }
      if (b && method === 'DELETE') { me.cart = me.cart.filter((i) => i.productId !== b); saveDB(); return send(200, cartOf(me)); }
      if (!b && method === 'DELETE') { me.cart = []; saveDB(); return send(200, cartOf(me)); }
    }
    if (a === 'me' && b === 'address') {
      if (!need()) return;
      if (method === 'GET') return send(200, { address: me.address || null });
      if (method === 'PUT') {
        const { address, missing } = cleanAddress(body);
        if (missing.length) return fail(400, `Falta: ${missing.join(', ')}.`);
        me.address = address; saveDB();
        return send(200, { address });
      }
    }

    // Ir a comprar → Shopify
    if (a === 'checkout' && method === 'POST') {
      if (!need()) return;
      const cart = cartOf(me);
      if (!cart.items.length) return fail(400, 'Tu carrito está vacío.');
      const { address, missing } = cleanAddress(body.address);
      if (missing.length) return fail(400, `Completa los datos de envío. Falta: ${missing.join(', ')}.`);
      if (body.save) { me.address = address; saveDB(); }
      const owner = findUser(cart.store.id);
      const st = storeOf(owner);
      if (!st.shopifyDomain) {
        return fail(412, owner.id === me.id
          ? 'Tu tienda aún no está conectada a Shopify. Agrega el dominio en Ajustes → Tienda Shopify.'
          : `${owner.company.name} aún no conectó su tienda Shopify. Escríbeles por Mensajes para comprar.`);
      }
      if (cart.missingVariants.length) {
        return fail(412, `Estos productos no están vinculados a Shopify: ${cart.missingVariants.join(', ')}. ${owner.id === me.id ? 'Agrega su "ID de variante de Shopify" en Mis productos.' : 'Avísale a la tienda por Mensajes.'}`);
      }
      const order = {
        id: 'CW-' + Date.now().toString(36).toUpperCase(),
        userId: me.id, storeId: owner.id, createdAt: now(), status: 'Enviado a Shopify',
        items: cart.items.map((i) => ({ productId: i.product.id, name: i.product.name, price: i.product.price, qty: i.qty, image: i.product.images[0] || null })),
        totals: cart.totals, address,
      };
      order.url = shopifyUrl(owner, me, address, order.id);
      db.orders.push(order);
      me.cart = [];
      notify(owner.id, me.id, 'order', `${me.company.name} fue a pagar un pedido de ${cart.count} producto(s) en Shopify (${order.id}).`);
      saveDB();
      return send(201, { order, url: order.url });
    }
    if (a === 'orders' && method === 'GET') {
      if (!need()) return;
      const mine = db.orders.filter((o) => o.userId === me.id).map((o) => ({ ...o, store: miniUser(findUser(o.storeId)) }));
      const received = db.orders.filter((o) => o.storeId === me.id).map((o) => ({ ...o, buyer: miniUser(findUser(o.userId)) }));
      const sort = (x, y) => y.createdAt.localeCompare(x.createdAt);
      return send(200, { orders: mine.sort(sort), received: received.sort(sort) });
    }
    return false;
  };
};
module.exports.DEFAULT_STORE = DEFAULT_STORE;

return module.exports; })();
  let db;
  function freshDB() {
    const d = seed({ hashPassword, uid });
    d.products = d.products || [];
    d.orders = d.orders || [];
    d.reviews = d.reviews || [];
    const codesah = d.users.find((u) => u.handle === 'codesah');
    if (codesah) {
      d.products.push(...seedStore({ uid, codesahId: codesah.id }));
      codesah.company.store = { ...storeApi.DEFAULT_STORE, ...(codesah.company.store || {}) };
    }
    d.storeSeeded = true;
    d.seedVersion = SEED_VERSION;
    return d;
  }
  function loadDB() {
    try { db = JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch { db = null; }
    if (!db || !Array.isArray(db.users) || db.seedVersion !== SEED_VERSION) { db = freshDB(); saveDB(); }
  }
  function saveDB() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch { throw new Error('El almacenamiento del dispositivo está lleno. Usa imágenes más livianas.'); }
  }

  const storeHandler = storeApi({
    getDb: () => db, saveDB, uid, now, findUser: (id) => findUser(id), miniUser: (u) => miniUser(u),
    notify: (...args) => notify(...args),
  });

  // Respuesta de la ruta actual (reemplaza a res.writeHead/res.end del servidor)
  let out = null;
  function send(res, status, data) { out = { status, data: JSON.parse(JSON.stringify(data)) }; }
  const fail = (res, status, message) => send(res, status, { error: message });
  function authUser(req) {
    const token = req.token;
    if (!token || !db.sessions[token]) return null;
    return findUser(db.sessions[token]) || null;
  }
  const readBody = null;


// ---------------------------------------------------------------- validación
const SECTORS = ['Tecnología', 'Industria', 'Agroindustria', 'Transporte', 'Construcción', 'Comercio y servicios', 'Consultoría', 'Energía', 'Salud', 'Educación', 'Otro'];

function cleanCompany(input, current) {
  const c = { ...current };
  const str = (v, max) => String(v ?? '').trim().slice(0, max);
  const int = (v) => Math.max(0, Math.min(1e7, parseInt(v, 10) || 0));
  if ('name' in input) { const n = str(input.name, 60); if (n) c.name = n; }
  if ('sigla' in input) c.sigla = str(input.sigla, 15);
  if ('nit' in input) c.nit = str(input.nit, 20).replace(/[^\d-]/g, '');
  if ('foundedAt' in input) c.foundedAt = str(input.foundedAt, 10);
  if ('businessType' in input) c.businessType = str(input.businessType, 40);
  if ('country' in input) c.country = str(input.country, 40);
  if ('slogan' in input) c.slogan = str(input.slogan, 80);
  if ('location' in input) c.location = str(input.location, 60);
  if ('sector' in input) c.sector = SECTORS.includes(input.sector) ? input.sector : 'Otro';
  if ('years' in input) c.years = int(input.years);
  if ('employees' in input) c.employees = int(input.employees);
  if ('clients' in input) c.clients = int(input.clients);
  if ('phone' in input) c.phone = str(input.phone, 25);
  if ('email' in input) c.email = str(input.email, 80);
  if ('logo' in input) c.logo = input.logo && String(input.logo).startsWith('data:image/') ? input.logo : (input.logo === null ? null : c.logo);
  if ('products' in input && Array.isArray(input.products)) {
    c.products = [...new Set(input.products.map((p) => str(p, 40)).filter(Boolean))].slice(0, 30);
  }
  return c;
}

// ---------------------------------------------------------------- rutas API
function api(req, res, pathname, query) {
  const method = req.method;
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  let body = {};
  if (method === 'POST' || method === 'PUT') {
    body = req.body || {};
  }
  const me = authUser(req);
  const need = () => { if (!me) { fail(res, 401, 'Debes iniciar sesión.'); return false; } return true; };
  const [a, b, c] = parts;

  // ---------- autenticación
  if (a === 'register' && method === 'POST') {
    const login = normLogin(body.login);
    if (!login || (login.includes('@') ? !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login) : login.replace('+', '').length < 7))
      return fail(res, 400, 'Ingresa un número de móvil o correo electrónico válido.');
    if (!body.password || String(body.password).length < 6) return fail(res, 400, 'La contraseña debe tener al menos 6 caracteres.');
    if (!String(body.name || '').trim()) return fail(res, 400, 'Ingresa el nombre de tu empresa o negocio.');
    if (!body.businessType) return fail(res, 400, 'Selecciona el tipo de negocio.');
    if (!body.country) return fail(res, 400, 'Selecciona tu país.');
    if (db.users.some((u) => u.login === login)) return fail(res, 409, 'Ya existe una cuenta con ese móvil o correo.');
    const { salt, hash } = hashPassword(String(body.password));
    let handle = handleOf(body.sigla || body.name), n = 1;
    while (db.users.some((u) => u.handle === handle)) handle = handleOf(body.sigla || body.name) + ++n;
    const years = body.foundedAt ? Math.max(0, new Date().getFullYear() - new Date(body.foundedAt).getFullYear()) : 0;
    const user = {
      id: uid(), login, salt, hash, handle, kind: 'empresa', following: [], createdAt: now(),
      company: cleanCompany({ ...body, years, products: [], sector: 'Otro',
        phone: login.includes('@') ? '' : body.login, email: login.includes('@') ? login : '' },
        { name: '', sigla: '', nit: '', verified: false, logo: null, slogan: '', location: '', employees: 0, clients: 0, products: [] }),
    };
    db.users.push(user);
    const token = uid() + uid();
    db.sessions[token] = user.id;
    saveDB();
    return send(res, 201, { token, user: publicUser(user, user.id) });
  }
  if (a === 'login' && method === 'POST') {
    const login = normLogin(body.login);
    const u = db.users.find((x) => x.login === login || (x.company.phone && normLogin(x.company.phone) === login) || (x.company.email && x.company.email.toLowerCase() === login));
    if (!u || !checkPassword(String(body.password || ''), u.salt, u.hash)) return fail(res, 401, 'Móvil o contraseña incorrectos.');
    const token = uid() + uid();
    db.sessions[token] = u.id;
    saveDB();
    return send(res, 200, { token, user: publicUser(u, u.id) });
  }
  if (a === 'logout' && method === 'POST') {
    const token = (req.headers.authorization || '').slice(7);
    delete db.sessions[token];
    saveDB();
    return send(res, 200, { ok: true });
  }
  if (a === 'forgot' && method === 'POST') {
    const login = normLogin(body.login);
    const u = db.users.find((x) => x.login === login);
    if (!u) return fail(res, 404, 'No encontramos una cuenta con ese móvil o correo.');
    const code = String(100000 + Math.floor(Math.random() * 900000));
    db.resets[login] = { code, exp: Date.now() + 15 * 60 * 1000 };
    saveDB();
    // En producción el código se enviaría por SMS o correo. En modo demo se devuelve.
    return send(res, 200, { ok: true, demoCode: code });
  }
  if (a === 'reset' && method === 'POST') {
    const login = normLogin(body.login);
    const r = db.resets[login];
    if (!r || r.code !== String(body.code || '').trim() || r.exp < Date.now()) return fail(res, 400, 'Código inválido o vencido.');
    if (!body.password || String(body.password).length < 6) return fail(res, 400, 'La contraseña debe tener al menos 6 caracteres.');
    const u = db.users.find((x) => x.login === login);
    Object.assign(u, hashPassword(String(body.password)));
    delete db.resets[login];
    saveDB();
    return send(res, 200, { ok: true });
  }

  // ---------- perfil propio
  if (a === 'me' && !b && method === 'GET') { if (!need()) return; return send(res, 200, { user: publicUser(me, me.id), login: me.login }); }
  if (a === 'me' && b === 'company' && method === 'PUT') {
    if (!need()) return;
    me.company = cleanCompany(body, me.company);
    saveDB();
    return send(res, 200, { user: publicUser(me, me.id) });
  }
  if (a === 'me' && b === 'password' && method === 'PUT') {
    if (!need()) return;
    if (!checkPassword(String(body.current || ''), me.salt, me.hash)) return fail(res, 400, 'La contraseña actual no es correcta.');
    if (!body.password || String(body.password).length < 6) return fail(res, 400, 'La nueva contraseña debe tener al menos 6 caracteres.');
    Object.assign(me, hashPassword(String(body.password)));
    saveDB();
    return send(res, 200, { ok: true });
  }
  if (a === 'me' && b === 'backup' && method === 'GET') {
    if (!need()) return;
    const data = {
      exportadoEn: now(),
      empresa: me.company,
      usuario: me.handle,
      publicaciones: db.posts.filter((p) => p.userId === me.id),
      mensajes: db.messages.filter((m) => m.from === me.id || m.to === me.id),
      siguiendo: me.following.map((id) => miniUser(findUser(id))),
    };
    return send(res, 200, data);
  }

  // ---------- subida de imágenes
  if (a === 'upload' && method === 'POST') {
    if (!need()) return;
    const m = /^data:(image\/(png|jpeg|jpg|svg\+xml|webp|gif));base64,(.+)$/.exec(String(body.dataUrl || ''));
    if (!m) return fail(res, 400, 'Formato no permitido. Usa JPG, PNG o SVG.');
    const buf = atob(m[3]);
    if (buf.length > 2 * 1024 * 1024) return fail(res, 413, 'La imagen supera el tamaño máximo de 2 MB.');
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp', 'image/gif': 'gif' }[m[1]];
    if (ext === 'svg' && /<script|on\w+\s*=/i.test(buf)) return fail(res, 400, 'SVG no permitido.');
    // Sin servidor: la imagen se guarda en el navegador como data URL (reducida si es grande).
    return send(res, 201, { url: body.dataUrl });
  }

  // ---------- empresas
  if (a === 'companies' && !b && method === 'GET') {
    const q = String(query.get('q') || '').toLowerCase();
    const sector = query.get('sector');
    let list = db.users.filter((u) =>
      (!sector || u.company.sector === sector) &&
      (!q || [u.company.name, u.company.sigla, u.handle, u.company.sector, u.company.location, ...(u.company.products || [])].join(' ').toLowerCase().includes(q)));
    return send(res, 200, { companies: list.map((u) => publicUser(u, me?.id)) });
  }
  if (a === 'companies' && b && !c && method === 'GET') {
    const u = findUser(b) || db.users.find((x) => x.handle === b);
    if (!u) return fail(res, 404, 'Empresa no encontrada.');
    return send(res, 200, { company: publicUser(u, me?.id) });
  }
  if (a === 'companies' && b && c === 'follow' && method === 'POST') {
    if (!need()) return;
    const u = findUser(b);
    if (!u || u.id === me.id) return fail(res, 400, 'No puedes seguir esta cuenta.');
    const i = me.following.indexOf(u.id);
    if (i >= 0) me.following.splice(i, 1);
    else { me.following.push(u.id); notify(u.id, me.id, 'follow', `${me.company.name} comenzó a seguirte.`); }
    saveDB();
    return send(res, 200, { company: publicUser(u, me.id) });
  }

  // ---------- publicaciones
  if (a === 'posts' && !b && method === 'GET') {
    const q = String(query.get('q') || '').toLowerCase();
    const sector = query.get('sector');
    const user = query.get('user');
    const feed = query.get('feed'); // "following"
    let list = db.posts.filter((p) => {
      const au = findUser(p.userId);
      if (!au) return false;
      if (user && p.userId !== user) return false;
      if (sector && au.company.sector !== sector) return false;
      if (feed === 'following' && me && !(me.following.includes(p.userId) || p.userId === me.id)) return false;
      if (q && ![p.title, p.text, (p.tags || []).join(' '), au.company.name, au.handle].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    list.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
    return send(res, 200, { posts: list.slice(0, 100).map((p) => publicPost(p, me?.id)) });
  }
  if (a === 'posts' && !b && method === 'POST') {
    if (!need()) return;
    const title = String(body.title || '').trim().slice(0, 60);
    const text = String(body.text || '').trim().slice(0, 1000);
    if (!title && !text && !body.image) return fail(res, 400, 'Escribe algo o agrega una imagen.');
    const tags = [...new Set((text.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.slice(1)))].slice(0, 10);
    const post = {
      id: uid(), userId: me.id, title, text, tags,
      image: body.image && String(body.image).startsWith('data:image/') ? body.image : null,
      theme: ['tech', 'agro', 'travel', 'build', 'energy', 'logistics'].includes(body.theme) ? body.theme : 'tech',
      createdAt: now(), likes: [], comments: [], shares: 0,
    };
    db.posts.push(post);
    db.users.filter((u) => u.following.includes(me.id)).forEach((u) => notify(u.id, me.id, 'post', `${me.company.name} publicó: ${title || text.slice(0, 40)}`, { postId: post.id }));
    saveDB();
    return send(res, 201, { post: publicPost(post, me.id) });
  }
  if (a === 'posts' && b) {
    const post = db.posts.find((p) => p.id === b);
    if (!post) return fail(res, 404, 'Publicación no encontrada.');
    if (!c && method === 'GET') return send(res, 200, { post: publicPost(post, me?.id) });
    if (!need()) return;
    if (!c && method === 'DELETE') {
      if (post.userId !== me.id) return fail(res, 403, 'Solo puedes eliminar tus publicaciones.');
      db.posts = db.posts.filter((p) => p.id !== b);
      saveDB();
      return send(res, 200, { ok: true });
    }
    if (c === 'like' && method === 'POST') {
      const i = post.likes.indexOf(me.id);
      if (i >= 0) post.likes.splice(i, 1);
      else { post.likes.push(me.id); notify(post.userId, me.id, 'like', `A ${me.company.name} le gusta tu publicación.`, { postId: post.id }); }
      saveDB();
      return send(res, 200, { post: publicPost(post, me.id) });
    }
    if (c === 'comments' && method === 'POST') {
      const text = String(body.text || '').trim().slice(0, 500);
      if (!text) return fail(res, 400, 'Escribe un comentario.');
      post.comments.push({ id: uid(), userId: me.id, text, createdAt: now() });
      notify(post.userId, me.id, 'comment', `${me.company.name} comentó: "${text.slice(0, 50)}"`, { postId: post.id });
      saveDB();
      return send(res, 201, { post: publicPost(post, me.id) });
    }
    if (c === 'share' && method === 'POST') {
      post.shares = (post.shares || 0) + 1;
      notify(post.userId, me.id, 'share', `${me.company.name} compartió tu publicación.`, { postId: post.id });
      saveDB();
      return send(res, 200, { post: publicPost(post, me.id) });
    }
  }

  // ---------- mensajes
  if (a === 'conversations' && method === 'GET') {
    if (!need()) return;
    const map = new Map();
    db.messages.filter((m) => m.from === me.id || m.to === me.id).forEach((m) => {
      const other = m.from === me.id ? m.to : m.from;
      const cur = map.get(other) || { user: miniUser(findUser(other)), last: null, unread: 0 };
      if (!cur.last || m.createdAt > cur.last.createdAt) cur.last = m;
      if (m.to === me.id && !m.read) cur.unread++;
      map.set(other, cur);
    });
    const list = [...map.values()].sort((x, y) => y.last.createdAt.localeCompare(x.last.createdAt));
    return send(res, 200, { conversations: list });
  }
  if (a === 'messages' && b) {
    if (!need()) return;
    const other = findUser(b);
    if (!other) return fail(res, 404, 'Usuario no encontrado.');
    if (method === 'GET') {
      const list = db.messages.filter((m) => (m.from === me.id && m.to === b) || (m.from === b && m.to === me.id));
      let changed = false;
      list.forEach((m) => { if (m.to === me.id && !m.read) { m.read = true; changed = true; } });
      if (changed) saveDB();
      return send(res, 200, { user: miniUser(other), messages: list });
    }
    if (method === 'POST') {
      const text = String(body.text || '').trim().slice(0, 1000);
      if (!text) return fail(res, 400, 'Escribe un mensaje.');
      if (b === me.id) return fail(res, 400, 'No puedes enviarte mensajes a ti mismo.');
      const m = { id: uid(), from: me.id, to: b, text, read: false, createdAt: now() };
      db.messages.push(m);
      saveDB();
      return send(res, 201, { message: m });
    }
  }

  // ---------- notificaciones
  if (a === 'notifications' && !b && method === 'GET') {
    if (!need()) return;
    const list = db.notifications.filter((n) => n.userId === me.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 50)
      .map((n) => ({ ...n, from: miniUser(findUser(n.fromId)) }));
    const unreadMessages = db.messages.filter((m) => m.to === me.id && !m.read).length;
    return send(res, 200, { notifications: list, unread: list.filter((n) => !n.read).length, unreadMessages });
  }
  if (a === 'notifications' && b === 'read' && method === 'POST') {
    if (!need()) return;
    db.notifications.forEach((n) => { if (n.userId === me.id) n.read = true; });
    saveDB();
    return send(res, 200, { ok: true });
  }

  if (a === 'meta' && method === 'GET') return send(res, 200, { sectors: SECTORS });

  // ---------- tienda, carrito y Shopify (store-api.js)
  const handled = storeHandler({
    method, parts, query, body, me,
    send: (status, data) => send(res, status, data),
    fail: (status, message) => fail(res, status, message),
  });
  if (handled !== false) return;

  return fail(res, 404, 'Ruta no encontrada.');
}

  // ---------------------------------------------------------------- imágenes: se reducen para caber en el dispositivo
  function shrinkImage(dataUrl, max = 1280, quality = 0.82) {
    if (!/^data:image\/(png|jpe?g|webp)/.test(dataUrl)) return Promise.resolve(dataUrl);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        if (k === 1 && dataUrl.length < 400 * 1024) return resolve(dataUrl);
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ---------------------------------------------------------------- interfaz pública
  loadDB();
  window.mockApi = async function mockApi(method, path, body, token) {
    loadDB(); // por si otra pestaña cambió los datos
    const u = new URL(path, 'http://colw.local/');
    if (method === 'POST' && u.pathname === '/upload' && body && body.dataUrl) body = { ...body, dataUrl: await shrinkImage(String(body.dataUrl)) };
    out = null;
    let result;
    try {
      api({ method, token, headers: { authorization: token ? 'Bearer ' + token : '' }, body: body ? JSON.parse(JSON.stringify(body)) : {} }, null, '/api' + u.pathname, u.searchParams);
    } catch (err) {
      console.error(err);
      loadDB();
      return { status: 500, data: { error: err.message || 'Error interno.' } };
    }
    result = out || { status: 500, data: { error: 'Error interno.' } };
    out = null;
    await new Promise((r) => setTimeout(r, 60)); // pequeña pausa para que se sienta como una red
    return result;
  };
  window.mockApiReset = function () { localStorage.removeItem(DB_KEY); loadDB(); };
})();
