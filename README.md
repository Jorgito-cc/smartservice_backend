# 🔧 SmartService Backend

API REST backend para **SmartService** — una plataforma integral para la gestión, recomendación y análisis de servicios a domicilio mediante **Inteligencia Artificial** y **Business Intelligence**.

---

## 🚀 Descripción General

**SmartService Backend** es una API REST robusta desarrollada con **Node.js**, **Express** y **PostgreSQL** (via Sequelize ORM). Proporciona toda la lógica de negocio, autenticación, pagos, chat en tiempo real y comunicación con servicios de IA.

---

## 🛠️ Tecnologías Utilizadas

### Core Stack
- **Node.js** - Runtime JavaScript
- **Express** `5.1.0` - Framework web minimalista
- **PostgreSQL** - Base de datos relacional
- **Sequelize** `6.37.7` - ORM para PostgreSQL

### Autenticación & Seguridad
- **JWT** (`jsonwebtoken` 9.0.2) - Token-based authentication
- **bcrypt** `6.0.0` - Hash de contraseñas
- **Helmet** `8.1.0` - Headers de seguridad HTTP
- **CORS** `2.8.5` - Control de acceso cross-origin
- **express-validator** `7.3.0` - Validación de entrada

### Comunicación
- **Socket.io** `4.8.1` - WebSocket en tiempo real
- **axios** `1.13.2` - Cliente HTTP para APIs externas

### Pagos & Externos
- **Stripe** `19.3.1` - Procesamiento de pagos
- **Firebase Admin** `13.6.0` - Notificaciones push
- **csv-parser** `3.2.0` - Parseo de CSV

### Monitoreo & Logging
- **Morgan** `1.10.1` - HTTP request logger
- **Winston** `3.18.3` - Logger estructurado
- **dotenv** `17.2.3` - Variables de entorno

### Dev Tools
- **Nodemon** `3.1.11` - Auto-reload en desarrollo

---

## 📁 Estructura del Proyecto

```
smartservice_backend/
├── src/
│   ├── app.js                      # Configuración Express
│   ├── config/
│   │   ├── db.js                  # Conexión PostgreSQL
│   │   └── stripe.js              # Configuración Stripe
│   ├── controllers/                # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── usuario.controller.js
│   │   ├── tecnico.controller.js
│   │   ├── solicitud.controller.js
│   │   ├── oferta.controller.js
│   │   ├── servicio.controller.js
│   │   ├── pago.controller.js
│   │   ├── chat.controller.js
│   │   ├── ml.controller.js
│   │   ├── notificacion.controller.js
│   │   ├── calificacion.controller.js
│   │   ├── reportes.controller.js
│   │   └── ...
│   ├── models/                     # Modelos Sequelize
│   │   ├── usuario.js
│   │   ├── cliente.js
│   │   ├── tecnico.js
│   │   ├── solicitud_servicio.js
│   │   ├── oferta_tecnico.js
│   │   ├── servicio_asignado.js
│   │   ├── pago_servicio.js
│   │   ├── calificacion.js
│   │   ├── chat_mensaje.js
│   │   ├── notificacion.js
│   │   ├── auditoria_log.js
│   │   └── index.js               # Sincronización Sequelize
│   ├── routes/                     # Rutas HTTP
│   │   ├── auth.routes.js
│   │   ├── usuario.routes.js
│   │   ├── tecnico.routes.js
│   │   ├── solicitud.routes.js
│   │   ├── servicio.routes.js
│   │   ├── chat.routes.js
│   │   ├── pago.routes.js
│   │   ├── ml.routes.js
│   │   └── ...
│   ├── middleware/                 # Middlewares
│   │   ├── auth.middleware.js      # Verificar JWT
│   │   ├── role.middleware.js      # Autorización por rol
│   │   ├── validators.js           # Validación de entrada
│   │   └── auditoria.middleware.js # Logging de auditoría
│   ├── service/                    # Servicios de negocio
│   │   ├── ChatService.js
│   │   ├── MLService.js            # Integración IA
│   │   ├── FirebaseService.js      # Notificaciones
│   │   ├── notificacion.service.js
│   │   └── oferta.service.js
│   ├── socket/                     # WebSocket handlers
│   │   ├── chat.socket.js
│   │   ├── notificacion.socket.js
│   │   └── events.js
│   ├── utils/                      # Utilidades
│   │   ├── generateJWT.js
│   │   ├── haversine.js           # Cálculo distancias
│   │   ├── firebase.js            # Config Firebase
│   │   ├── auditoria.util.js      # Auditoría
│   │   └── notificacion.util.js
│   └── migrations/                 # Migraciones BD
├── scripts/
│   └── seed.js                     # Datos de prueba
├── migrations/                     # SQL migrations
├── data_templates/                 # Plantillas de datos
├── public/                         # Archivos estáticos
│   └── index.html
├── .env                            # Variables (NO subir)
├── .env-example                    # Ejemplo variables
├── server.js                       # Punto de entrada
├── package.json
└── README.md
```

---

## 🎯 Características Principales

### 🔐 Autenticación & Usuarios
✅ Registro/Login con JWT
✅ Roles: admin, cliente, técnico
✅ Recuperación de contraseña
✅ Perfil de usuario

### 📋 Solicitudes de Servicios
✅ Crear solicitudes
✅ Listar solicitudes del cliente/técnico
✅ Cambio de estado
✅ Historial de cambios

### 🔧 Gestión de Técnicos
✅ Registro y perfil de técnico
✅ Especialidades
✅ Zonas de cobertura
✅ Disponibilidad

### 💰 Pagos (Stripe)
✅ Crear intención de pago
✅ Procesar pagos
✅ Webhook Stripe
✅ Histórico de transacciones

### 💬 Chat en Tiempo Real
✅ Chat grupal por solicitud
✅ Chat privado entre usuarios
✅ Historial de mensajes
✅ WebSocket en tiempo real

### 🤖 Inteligencia Artificial
✅ Recomendación de técnicos
✅ Análisis predictivo
✅ Modelos ML entrenados

### 📊 Reportes & Analítica
✅ Reportes de servicios
✅ Estadísticas de técnicos
✅ Análisis de ingresos
✅ Exportación a PDF/Excel

### 🔔 Notificaciones
✅ Notificaciones push (Firebase)
✅ Notificaciones en app
✅ Notificaciones por email

### 📝 Auditoría
✅ Bitácora de cambios
✅ Seguimiento de acciones
✅ Logs estructurados

---

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 12
- **Git**

---

## 🚀 Instalación y Configuración

### 1. Clonar Repositorio
```bash
git clone https://github.com/tuusuario/smartservice_backend.git
cd smartservice_backend
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env-example .env
```

Editar `.env`:
```dotenv
PORT=4000

# Base de datos PostgreSQL
DB_HOST=localhost
DB_NAME=smartservice
DB_USER=postgres
DB_PASS=tu_password
DB_PORT=5432

# JWT
JWT_SECRET=tu_secreto_muy_largo_y_seguro
JWT_EXPIRES=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Firebase (Notificaciones)
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=tu-email@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXX\n-----END PRIVATE KEY-----\n"

# ML Service
ML_SERVICE_URL=http://localhost:5000

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. Crear Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear BD
CREATE DATABASE smartservice;

# Salir
\q
```

### 5. Sincronizar Modelos (Sequelize)
```bash
# En src/models/index.js
npm run dev
# Sequelize sincronizará automáticamente las tablas
```

### 6. Ejecutar Datos de Prueba (Opcional)
```bash
node scripts/seed.js
```

### 7. Ejecutar en Desarrollo
```bash
npm run dev
# Servidor escucha en http://localhost:4000
```

---

## 🔨 Scripts Disponibles

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start

# Ver logs
npm run logs

# Generar datos de prueba
node scripts/seed.js
```

---

## 📡 Endpoints Principales

### Autenticación
```
POST   /api/auth/register         - Registro
POST   /api/auth/login            - Login
POST   /api/auth/refresh          - Refrescar token
POST   /api/auth/logout           - Logout
POST   /api/auth/forgot-password  - Recuperar contraseña
```

### Usuarios
```
GET    /api/usuarios              - Listar (admin)
GET    /api/usuarios/:id          - Obtener usuario
PUT    /api/usuarios/:id          - Actualizar
DELETE /api/usuarios/:id          - Eliminar (admin)
```

### Técnicos
```
GET    /api/tecnicos              - Listar técnicos
GET    /api/tecnicos/:id          - Obtener técnico
POST   /api/tecnicos              - Registrar técnico
PUT    /api/tecnicos/:id          - Actualizar
GET    /api/tecnicos/recomendados - Recomendados (IA)
```

### Solicitudes
```
GET    /api/solicitud             - Listar solicitudes
POST   /api/solicitud             - Crear solicitud
GET    /api/solicitud/:id         - Obtener solicitud
PUT    /api/solicitud/:id         - Actualizar estado
```

### Servicios
```
GET    /api/servicio              - Listar servicios
GET    /api/servicio/:id          - Obtener servicio
POST   /api/servicio              - Crear (admin)
```

### Ofertas
```
GET    /api/oferta                - Listar ofertas
POST   /api/oferta                - Crear oferta
PUT    /api/oferta/:id            - Aceptar/Rechazar
```

### Chat
```
GET    /api/chat                  - Historial chat
POST   /api/chat                  - Enviar mensaje
GET    /api/chat/:solicitudId     - Chat por solicitud
```

### Pagos
```
POST   /api/pago/intent           - Crear intención pago
POST   /api/pago/confirmar        - Confirmar pago
GET    /api/pago/historial        - Historial pagos
POST   /api/pago/webhook          - Webhook Stripe
```

### ML/IA
```
GET    /api/ml/recomendaciones    - Obtener recomendaciones
POST   /api/ml/entrenar           - Entrenar modelo
GET    /api/ml/analisis           - Análisis predictivo
```

### Reportes
```
GET    /api/reportes              - Listar reportes
POST   /api/reportes              - Generar reporte
GET    /api/reportes/export       - Exportar PDF/Excel
```

---

## 🔐 Autenticación

### Flujo JWT
1. Usuario hace login: `POST /api/auth/login`
2. Backend retorna `{ accessToken, refreshToken }`
3. Cliente guarda tokens
4. En cada request: `Authorization: Bearer {accessToken}`
5. Middleware verifica token

### Middleware Auth
```javascript
// routes/solicitud.routes.js
router.get('/', auth, SolicitudController.listar);
// 'auth' middleware verifica JWT
```

### Roles
```javascript
router.post('/', [auth, roleCheck(['admin'])], SolicitudController.crear);
// 'roleCheck' middleware valida rol
```

---

## 💾 Base de Datos

### Modelos Principales

**Usuario**
```javascript
{
  id, email, password, nombre, apellido,
  rol (admin|cliente|tecnico),
  telefono, foto, estado, createdAt, updatedAt
}
```

**Técnico**
```javascript
{
  id, usuarioId, descripcion, rating,
  especialidades[], zonas[], ubicaciones[],
  disponibilidad[], createdAt, updatedAt
}
```

**Solicitud Servicio**
```javascript
{
  id, clienteId, categoriaId, titulo,
  descripcion, estado, prioridad,
  ubicacion, fecha_requerida,
  createdAt, updatedAt
}
```

**Oferta Técnico**
```javascript
{
  id, solicitudId, tecnicoId, monto,
  descripcion, estado, fechaRespuesta
}
```

### Relaciones
- Usuario 1:N Solicitud
- Usuario 1:N Oferta
- Solicitud N:N Técnico (via Oferta)
- Técnico N:N Especialidad

---

## 🔌 WebSocket Events

### Chat
```javascript
socket.emit('nuevoMensaje', {
  solicitudId, usuarioId, contenido, timestamp
});

socket.on('mensajeRecibido', (mensaje) => {...});
```

### Notificaciones
```javascript
socket.emit('notificacion', {
  titulo, mensaje, tipo, usuarioId
});
```

### Ofertas
```javascript
socket.on('nuevaOferta', (oferta) => {...});
```

---

## 💳 Integración Stripe

### Crear Intención de Pago
```javascript
POST /api/pago/intent
{
  "monto": 5000,        // centavos
  "moneda": "usd",
  "descripcion": "Servicio de reparación"
}
```

### Webhook Stripe
```javascript
// src/routes/pago.routes.js
POST /api/pago/webhook
// Stripe envia: payment_intent.succeeded, etc
```

---

## 📧 Notificaciones Firebase

```javascript
// src/service/FirebaseService.js
await firebaseAdmin.messaging().send({
  notification: { title, body },
  token: deviceToken,
});
```

---

## 🐛 Solución de Problemas

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
```bash
# PostgreSQL no está corriendo
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows (desde services)
Services -> PostgreSQL -> Start
```

### Error: "ER_ACCESS_DENIED_ERROR"
```bash
# Revisar credenciales .env
# DB_USER y DB_PASS deben ser correctos
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'nueva_pass';"
```

### Error: "STRIPE_SECRET_KEY is undefined"
```bash
# Revisar .env tiene la clave
echo $STRIPE_SECRET_KEY
# Si está vacío, agregarla a .env
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
```javascript
// src/app.js ya incluye CORS
// Si aún falla, verificar FRONTEND_URL en .env
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

---

## 📊 Logs y Monitoreo

### Winston Logger
```javascript
const logger = require('./utils/logger');
logger.info('Solicitud creada', { solicitudId: 123 });
logger.error('Error creando solicitud', { error });
```

### Morgan HTTP Logs
```javascript
// Todos los requests quedan en logs
GET /api/solicitud 200 45ms
POST /api/pago/intent 201 120ms
```

---

## 🚀 Deploy a Producción

### Heroku
```bash
# Crear app
heroku create mi-smartservice-api

# Configurar variables
heroku config:set DB_HOST=xxx DB_USER=xxx ...

# Deployer
git push heroku main

# Ver logs
heroku logs --tail
```

### AWS (RDS + EC2)
1. Crear instancia RDS PostgreSQL
2. Crear EC2 t2.micro
3. Conectar repositorio GitHub
4. Configurar GitHub Actions para auto-deploy

### Azure
```bash
az login
az group create --name smartservice --location eastus
az appservice plan create --resource-group smartservice --name api-plan
az webapp create --resource-group smartservice --plan api-plan --name smartservice-api
```

---

## 📚 Recursos

- [Express.js Guide](https://expressjs.com)
- [Sequelize ORM](https://sequelize.org)
- [JWT.io](https://jwt.io)
- [Stripe API](https://stripe.com/docs/api)
- [Socket.io Docs](https://socket.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

---


## 📄 Licencia

Licencia **ISC**. Ver [LICENSE](LICENSE).

---

## 👨‍💻 Autor

**Jorge Choque Calle**



---

**Última actualización:** Diciembre 2025
