# ColW — Red que transforma y conecta el mundo

Front de la red social empresarial de **CODESAH** (inicio de sesión, registro, perfil, publicaciones,
seguidores, mensajes, notificaciones, asistente virtual, antecedentes, enlace DIAN y tienda con Shopify).

Es un sitio **100 % estático** (HTML/CSS/JS, sin servidor): las rutas de la API se resuelven en el navegador
con `js/mock-api.js` y los datos se guardan en el dispositivo (localStorage). Por eso cada teléfono o
navegador tiene sus propios datos. En **Ajustes → Restablecer datos de ejemplo** se vuelve al estado inicial.

## Abrir en el iPhone (GitHub Pages)
1. En GitHub: **Settings → Pages → Deploy from a branch → `main` / root**.
2. En el iPhone abre `https://egasjulian.github.io/<repo>/` en **Safari** → **Compartir** → **Agregar a pantalla de inicio**.
3. ColW queda con su ícono, a pantalla completa y funciona sin conexión.

## Probar en el computador
Sirve la carpeta con cualquier servidor estático (abrir `index.html` con doble clic no registra el service worker):
```
npx serve .
```

## Cuenta de ejemplo
| Usuario (móvil) | Contraseña |
|---|---|
| 3176811433 | codesah123 |

Otras empresas (contraseña `colw123`): `andestech@colw.co`, `3001234567`, `ecosolar@colw.co`, `logitrans@colw.co`…

## Estructura
```
index.html             Página de la app
manifest.webmanifest   Datos para instalar la app
sw.js                  Service worker (carga rápida y sin conexión)
offline.html           Pantalla sin conexión
css/styles.css         Diseño base
css/glass.css          Diseño liquid glass
js/mock-api.js         Backend simulado (datos de ejemplo + rutas) en el navegador
js/app.js              Lógica de pantallas
js/store.js            Pantallas de la tienda
js/icons.js            Iconos
img/                   Logo, íconos de la app e imágenes de productos
```

Nota: las contraseñas se guardan con un hash simple en el dispositivo; es un prototipo, no hay seguridad real.
