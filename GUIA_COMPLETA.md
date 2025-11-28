# 📚 GUÍA COMPLETA DEL SISTEMA SMART SERVICE BACKEND

## 📋 TABLA DE CONTENIDOS

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Base de Datos y Modelos](#base-de-datos-y-modelos)
3. [Controladores](#controladores)
4. [Procesos por Rol](#procesos-por-rol)
5. [Sistema de Chat y Socket.IO](#sistema-de-chat-y-socketio)
6. [Sistema de Notificaciones](#sistema-de-notificaciones)
7. [Sistema de Pagos (Stripe)](#sistema-de-pagos-stripe)
8. [Machine Learning](#machine-learning)
9. [Middleware y Seguridad](#middleware-y-seguridad)
10. [Utilidades y Servicios](#utilidades-y-servicios)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Estructura de Carpetas

```
smartservice_backend/
├── src/
│   ├── config/          # Configuraciones (DB, Stripe)
│   ├── controllers/      # Lógica de negocio
│   ├── models/          # Modelos Sequelize (BD)
│   ├── routes/          # Definición de rutas
│   ├── middleware/      # Middlewares (auth, roles, auditoría)
│   ├── utils/           # Utilidades (JWT, Firebase, etc.)
│   ├── services/        # Servicios de negocio
│   ├── socket/          # Configuración Socket.IO
│   └── app.js           # Configuración Express
├── server.js            # Punto de entrada del servidor
└── .env                 # Variables de entorno
```

### Flujo de una Petición

```
Cliente → Express Router → Middleware (Auth/Role) → Controller → Model → Base de Datos
                                                                         ↓
                                                                    Response ← Cliente
```

### Tecnologías Utilizadas

- **Backend:** Node.js + Express.js
- **Base de Datos:** PostgreSQL + Sequelize ORM
- **Autenticación:** JWT (JSON Web Tokens)
- **WebSockets:** Socket.IO
- **Notificaciones Push:** Firebase Cloud Messaging
- **Pagos:** Stripe API
- **Machine Learning:** Python + Flask + XGBoost

---

## 🗄️ BASE DE DATOS Y MODELOS

### Modelo de Usuario (Herencia)

El sistema usa un patrón de herencia donde `Usuario` es la tabla base y `Cliente`, `Tecnico`, y `Admin` son tablas relacionadas 1:1.

#### **Usuario** (`usuario.js`)
Tabla principal que almacena información común de todos los usuarios.

**Campos:**
- `id_usuario` (PK, AUTO_INCREMENT)
- `nombre` (STRING, NOT NULL)
- `apellido` (STRING, NOT NULL)
- `email` (STRING, UNIQUE, NOT NULL)
- `password` (STRING, NOT NULL) - Hasheado con bcrypt
- `telefono` (STRING, NULLABLE)
- `foto` (STRING, NULLABLE) - URL de la foto
- `estado` (BOOLEAN, DEFAULT: true) - false = deshabilitado
- `token_real` (STRING, NULLABLE) - Token FCM para push notifications
- `rol` (ENUM: "cliente", "tecnico", "admin", NOT NULL)

**Relaciones:**
- `hasOne(Cliente)` - Un usuario puede ser un cliente
- `hasOne(Tecnico)` - Un usuario puede ser un técnico
- `hasOne(Admin)` - Un usuario puede ser un admin
- `hasMany(SolicitudServicio)` - Un cliente tiene muchas solicitudes
- `hasMany(OfertaTecnico)` - Un técnico tiene muchas ofertas
- `hasMany(ChatMensaje)` - Un usuario envía muchos mensajes
- `hasMany(Notificacion)` - Un usuario recibe muchas notificaciones
- `hasMany(AuditoriaLog)` - Un usuario genera muchos logs

#### **Cliente** (`cliente.js`)
Tabla que almacena información específica de clientes.

**Campos:**
- `id_cliente` (PK) - **Igual a id_usuario** (herencia)
- `preferencia` (TEXT, NULLABLE) - Preferencias del cliente

**Relaciones:**
- `belongsTo(Usuario)` - Un cliente pertenece a un usuario
- `hasMany(SolicitudServicio)` - Un cliente crea muchas solicitudes
- `hasMany(Calificacion)` - Un cliente hace muchas calificaciones

#### **Tecnico** (`tecnico.js`)
Tabla que almacena información específica de técnicos.

**Campos:**
- `id_tecnico` (PK) - **Igual a id_usuario** (herencia)
- `descripcion` (TEXT, NULLABLE) - Descripción del técnico
- `calificacion_promedio` (DECIMAL(3,2), NULLABLE) - Promedio de calificaciones
- `disponibilidad` (BOOLEAN, DEFAULT: true) - Si está disponible para trabajar

**Relaciones:**
- `belongsTo(Usuario)` - Un técnico pertenece a un usuario
- `hasMany(OfertaTecnico)` - Un técnico crea muchas ofertas
- `hasMany(ServicioAsignado)` - Un técnico tiene muchos servicios asignados
- `hasMany(Calificacion)` - Un técnico recibe muchas calificaciones
- `belongsToMany(Zona)` - Un técnico trabaja en muchas zonas (N:M)
- `belongsToMany(Especialidad)` - Un técnico tiene muchas especialidades (N:M)

#### **Admin** (`admin.js`)
Tabla que almacena información específica de administradores.

**Campos:**
- `id_admin` (PK) - **Igual a id_usuario** (herencia)

**Relaciones:**
- `belongsTo(Usuario)` - Un admin pertenece a un usuario

### Modelos de Servicios

#### **Categoria** (`categoria.js`)
Categorías de servicios disponibles (ej: Plomería, Electricidad).

**Campos:**
- `id_categoria` (PK, AUTO_INCREMENT)
- `nombre` (STRING(100), NOT NULL, UNIQUE)
- `descripcion` (TEXT, NULLABLE)

**Relaciones:**
- `hasMany(SolicitudServicio)` - Una categoría tiene muchas solicitudes

#### **Zona** (`zona.js`)
Zonas geográficas donde se prestan servicios.

**Campos:**
- `id_zona` (PK, AUTO_INCREMENT)
- `nombre` (STRING(100), NOT NULL)
- `ciudad` (STRING(100), NULLABLE)
- `coordenadas` (TEXT, NULLABLE) - JSON con coordenadas

**Relaciones:**
- `belongsToMany(Tecnico)` - Una zona tiene muchos técnicos (N:M)

#### **Especialidad** (`especialidad.js`)
Especialidades técnicas (ej: Instalación, Reparación).

**Campos:**
- `id_especialidad` (PK, AUTO_INCREMENT)
- `nombre` (STRING(100), NOT NULL)
- `referencias` (TEXT, NULLABLE)
- `anio_experiencia` (INTEGER, NULLABLE)

**Relaciones:**
- `belongsToMany(Tecnico)` - Una especialidad tiene muchos técnicos (N:M)

### Modelos de Solicitudes y Servicios

#### **SolicitudServicio** (`solicitud_servicio.js`)
Solicitudes de servicio creadas por clientes.

**Campos:**
- `id_solicitud` (PK, AUTO_INCREMENT)
- `id_cliente` (FK → Cliente)
- `id_categoria` (FK → Categoria)
- `descripcion` (TEXT, NOT NULL)
- `fecha_publicacion` (DATE, DEFAULT: NOW)
- `ubicacion_texto` (TEXT, NULLABLE)
- `lat` (DECIMAL(10,6), NULLABLE) - Latitud
- `lon` (DECIMAL(10,6), NULLABLE) - Longitud
- `estado` (ENUM: "pendiente", "con_ofertas", "asignado", "en_proceso", "completado", "cancelado", NOT NULL)

**Relaciones:**
- `belongsTo(Cliente)` - Una solicitud pertenece a un cliente
- `belongsTo(Categoria)` - Una solicitud pertenece a una categoría
- `hasMany(OfertaTecnico)` - Una solicitud tiene muchas ofertas
- `hasOne(ServicioAsignado)` - Una solicitud puede tener un servicio asignado

**Estados:**
- `pendiente`: Recién creada, sin ofertas
- `con_ofertas`: Tiene ofertas de técnicos
- `asignado`: Cliente seleccionó un técnico
- `en_proceso`: Servicio en ejecución
- `completado`: Servicio terminado
- `cancelado`: Solicitud cancelada

#### **OfertaTecnico** (`oferta_tecnico.js`)
Ofertas de precio que hacen los técnicos a las solicitudes.

**Campos:**
- `id_oferta` (PK, AUTO_INCREMENT)
- `id_solicitud` (FK → SolicitudServicio)
- `id_tecnico` (FK → Tecnico)
- `precio` (DECIMAL(10,2), NOT NULL)
- `mensaje` (TEXT, NULLABLE) - Mensaje del técnico
- `fecha_oferta` (DATE, DEFAULT: NOW)
- `estado` (ENUM: "enviada", "seleccionada", "rechazada", NOT NULL)

**Relaciones:**
- `belongsTo(SolicitudServicio)` - Una oferta pertenece a una solicitud
- `belongsTo(Tecnico)` - Una oferta pertenece a un técnico
- `hasOne(ServicioAsignado)` - Una oferta puede generar un servicio asignado

**Estados:**
- `enviada`: Oferta creada, esperando respuesta
- `seleccionada`: Cliente seleccionó esta oferta
- `rechazada`: Cliente rechazó esta oferta

#### **ServicioAsignado** (`servicio_asignado.js`)
Servicios que fueron asignados a técnicos (cuando cliente selecciona oferta).

**Campos:**
- `id_servicio` (PK, AUTO_INCREMENT)
- `id_solicitud` (FK → SolicitudServicio)
- `id_oferta` (FK → OfertaTecnico)
- `id_tecnico` (FK → Tecnico)
- `fecha_asignacion` (DATE, DEFAULT: NOW)
- `estado` (ENUM: "en_camino", "en_ejecucion", "completado", NOT NULL)

**Relaciones:**
- `belongsTo(SolicitudServicio)` - Un servicio pertenece a una solicitud
- `belongsTo(OfertaTecnico)` - Un servicio proviene de una oferta
- `belongsTo(Tecnico)` - Un servicio es asignado a un técnico
- `hasOne(PagoServicio)` - Un servicio tiene un pago
- `hasMany(Calificacion)` - Un servicio puede tener calificaciones
- `hasMany(Incidencia)` - Un servicio puede tener incidencias
- `hasMany(ChatMensaje)` - Un servicio tiene un chat

**Estados:**
- `en_camino`: Técnico en camino al lugar
- `en_ejecucion`: Técnico trabajando
- `completado`: Servicio terminado

### Modelos de Pagos y Calificaciones

#### **PagoServicio** (`pago_servicio.js`)
Registros de pagos realizados por servicios.

**Campos:**
- `id_pago` (PK, AUTO_INCREMENT)
- `id_servicio` (FK → ServicioAsignado, UNIQUE)
- `stripe_payment_id` (STRING(200), NULLABLE) - ID de pago en Stripe
- `monto_total` (DECIMAL(10,2), NULLABLE) - Precio total
- `comision_empresa` (DECIMAL(10,2), NULLABLE) - 10% de comisión
- `monto_tecnico` (DECIMAL(10,2), NULLABLE) - 90% para técnico
- `estado` (ENUM: "pendiente", "pagado", "fallido", NULLABLE)
- `fecha_pago` (DATE, DEFAULT: NOW)

**Relaciones:**
- `belongsTo(ServicioAsignado)` - Un pago pertenece a un servicio

**Estados:**
- `pendiente`: Pago iniciado, esperando confirmación
- `pagado`: Pago confirmado por Stripe
- `fallido`: Pago falló

#### **Calificacion** (`calificacion.js`)
Calificaciones que los clientes dan a los técnicos después del servicio.

**Campos:**
- `id_calificacion` (PK, AUTO_INCREMENT)
- `id_servicio` (FK → ServicioAsignado)
- `id_cliente` (FK → Cliente)
- `id_tecnico` (FK → Tecnico)
- `puntuacion` (INTEGER, NOT NULL) - 1 a 5 estrellas
- `comentario` (TEXT, NULLABLE)
- `fecha` (DATE, DEFAULT: NOW)

**Relaciones:**
- `belongsTo(ServicioAsignado)` - Una calificación pertenece a un servicio
- `belongsTo(Cliente)` - Una calificación es hecha por un cliente
- `belongsTo(Tecnico)` - Una calificación es para un técnico

**Nota:** Cuando se crea una calificación, se recalcula automáticamente el `calificacion_promedio` del técnico.

### Modelos de Comunicación

#### **ChatMensaje** (`chat_mensaje.js`)
Mensajes del chat entre cliente y técnico durante un servicio.

**Campos:**
- `id_mensaje` (PK, AUTO_INCREMENT)
- `id_servicio` (FK → ServicioAsignado)
- `emisor_id` (FK → Usuario)
- `mensaje` (TEXT, NOT NULL)
- `fecha` (DATE, DEFAULT: NOW)
- `leido` (BOOLEAN, DEFAULT: false)

**Relaciones:**
- `belongsTo(ServicioAsignado)` - Un mensaje pertenece a un servicio
- `belongsTo(Usuario)` - Un mensaje es enviado por un usuario

#### **Notificacion** (`notificacion.js`)
Notificaciones del sistema para usuarios.

**Campos:**
- `id_notificacion` (PK, AUTO_INCREMENT)
- `id_usuario` (FK → Usuario)
- `titulo` (STRING(200), NOT NULL)
- `cuerpo` (TEXT, NOT NULL)
- `fecha_envio` (DATE, DEFAULT: NOW)
- `leido` (BOOLEAN, DEFAULT: false)

**Relaciones:**
- `belongsTo(Usuario)` - Una notificación es para un usuario

### Modelos de Gestión

#### **Incidencia** (`incidencia.js`)
Reportes de problemas o incidencias en servicios.

**Campos:**
- `id_incidencia` (PK, AUTO_INCREMENT)
- `id_servicio` (FK → ServicioAsignado)
- `id_usuario_reporta` (FK → Usuario) - Usuario que reporta
- `descripcion` (TEXT, NOT NULL)
- `fecha_reporte` (DATE, DEFAULT: NOW)
- `estado` (ENUM: "pendiente", "en_revision", "resuelta", NOT NULL)

**Relaciones:**
- `belongsTo(ServicioAsignado)` - Una incidencia pertenece a un servicio
- `belongsTo(Usuario)` - Una incidencia es reportada por un usuario

**Estados:**
- `pendiente`: Recién reportada, sin revisar
- `en_revision`: Admin está revisando
- `resuelta`: Incidencia resuelta

#### **AuditoriaLog** (`auditoria_log.js`)
Logs de auditoría de todas las operaciones del sistema.

**Campos:**
- `id_log` (PK, AUTO_INCREMENT)
- `usuario_id` (FK → Usuario, NULLABLE)
- `accion` (STRING(200), NOT NULL) - Ej: "POST /api/solicitudes"
- `fecha` (DATE, DEFAULT: NOW)
- `detalles` (TEXT, NULLABLE) - JSON con detalles de la acción

**Relaciones:**
- `belongsTo(Usuario)` - Un log pertenece a un usuario (puede ser null)

### Modelos de Relación N:M

#### **TecnicoZona** (`tecnico_zona.js`)
Tabla intermedia para relación N:M entre Técnico y Zona.

**Campos:**
- `id_tecnico_zona` (PK, AUTO_INCREMENT)
- `id_tecnico` (FK → Tecnico, NOT NULL)
- `id_zona` (FK → Zona, NOT NULL)

#### **TecnicoEspecialidad** (`tecnico_especialidad.js`)
Tabla intermedia para relación N:M entre Técnico y Especialidad.

**Campos:**
- `id_tecnico_especialidad` (PK, AUTO_INCREMENT)
- `id_tecnico` (FK → Tecnico, NOT NULL)
- `id_especialidad` (FK → Especialidad, NOT NULL)

#### **TecnicoUbicacion** (`tecnico_ubicacion.js`)
Ubicaciones actuales de los técnicos (actualizadas en tiempo real).

**Campos:**
- `id_ubicacion` (PK, AUTO_INCREMENT)
- `id_tecnico` (FK → Tecnico, NOT NULL)
- `lat` (DECIMAL(10,6), NOT NULL)
- `lon` (DECIMAL(10,6), NOT NULL)
- `direccion_texto` (TEXT, NULLABLE)
- `fecha_actualizacion` (DATE, DEFAULT: NOW)

**Nota:** Este modelo almacena el historial de ubicaciones. Para obtener la ubicación actual, se debe buscar la más reciente.

---

## 🎮 CONTROLADORES

### **auth.controller.js** - Autenticación y Gestión de Usuarios

#### `register(req, res)`
Registra un nuevo usuario en el sistema.

**Proceso:**
1. Valida que el rol sea válido ("cliente", "tecnico", "admin")
2. Verifica que el email no esté registrado
3. Valida campos requeridos (nombre, apellido, email, password)
4. Hashea la contraseña con bcrypt (salt rounds: 10)
5. Crea registro en tabla `Usuario`
6. Crea registro según rol:
   - Si es `cliente`: crea en tabla `Cliente`
   - Si es `tecnico`: crea en tabla `Tecnico` con `estado=false` (requiere validación)
   - Si es `admin`: crea en tabla `Admin`
7. Retorna datos del usuario (sin password)

**Ruta:** `POST /api/auth/register`

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "password": "123456",
  "rol": "cliente",
  "telefono": "1234567890",
  "preferencia": "Prefiero técnicos cercanos"
}
```

#### `login(req, res)`
Inicia sesión de un usuario.

**Proceso:**
1. Valida que email y password estén presentes
2. Busca usuario por email
3. Compara password con hash almacenado (bcrypt)
4. Verifica que `estado=true` (técnicos deshabilitados no pueden hacer login)
5. Genera JWT token (válido 7 días)
6. Genera refresh token (válido 30 días)
7. Retorna tokens y datos del usuario

**Ruta:** `POST /api/auth/login`

**Response:**
```json
{
  "msg": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "rol": "cliente",
    "estado": true
  }
}
```

#### `refreshToken(req, res)`
Renueva los tokens cuando el token de acceso expira.

**Ruta:** `POST /api/auth/refresh-token`

#### `getPerfil(req, res)`
Obtiene el perfil completo del usuario autenticado.

**Ruta:** `GET /api/auth/perfil` (requiere autenticación)

#### `getAllPerfiles(req, res)`
Obtiene todos los usuarios del sistema (solo admin).

**Ruta:** `GET /api/auth/perfiles` (requiere autenticación)

#### `activarTecnico(req, res)` / `desactivarTecnico(req, res)`
Activa/desactiva un técnico.

**Rutas:** 
- `PATCH /api/auth/tecnico/activar/:id`
- `PATCH /api/auth/tecnico/desactivar/:id`

---

### **solicitud.controller.js** - Gestión de Solicitudes

#### `crear(req, res)`
Crea una nueva solicitud de servicio.

**Proceso:**
1. Obtiene `id_cliente` desde `req.user.id_usuario` (JWT)
2. Crea registro en `SolicitudServicio` con `estado="pendiente"`
3. Busca técnicos disponibles de esa categoría
4. Envía notificaciones push a todos los técnicos disponibles
5. Retorna solicitud creada

**Ruta:** `POST /api/solicitudes` (requiere autenticación, rol: cliente)

#### `listarPorCliente(req, res)`
Lista todas las solicitudes del cliente autenticado.

**Ruta:** `GET /api/solicitudes` (requiere autenticación, rol: cliente)

---

### **oferta.controller.js** - Gestión de Ofertas

#### `crear(req, res)`
Crea una oferta de precio para una solicitud.

**Proceso:**
1. Obtiene `id_tecnico` desde `req.user.id_usuario` (JWT)
2. Valida que la solicitud exista
3. Verifica que el técnico no haya enviado ya una oferta
4. Crea registro en `OfertaTecnico` con `estado="enviada"`
5. Envía notificación push al cliente
6. Retorna oferta creada

**Ruta:** `POST /api/ofertas` (requiere autenticación, rol: tecnico)

#### `listarPorSolicitud(req, res)`
Lista todas las ofertas de una solicitud.

**Ruta:** `GET /api/ofertas/solicitud/:id_solicitud` (requiere autenticación)

---

### **servicio.controller.js** - Gestión de Servicios Asignados

#### `asignar(req, res)`
Asigna un servicio a un técnico (cliente selecciona oferta).

**Proceso:**
1. Obtiene `id_cliente` desde `req.user.id_usuario` (JWT)
2. Busca la oferta
3. Verifica que la solicitud pertenezca al cliente
4. Verifica que la solicitud no tenga ya un servicio asignado
5. Crea registro en `ServicioAsignado` con `estado="en_camino"`
6. Actualiza `SolicitudServicio.estado` a `"asignado"`
7. Envía notificación push al técnico
8. Retorna servicio creado

**Ruta:** `POST /api/servicios/asignar` (requiere autenticación, rol: cliente)

#### `cambiarEstado(req, res)`
Cambia el estado de un servicio (solo técnico dueño).

**Ruta:** `PUT /api/servicios/:id_servicio/estado` (requiere autenticación, rol: tecnico)

---

### **pago.controller.js** - Gestión de Pagos

#### `crearCheckout(req, res)`
Crea una sesión de pago en Stripe.

**Proceso:**
1. Obtiene el precio desde la oferta ganadora
2. Calcula comisión (10% del precio)
3. Calcula monto para técnico (90% del precio)
4. Crea registro en `PagoServicio` con `estado="pendiente"`
5. Crea sesión de Stripe Checkout
6. Retorna URL de Stripe para redirigir al cliente

**Ruta:** `POST /api/pago/checkout` (requiere autenticación)

#### `webhook(req, res)`
Webhook de Stripe que se ejecuta cuando un pago se completa.

**Proceso:**
1. Verifica la firma del webhook (seguridad)
2. Si el evento es `checkout.session.completed`:
   - Actualiza `PagoServicio` con `stripe_payment_id` y `estado="pagado"`
   - Envía notificaciones push al técnico y cliente

**Ruta:** `POST /api/pago/webhook` (NO requiere autenticación)

---

### **calificacion.controller.js** - Gestión de Calificaciones

#### `crear(req, res)`
Crea una calificación para un servicio.

**Proceso:**
1. Verifica que el servicio esté `completado`
2. Verifica que el pago esté `pagado`
3. Verifica que no haya calificación previa
4. Crea registro en `Calificacion`
5. Recalcula el promedio de calificaciones del técnico
6. Actualiza `Tecnico.calificacion_promedio`

**Ruta:** `POST /api/calificaciones` (requiere autenticación, rol: cliente)

---

### **chat.controller.js** - Gestión de Chat

#### `obtenerHistorial(req, res)`
Obtiene el historial de mensajes de un servicio.

**Ruta:** `GET /api/chat/:id_servicio` (requiere autenticación)

#### `enviarMensaje(req, res)`
Envía un mensaje en el chat.

**Ruta:** `POST /api/chat` (requiere autenticación)

#### `marcarLeidos(req, res)`
Marca todos los mensajes de un servicio como leídos.

**Ruta:** `PUT /api/chat/leidos/:id_servicio` (requiere autenticación)

---

### **incidencia.controller.js** - Gestión de Incidencias

#### `crear(req, res)`
Crea una incidencia (reporte de problema).

**Proceso:**
1. Crea registro en `Incidencia` con `estado="pendiente"`
2. Busca todos los usuarios admin
3. Envía notificaciones push a todos los admins
4. Crea log de auditoría

**Ruta:** `POST /api/incidencias` (requiere autenticación)

#### `listarTodas(req, res)`
Lista todas las incidencias (solo admin).

**Ruta:** `GET /api/incidencias` (requiere autenticación, rol: admin)

#### `cambiarEstado(req, res)`
Cambia el estado de una incidencia (solo admin).

**Ruta:** `PUT /api/incidencias/estado` (requiere autenticación, rol: admin)

---

### **notificacion.controller.js** - Gestión de Notificaciones

#### `listar(req, res)`
Lista las notificaciones del usuario autenticado.

**Ruta:** `GET /api/notificaciones` (requiere autenticación)

#### `enviar(req, res)`
Envía una notificación manualmente (solo admin).

**Ruta:** `POST /api/notificaciones` (requiere autenticación, rol: admin)

---

### **categoria.controller.js** - Gestión de Categorías

CRUD completo de categorías (solo admin para crear/editar/eliminar).

**Rutas:**
- `POST /api/categorias` (admin)
- `GET /api/categorias` (pública)
- `GET /api/categorias/:id` (pública)
- `PUT /api/categorias/:id` (admin)
- `DELETE /api/categorias/:id` (admin)

---

### **zona.controller.js** - Gestión de Zonas

Similar a `categoria.controller.js` pero para zonas.

---

### **especialidad.controller.js** - Gestión de Especialidades

Similar a `categoria.controller.js` pero para especialidades.

---

### **ubicacion.controller.js** - Gestión de Ubicaciones

#### `actualizarUbicacion(req, res)`
Actualiza la ubicación actual del técnico.

**Ruta:** `POST /api/ubicacion/actualizar` (requiere autenticación, rol: tecnico)

---

### **auditoria.controller.js** - Gestión de Auditoría

#### `listar(req, res)`
Lista todos los logs de auditoría (solo admin).

**Ruta:** `GET /api/auditoria` (requiere autenticación, rol: admin)

---

## 👥 PROCESOS POR ROL

### 🔵 PROCESO COMPLETO DEL CLIENTE

#### 1. Registro
```
POST /api/auth/register
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "password": "123456",
  "rol": "cliente",
  "preferencia": "Prefiero técnicos cercanos"
}
→ Usuario + Cliente creados
```

#### 2. Login
```
POST /api/auth/login
→ Token JWT generado
→ Cliente guarda tokens
```

#### 3. Crear Solicitud de Servicio
```
POST /api/solicitudes
{
  "id_categoria": 1,
  "descripcion": "Necesito reparar una tubería",
  "lat": -17.3935,
  "lon": -66.1570
}
→ SolicitudServicio creada (estado: "pendiente")
→ Notificaciones push enviadas a técnicos
```

#### 4. Ver Ofertas Recibidas
```
GET /api/ofertas/solicitud/:id_solicitud
→ Lista de ofertas ordenadas por precio
```

#### 5. Asignar Servicio (Seleccionar Oferta)
```
POST /api/servicios/asignar
{
  "id_oferta": 1
}
→ ServicioAsignado creado (estado: "en_camino")
→ SolicitudServicio.estado = "asignado"
→ Técnico notificado
```

#### 6. Chat con Técnico (Socket.IO)
```
Socket.IO → joinRoom { id_servicio: 1 }
Socket.IO → enviarMensaje { mensaje: "Hola" }
→ Mensaje guardado en BD
→ Mensaje emitido en tiempo real
→ Push notification al técnico
```

#### 7. Pagar Servicio
```
POST /api/pago/checkout
{
  "id_servicio": 1
}
→ Stripe Checkout Session creada
→ Cliente redirigido a Stripe
→ Cliente paga
→ Webhook → PagoServicio.estado = "pagado"
```

#### 8. Calificar Servicio
```
POST /api/calificaciones
{
  "id_servicio": 1,
  "puntuacion": 5,
  "comentario": "Excelente trabajo"
}
→ Calificacion creada
→ Tecnico.calificacion_promedio recalculado
```

#### 9. Reportar Incidencia
```
POST /api/incidencias
{
  "id_servicio": 1,
  "descripcion": "El técnico no llegó a la hora acordada"
}
→ Incidencia creada
→ Admins notificados
```

---

### 🔧 PROCESO COMPLETO DEL TÉCNICO

#### 1. Registro (Requiere Validación)
```
POST /api/auth/register
{
  "rol": "tecnico",
  "descripcion": "Técnico con 5 años de experiencia"
}
→ Usuario + Tecnico creados
→ Tecnico.estado = false (requiere validación)
→ NO puede hacer login hasta activación
```

#### 2. Admin Activa Técnico
```
Admin → PATCH /api/auth/tecnico/activar/:id
→ Tecnico.estado = true
→ Ahora puede hacer login
```

#### 3. Login
```
POST /api/auth/login
→ Token JWT generado
```

#### 4. Actualizar Ubicación
```
POST /api/ubicacion/actualizar
{
  "lat": -17.3935,
  "lon": -66.1570
}
→ TecnicoUbicacion creada
```

#### 5. Recibir Notificación de Solicitud
```
Cliente crea solicitud
→ Notificación push recibida
```

#### 6. Crear Oferta
```
POST /api/ofertas
{
  "id_solicitud": 1,
  "precio": 150.00,
  "mensaje": "Puedo hacerlo hoy mismo"
}
→ OfertaTecnico creada
→ Cliente notificado
```

#### 7. Ser Seleccionado
```
Cliente selecciona oferta
→ ServicioAsignado creado
→ Notificación: "Has sido seleccionado"
```

#### 8. Actualizar Estado del Servicio
```
PUT /api/servicios/:id_servicio/estado
{
  "estado": "en_ejecucion"
}
→ ServicioAsignado.estado actualizado
→ Cliente notificado
```

#### 9. Chat con Cliente
```
Socket.IO → joinRoom { id_servicio: 1 }
Socket.IO → enviarMensaje
→ Mensaje en tiempo real
```

#### 10. Recibir Pago
```
Cliente paga
→ Webhook ejecutado
→ PagoServicio.estado = "pagado"
→ Notificación: "Pago recibido"
```

#### 11. Ver Calificaciones
```
GET /api/calificaciones/tecnico/:id_tecnico
→ Lista de calificaciones
```

---

### 👨‍💼 PROCESO COMPLETO DEL ADMINISTRADOR

#### 1. Registro
```
POST /api/auth/register
{
  "rol": "admin"
}
→ Usuario + Admin creados
```

#### 2. Login
```
POST /api/auth/login
→ Token JWT generado
```

#### 3. Activar/Desactivar Técnicos
```
PATCH /api/auth/tecnico/activar/:id
PATCH /api/auth/tecnico/desactivar/:id
→ Cambia estado de técnico
```

#### 4. Gestionar Categorías
```
POST /api/categorias
PUT /api/categorias/:id
DELETE /api/categorias/:id
→ CRUD de categorías
```

#### 5. Gestionar Zonas
```
POST /api/zonas
PUT /api/zonas/:id
DELETE /api/zonas/:id
→ CRUD de zonas
```

#### 6. Gestionar Especialidades
```
POST /api/especialidades
PUT /api/especialidades/:id
DELETE /api/especialidades/:id
→ CRUD de especialidades
```

#### 7. Gestionar Incidencias
```
GET /api/incidencias
PUT /api/incidencias/estado
→ Ver y resolver incidencias
```

#### 8. Ver Auditoría
```
GET /api/auditoria
→ Lista todos los logs
```

#### 9. Ver Todos los Perfiles
```
GET /api/auth/perfiles
→ Lista todos los usuarios
```

#### 10. Enviar Notificaciones
```
POST /api/notificaciones
{
  "id_usuario": 1,
  "titulo": "Bienvenido",
  "cuerpo": "Gracias por usar nuestro servicio"
}
→ Notificación enviada
```

---

## 💬 SISTEMA DE CHAT Y SOCKET.IO

### Configuración de Socket.IO

**Archivo:** `server.js`

```javascript
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Registrar sockets
const chatSocket = require("./src/socket/chat.socket");
const notiSocket = require("./src/socket/notificacion.socket");

chatSocket(io);
notiSocket(io);
```

### Chat Socket (`chat.socket.js`)

#### Eventos del Cliente:

1. **`joinRoom`** - Unirse a sala del servicio
```javascript
socket.emit("joinRoom", { id_servicio: 1 });
// Usuario unido a sala: "servicio_1"
```

2. **`enviarMensaje`** - Enviar mensaje
```javascript
socket.emit("enviarMensaje", {
  id_servicio: 1,
  emisor_id: 1,
  mensaje: "Hola, ¿a qué hora llegas?"
});
// Mensaje guardado en BD
// Mensaje emitido a todos en sala "servicio_1"
// Push notification enviada
```

3. **`typing`** - Indicar que está escribiendo
```javascript
socket.emit("typing", {
  id_servicio: 1,
  usuario: "Juan"
});
```

#### Eventos del Servidor:

1. **`nuevoMensaje`** - Nuevo mensaje recibido
```javascript
socket.on("nuevoMensaje", (mensaje) => {
  // Mostrar mensaje en UI
});
```

### Notificación Socket (`notificacion.socket.js`)

#### Eventos del Cliente:

1. **`authUser`** - Autenticar usuario en socket
```javascript
socket.emit("authUser", { id_usuario: 1 });
// Usuario unido a sala: "user_1"
```

#### Eventos del Servidor:

1. **`nuevaNotificacion`** - Nueva notificación recibida
```javascript
socket.on("nuevaNotificacion", (notificacion) => {
  // Mostrar notificación en UI
});
```

### Flujo Completo del Chat

```
1. Cliente y Técnico se conectan a Socket.IO
   → socket.id generado para cada uno

2. Ambos se unen a la sala del servicio
   → socket.emit("joinRoom", { id_servicio: 1 })
   → Ambos en sala "servicio_1"

3. Cliente envía mensaje
   → socket.emit("enviarMensaje", { id_servicio: 1, mensaje: "Hola" })
   → Servidor:
     a. Guarda mensaje en BD (ChatMensaje)
     b. Emite a todos en sala: io.to("servicio_1").emit("nuevoMensaje", mensaje)
     c. Busca receptor (técnico)
     d. Envía push notification
     e. Crea Notificacion en BD

4. Técnico recibe mensaje
   → Socket.IO: mensaje en tiempo real
   → Push notification: si no está en app

5. Técnico responde
   → Mismo proceso inverso

6. Marcar mensajes como leídos
   → PUT /api/chat/leidos/:id_servicio
   → Actualiza leido: true para mensajes del otro usuario
```

---

## 🔔 SISTEMA DE NOTIFICACIONES

### Utilidad de Notificaciones (`notificacion.util.js`)

#### `enviarNotificacion(id_usuario, titulo, cuerpo)`

**Proceso:**
1. Busca usuario en BD
2. Crea registro en `Notificacion` (BD)
3. Si usuario tiene `token_real`, envía push via Firebase
4. Si Socket.IO está disponible, emite a sala `user_<id_usuario>`
5. Retorna notificación creada

**Uso:**
```javascript
const { enviarNotificacion } = require("./utils/notificacion.util");

await enviarNotificacion(
  1, // id_usuario
  "Nueva oferta recibida",
  "Un técnico te ofertó Bs. 150"
);
```

### Firebase (`firebase.js`)

**Configuración:**
- Inicializa Firebase Admin SDK
- Usa variables de entorno o archivo JSON
- Exporta función `enviarNotificacionPush`

**Función:**
```javascript
async function enviarNotificacionPush(token, notification) {
  await admin.messaging().send({
    token,
    notification: {
      title: notification.title,
      body: notification.body
    }
  });
}
```

### Tipos de Notificaciones

1. **Nueva Solicitud** → Técnicos disponibles
2. **Nueva Oferta** → Cliente
3. **Servicio Asignado** → Técnico
4. **Estado Actualizado** → Cliente/Técnico
5. **Pago Recibido** → Técnico
6. **Pago Completado** → Cliente
7. **Nueva Incidencia** → Admins
8. **Incidencia Actualizada** → Usuario que reportó
9. **Nuevo Mensaje** → Cliente/Técnico

---

## 💳 SISTEMA DE PAGOS (STRIPE)

### Flujo de Pago

```
1. Cliente inicia pago
   → POST /api/pago/checkout
   → PagoServicio creado (estado: "pendiente")
   → Stripe Checkout Session creada
   → URL de Stripe retornada

2. Cliente redirigido a Stripe
   → Página de pago de Stripe
   → Cliente ingresa datos de tarjeta
   → Cliente confirma pago

3. Stripe procesa pago
   → Webhook ejecutado
   → POST /api/pago/webhook
   → Evento: "checkout.session.completed"

4. Backend procesa webhook
   → Verifica firma de Stripe (seguridad)
   → Obtiene id_servicio de metadata
   → Actualiza PagoServicio:
     - stripe_payment_id = session.payment_intent
     - estado = "pagado"
   → Notificaciones push enviadas

5. Cliente y Técnico notificados
   → Cliente: "Pago completado"
   → Técnico: "Pago recibido"
```

### Cálculo de Comisiones

```javascript
const precio = Number(oferta.precio);        // Ej: 100
const comision = precio * 0.10;              // 10% = 10
const neto = precio - comision;               // 90% = 90

// Guardado en PagoServicio:
monto_total: 100
comision_empresa: 10
monto_tecnico: 90
```

### Configuración de Stripe

**Archivo:** `config/stripe.js`
```javascript
const Stripe = require("stripe");
module.exports = new Stripe(process.env.STRIPE_SECRET_KEY);
```

**Variables de entorno requeridas:**
- `STRIPE_SECRET_KEY`: Clave secreta de Stripe
- `STRIPE_WEBHOOK_SECRET`: Secreto del webhook (para verificar firma)
- `FRONTEND_URL`: URL del frontend (para success/cancel URLs)

---

## 🤖 MACHINE LEARNING

### Arquitectura del Sistema ML

El sistema ML funciona como un microservicio independiente en Flask (puerto 5005).

### Archivos del Sistema ML

#### 1. `build_dataset.py` - Construcción del Dataset

**Propósito:** Genera el dataset de entrenamiento desde PostgreSQL.

**Proceso:**
1. Consulta `solicitud_servicio` (solicitudes completadas)
2. Consulta `tecnico` + `tecnico_ubicacion` (técnicos disponibles)
3. Consulta `calificacion` (ratings históricos)
4. Consulta `oferta_tecnico` (precios históricos)
5. Consulta `servicio_asignado` (historial de contrataciones)
6. Para cada combinación solicitud-técnico:
   - Calcula `distancia_km` (Haversine)
   - Obtiene `rating_promedio` del técnico
   - Obtiene `historico_rating` (promedio de calificaciones)
   - Obtiene `cantidad_calificaciones`
   - Obtiene `precio_promedio` (de ofertas)
   - Obtiene `ofertas_totales`
   - Obtiene `servicios_realizados`
   - Obtiene `disponibilidad`
   - Marca `target` (1 si fue asignado, 0 si no)
7. Guarda en `dataset_tecnicos.csv`

**Ejecución:**
```bash
python build_dataset.py
```

**Resultado:** `dataset_tecnicos.csv` con todas las combinaciones y features.

#### 2. `train_model.py` - Entrenamiento del Modelo

**Propósito:** Entrena el modelo XGBoost Ranker.

**Proceso:**
1. Lee `dataset_tecnicos.csv`
2. Define 8 features:
   - `distancia_km`
   - `rating_promedio`
   - `historico_rating`
   - `cantidad_calificaciones`
   - `precio_promedio`
   - `ofertas_totales`
   - `servicios_realizados`
   - `disponibilidad`
3. Define target (1 o 0)
4. Agrupa por `id_solicitud` (para ranking)
5. Normaliza features con `StandardScaler`
6. Entrena `XGBRanker` con:
   - `objective="rank:pairwise"`
   - `learning_rate=0.1`
   - `n_estimators=200`
   - `max_depth=6`
7. Guarda `modelo_recomendacion.pkl`
8. Guarda `scaler.pkl`

**Ejecución:**
```bash
python train_model.py
```

**Resultado:** Modelo entrenado listo para usar.

#### 3. `recommender.py` - Predicción en Tiempo Real

**Propósito:** Recomienda técnicos para una solicitud nueva.

**Función:** `recomendar_tecnicos(id_solicitud)`

**Proceso:**
1. Obtiene solicitud de BD
2. Busca técnicos disponibles
3. Para cada técnico, calcula features en tiempo real
4. Normaliza features con `scaler`
5. Predice `score` con `modelo`
6. Ordena técnicos por `score` DESC (mejores primero)
7. Retorna lista ordenada

**Uso:**
```python
from recommender import recomendar_tecnicos

resultados = recomendar_tecnicos(123)  # id_solicitud
```

#### 4. `app.py` - API Flask

**Endpoints:**

1. **`GET /`** - Información del servicio
2. **`POST /recomendar`** - Recomendar técnicos
   ```json
   {
     "id_solicitud": 123
   }
   ```
3. **`GET /health`** - Estado del servicio

### Integración con Node.js (Opcional)

Actualmente el ML funciona independientemente. Para integrarlo:

```javascript
const axios = require("axios");

async function obtenerRecomendaciones(id_solicitud) {
  const response = await axios.post("http://localhost:5005/recomendar", {
    id_solicitud
  });
  return response.data.tecnicos_recomendados;
}
```

### Datos que Recibe el ML

El ML recibe:
- **Input:** `id_solicitud` (número)
- **Proceso interno:**
  - Consulta BD para obtener datos de la solicitud
  - Consulta BD para obtener técnicos disponibles
  - Calcula features en tiempo real
  - Predice scores
- **Output:** Lista de técnicos ordenados por score

### Features del Modelo

1. **`distancia_km`**: Distancia entre cliente y técnico (Haversine)
2. **`rating_promedio`**: Calificación promedio actual del técnico
3. **`historico_rating`**: Promedio histórico de calificaciones
4. **`cantidad_calificaciones`**: Total de calificaciones recibidas
5. **`precio_promedio`**: Precio promedio de ofertas del técnico
6. **`ofertas_totales`**: Total de ofertas realizadas
7. **`servicios_realizados`**: Total de servicios completados
8. **`disponibilidad`**: Si está disponible (1 o 0)

---

## 🔒 MIDDLEWARE Y SEGURIDAD

### auth.middleware.js

**Propósito:** Verifica autenticación mediante JWT.

**Proceso:**
1. Extrae token del header `Authorization: Bearer <token>`
2. Verifica JWT con `jwt.verify()`
3. Busca usuario en BD
4. Verifica que `estado=true`
5. Agrega `req.user` con datos del usuario
6. Si falla → 401 Unauthorized

**Uso:**
```javascript
const auth = require("./middleware/auth.middleware");
router.get("/ruta", auth, controller.funcion);
```

### role.middleware.js

**Propósito:** Verifica que el usuario tenga el rol correcto.

**Proceso:**
1. Obtiene `req.user.rol` (seteado por auth.middleware)
2. Compara con roles permitidos
3. Si no coincide → 403 Forbidden

**Uso:**
```javascript
const role = require("./middleware/role.middleware");
router.post("/ruta", auth, role("admin"), controller.funcion);
router.get("/ruta", auth, role("cliente", "tecnico"), controller.funcion);
```

### auditoria.middleware.js

**Propósito:** Registra logs de auditoría automáticamente.

**Proceso:**
1. Intercepta requests POST, PUT, PATCH, DELETE
2. Espera a que la respuesta termine (`res.on("finish")`)
3. Crea log en `AuditoriaLog` con:
   - `usuario_id`: ID del usuario (si está autenticado)
   - `accion`: Método HTTP + URL
   - `detalles`: JSON con body, params, query, statusCode
4. No interrumpe el flujo si falla

**Nota:** Actualmente está comentado en `app.js`, pero puede activarse.

---

## 🛠️ UTILIDADES Y SERVICIOS

### generateJWT.js

**Funciones:**
- `generateToken(data)`: Genera JWT token (7 días)
- `generateRefreshToken(data)`: Genera refresh token (30 días)
- `verifyToken(token)`: Verifica y decodifica token

### firebase.js

**Función:**
- `enviarNotificacionPush(token, notification)`: Envía push notification via Firebase

### notificacion.util.js

**Función:**
- `enviarNotificacion(id_usuario, titulo, cuerpo)`: Envía notificación completa (BD + Push + Socket.IO)

### haversine.js

**Función:**
- `haversine(lat1, lon1, lat2, lon2)`: Calcula distancia entre dos puntos geográficos (km)

### auditoria.util.js

**Función:**
- `registrar(usuario_id, accion, detalles)`: Registra log de auditoría manualmente

---

## 📝 NOTAS FINALES

### Variables de Entorno Requeridas

```env
# Base de Datos
DB_NAME=smartservice_db
DB_USER=postgres
DB_PASS=password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRES=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000

# Firebase (opcional)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Puerto
PORT=3000
```

### Orden de Flujo de un Servicio

1. Cliente crea solicitud → `SolicitudServicio` (estado: "pendiente")
2. Técnicos crean ofertas → `OfertaTecnico` (estado: "enviada")
3. Cliente selecciona oferta → `ServicioAsignado` (estado: "en_camino")
4. Técnico actualiza estado → "en_ejecucion" → "completado"
5. Cliente paga → `PagoServicio` (estado: "pagado")
6. Cliente califica → `Calificacion` + `Tecnico.calificacion_promedio` actualizado

### Estados Importantes

- **Usuario.estado**: false = deshabilitado (técnicos no pueden hacer login)
- **SolicitudServicio.estado**: pendiente → con_ofertas → asignado → completado
- **ServicioAsignado.estado**: en_camino → en_ejecucion → completado
- **PagoServicio.estado**: pendiente → pagado / fallido
- **Incidencia.estado**: pendiente → en_revision → resuelta

### Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- JWT tokens para autenticación
- Verificación de roles en cada ruta
- Validación de ownership (cliente solo puede asignar sus solicitudes)
- Stripe webhook signature verification

---

## 🎯 CONCLUSIÓN

Este sistema es una plataforma completa de servicios técnicos que incluye:

- ✅ Autenticación y autorización por roles
- ✅ Gestión completa de solicitudes y servicios
- ✅ Sistema de ofertas y asignación
- ✅ Chat en tiempo real con Socket.IO
- ✅ Notificaciones push con Firebase
- ✅ Pagos integrados con Stripe
- ✅ Sistema de calificaciones
- ✅ Gestión de incidencias
- ✅ Auditoría de operaciones
- ✅ Machine Learning para recomendaciones

Cada componente está diseñado para trabajar de forma independiente pero integrada, permitiendo escalabilidad y mantenibilidad.

