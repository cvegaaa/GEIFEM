# GEIFEM - Guía de Despliegue (VPS + Easypanel)

GEIFEM está desplegado en un VPS propio (Hostinger), administrado con [Easypanel](https://easypanel.io), un panel que gestiona Docker Swarm, Traefik (reverse proxy) y los certificados SSL (Let's Encrypt) automáticamente.

---

## 📁 Estructura del proyecto

```
GEIFEM/
├── frontend/    → Sitio React (CRA + craco), servido como estático vía nginx
└── backend/     → API FastAPI (Python), Uvicorn
```

Ambos se construyen desde sus propios `Dockerfile` dentro de cada carpeta.

---

## 🌐 Arquitectura en Easypanel

Proyecto `geifem` con 3 servicios:

| Servicio   | Tipo        | Dominio(s)                          |
|------------|-------------|--------------------------------------|
| `mongo`    | MongoDB     | interno (`geifem_mongo:27017`)       |
| `backend`  | App (Docker)| `api.geifem.com`                     |
| `frontend` | App (Docker)| `geifem.com`, `www.geifem.com`       |

### Backend
- Build: `backend/Dockerfile` (ya existente, respeta `$PORT`, corre como usuario no-root)
- Fuente: GitHub `cvegaaa/GEIFEM`, rama `main`, root dir `/backend`
- Variables de entorno necesarias (se configuran en Easypanel → backend → Entorno, **no en el repo**):
  ```
  MONGO_URL=<URL interna del servicio mongo, visible en Easypanel → mongo → Credenciales>
  DB_NAME=geifem_prod
  CORS_ORIGINS=https://geifem.com,https://www.geifem.com
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=<generar uno fuerte, no reutilizar contraseñas>
  ADMIN_LOCKOUT_MINUTES=15
  ADMIN_MAX_ATTEMPTS=5
  SESSION_TTL_HOURS=8
  ENABLE_HTTPS_ONLY=true
  SMTP_HOST=smtp.hostinger.com
  SMTP_PORT=465
  SMTP_USER=cvegaa@geifem.com
  SMTP_PASSWORD=<contraseña real del buzón, cargar directo en Easypanel>
  SMTP_FROM_EMAIL=cvegaa@geifem.com
  COMPANY_EMAIL=contacto@geifem.com
  EMAIL_FROM_NAME=GEIFEM
  ALPHA_VANTAGE_API_KEY=<key real, cargar directo en Easypanel>
  ```

### Frontend
- Build: `frontend/Dockerfile` (multi-stage: `node` compila con `npm ci --legacy-peer-deps` + `npm run build`, `nginx` sirve el estático)
- Fuente: GitHub `cvegaaa/GEIFEM`, rama `main`, root dir `/frontend`
- Variable de entorno (usada como build-arg, se compila dentro del bundle de React):
  ```
  REACT_APP_BACKEND_URL=https://api.geifem.com
  ```
  Importante: como CRA incrusta `REACT_APP_*` en tiempo de build, cambiar esta variable requiere un nuevo deploy (no solo reiniciar el contenedor).

### MongoDB
- Servicio `mongo` autoalojado dentro de Easypanel (mismo VPS, sin costo extra)
- Usuario/contraseña generados por Easypanel al crear el servicio — ver en Easypanel → mongo → Credenciales

---

## 🔗 GitHub (repo privado)

Easypanel necesita un Personal Access Token de GitHub para poder leer el repo privado:
1. GitHub → Settings → Developer settings → Personal access tokens → Generate new token
2. Scope: `repo`
3. Pegarlo en Easypanel → Settings (engranaje) → Github → Token de Github

---

## 🌍 DNS

Dominio `geifem.com` registrado y administrado en **Hostinger (hPanel)**. Registros DNS (tipo A, todos apuntando a la IP del VPS):

| Host | Tipo | Valor          |
|------|------|----------------|
| `@`  | A    | IP del VPS     |
| `www`| A    | IP del VPS     |
| `api`| A    | IP del VPS     |

Al crear/editar el registro `www`, el campo "Nombre/Host" debe llevar solo `www` (sin `.geifem.com` ni punto final) — el panel de Hostinger agrega el dominio base automáticamente.

Una vez el DNS propaga, Easypanel/Traefik emite los certificados SSL de Let's Encrypt automáticamente para cada dominio configurado.

---

## ✅ Checklist de seguridad

- [x] `ADMIN_PASSWORD` es un valor generado, no reutilizado, y solo vive en las variables de entorno de Easypanel
- [x] `CORS_ORIGINS` con dominios específicos (no `*`)
- [x] `ENABLE_HTTPS_ONLY=true`
- [x] Ningún archivo del repo contiene contraseñas o API keys reales
- [ ] Configurar backup periódico del volumen de MongoDB (pendiente)

---

## 📞 Administración

- Panel de Easypanel: `http://<IP del VPS>:3000`
- Panel admin de GEIFEM: `https://www.geifem.com/admin/login`
