# 🎮 Frontend — GameTrack Revolution

Bienvenido al frontend de **GameTrack Revolution**: la interfaz web que usan los jugadores para gestionar su biblioteca, registrar horas, escribir reseñas y ver estadísticas. Esta guía rápida te ayudará a levantar el proyecto y entender su estructura.

---

## ✨ ¿Qué es GameTrack Revolution?

GameTrack Revolution es una aplicación para que jugadores gestionen su colección de videojuegos y lleven un registro detallado de su actividad. Permite:

- 🗂️ Registrar y organizar juegos (con portadas y metadatos).
- ⏱️ Rastrear horas jugadas y progreso por título.
- ✍️ Escribir, editar y leer reseñas propias y de la comunidad.
- 📊 Ver estadísticas personales (tiempo total, juegos completados, tendencias).
- 🔗 Sincronizar/importar datos desde servicios externos como RAWG.
- 🖼️ Subir imágenes/portadas y exportar datos (PDF, CSV, según funcionalidades disponibles).

Pensada tanto para uso personal como para compartir reseñas y estadísticas con la comunidad.

---

## 🧭 Estructura principal

- `src/` — código fuente React (componentes, páginas, contextos, hooks, servicios y estilos).
- `public/` — assets estáticos (imágenes, fuentes, iconos).
- `index.html` — entrada usada por Vite.
- `.env` / `.env.production` — variables de entorno.
- `package.json` — scripts y dependencias.

Árbol simplificado:

```
frontend/
├─ public/
├─ src/
│  ├─ components/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ pages/
│  ├─ router/
│  └─ services/
├─ index.html
├─ package.json
└─ .env
```

---

## ⚙️ Requisitos

- Node.js >= 16
- npm o yarn

Comprueba tu versión de Node: `node -v`

---

## 🚀 Instalación rápida

En la carpeta `frontend` ejecuta:

```bash
npm install
# o con yarn
yarn
```

## ▶️ Ejecutar en desarrollo

```bash
npm run dev
# o
yarn dev
```

Abre `http://localhost:5173` (o la URL que indique Vite).

---

## 📦 Scripts útiles

- `dev` — servidor de desarrollo (HMR).
- `build` — build de producción.
- `preview` — servir build localmente.

Consulta `package.json` para ver scripts adicionales.

---

## 🔐 Variables de entorno (ejemplo)

Las variables que comienzan con `VITE_` se inyectan al cliente. Ejemplo mínimo en `.env`:

```
VITE_API_URL=http://localhost:3000
```

Variables comunes a añadir (según features del proyecto):

- `VITE_API_URL` — URL del backend.
- `VITE_RAWG_KEY` — (opcional) clave para la API RAWG si se integra desde el frontend.

---

## 🛠️ Notas para desarrolladores

- Componentes UI en `src/components/`.
- Lógica de estado en `src/contexts/` y hooks en `src/hooks/`.
- Llamadas API centralizadas en `src/services/api.js`.
- Sigue convenciones: `PascalCase` para componentes, `camelCase` para funciones/hooks.

Si introduces cambios grandes, añade pruebas o verifica manualmente las pantallas clave.

---

## 🚢 Despliegue

Genera la build y sube `dist/` al hosting estático de tu elección:

```bash
npm run build
# luego `npm run preview` para probar localmente
```

---

## 🤝 Contribuir

- Abre una issue para proponer cambios o reportar bugs.
- Crea un PR con una descripción clara y una captura (si aplica).

---

## 📚 Recursos rápidos

- `frontend/package.json` — scripts y dependencias.
- `frontend/src/services/api.js` — cliente HTTP y config.

---

¿Quieres que añada badges, capturas de pantalla o una sección con convenciones de commits/PR? Estoy listo para dejarlo aún más bonito.

