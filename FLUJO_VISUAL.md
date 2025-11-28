# 🔄 FLUJO VISUAL DEL SISTEMA SMART SERVICE BACKEND

## 📊 ARQUITECTURA GENERAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend/Mobile)                    │
│                    React Native / Web Application                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTP/REST API
                               │ Socket.IO (WebSocket)
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    SMART SERVICE BACKEND (Node.js)                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (server.js)                                │  │
│  │  - Puerto: 3000 (default)                                       │  │
│  │  - Socket.IO integrado                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Routes      │  │ Controllers  │  │   Models      │            │
│  │  (Rutas)     │─▶│ (Lógica)     │─▶│  (Sequelize)  │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Middleware  │  │   Utils      │  │   Services   │            │
│  │  (Auth/Role) │  │  (Helpers)   │  │  (Business) │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
    │  PostgreSQL DB   │  │  Firebase     │  │  Machine Learning│
    │  (Datos)         │  │  (Push Notif) │  │  (Flask API)     │
    └─────────────────┘  └──────────────┘  └──────────────────┘
                               │
                               │
                    ┌──────────▼──────────┐
                    │   Stripe API        │
                    │   (Pagos)           │
                    └────────────────────┘
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ POST /api/auth/register
       │ { nombre, apellido, email, password, rol }
       ▼
┌─────────────────────────────────────┐
│  auth.controller.js → register()    │
│  ┌───────────────────────────────┐ │
│  │ 1. Valida rol (cliente/       │ │
│  │    tecnico/admin)             │ │
│  │ 2. Verifica email único       │ │
│  │ 3. Hashea password (bcrypt)   │ │
│  │ 4. Crea Usuario               │ │
│  │ 5. Crea registro según rol:   │ │
│  │    - Cliente → tabla cliente   │ │
│  │    - Tecnico → tabla tecnico  │ │
│  │      (estado=false)           │ │
│  │    - Admin → tabla admin      │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               │ Usuario creado
               ▼
┌─────────────────────────────────────┐
│  POST /api/auth/login               │
│  { email, password }                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  auth.controller.js → login()      │
│  ┌───────────────────────────────┐ │
│  │ 1. Busca usuario por email    │ │
│  │ 2. Compara password (bcrypt)   │ │
│  │ 3. Verifica estado=true        │ │
│  │ 4. Genera JWT token            │ │
│  │ 5. Genera refresh token        │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               │ { token, refreshToken, usuario }
               ▼
┌─────────────────────────────────────┐
│  Cliente guarda tokens               │
│  Usa token en:                       │
│  Authorization: Bearer <token>       │
└─────────────────────────────────────┘
```

---

## 👤 FLUJO COMPLETO DEL CLIENTE

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESO COMPLETO DEL CLIENTE                 │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRO
   ┌──────────────┐
   │ POST /api/   │
   │ auth/register│
   └──────┬───────┘
          │ { nombre, apellido, email, password, rol: "cliente", preferencia }
          ▼
   ┌─────────────────────────────────────┐
   │ auth.controller.register()          │
   │ → Crea Usuario + Cliente            │
   └─────────────────────────────────────┘

2. CREAR SOLICITUD DE SERVICIO
   ┌──────────────┐
   │ POST /api/   │
   │ solicitudes  │
   └──────┬───────┘
          │ { id_categoria, descripcion, ubicacion_texto, lat, lon }
          ▼
   ┌─────────────────────────────────────┐
   │ solicitud.controller.crear()         │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Crea SolicitudServicio        │ │
   │ │    estado: "pendiente"           │ │
   │ │ 2. Busca técnicos disponibles    │ │
   │ │ 3. Envía notificaciones push    │ │
   │ │    a técnicos disponibles       │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
          │
          │ Solicitud creada
          ▼
   ┌─────────────────────────────────────┐
   │ Técnicos reciben notificación       │
   │ Pueden crear ofertas                 │
   └─────────────────────────────────────┘

3. VER OFERTAS RECIBIDAS
   ┌──────────────┐
   │ GET /api/    │
   │ ofertas/     │
   │ solicitud/:id│
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ oferta.controller.listarPorSolicitud│
   │ → Retorna ofertas ordenadas por     │
   │   precio (ASC)                      │
   └─────────────────────────────────────┘

4. ASIGNAR SERVICIO (Seleccionar oferta)
   ┌──────────────┐
   │ POST /api/   │
   │ servicios/   │
   │ asignar      │
   └──────┬───────┘
          │ { id_oferta }
          ▼
   ┌─────────────────────────────────────┐
   │ servicio.controller.asignar()      │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Valida oferta                 │ │
   │ │ 2. Crea ServicioAsignado         │ │
   │ │    estado: "en_camino"           │ │
   │ │ 3. Actualiza solicitud           │ │
   │ │    estado: "asignado"            │ │
   │ │ 4. Notifica al técnico           │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

5. CHAT CON TÉCNICO
   ┌──────────────┐
   │ Socket.IO    │
   │ joinRoom     │
   └──────┬───────┘
          │ { id_servicio }
          ▼
   ┌─────────────────────────────────────┐
   │ chat.socket.js                      │
   │ Usuario se une a sala:              │
   │ "servicio_<id_servicio>"            │
   └─────────────────────────────────────┘
          │
          │ enviarMensaje
          ▼
   ┌─────────────────────────────────────┐
   │ 1. Guarda mensaje en BD              │
   │ 2. Emite a todos en la sala          │
   │ 3. Envía push notification           │
   └─────────────────────────────────────┘

6. PAGAR SERVICIO
   ┌──────────────┐
   │ POST /api/   │
   │ pago/checkout│
   └──────┬───────┘
          │ { id_servicio }
          ▼
   ┌─────────────────────────────────────┐
   │ pago.controller.crearCheckout()    │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Obtiene servicio             │ │
   │ │ 2. Calcula precio desde oferta  │ │
   │ │ 3. Calcula comisión (10%)       │ │
   │ │ 4. Crea PagoServicio            │ │
   │ │    estado: "pendiente"          │ │
   │ │ 5. Crea Stripe Checkout Session │ │
   │ └─────────────────────────────────┘ │
   └──────────────┬──────────────────────┘
                  │
                  │ URL de Stripe
                  ▼
   ┌─────────────────────────────────────┐
   │ Cliente paga en Stripe               │
   └──────────────┬───────────────────────┘
                  │
                  │ Webhook Stripe
                  ▼
   ┌─────────────────────────────────────┐
   │ pago.controller.webhook()            │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Verifica firma Stripe        │ │
   │ │ 2. Actualiza PagoServicio        │ │
   │ │    estado: "pagado"              │ │
   │ │ 3. Notifica técnico y cliente   │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

7. CALIFICAR SERVICIO
   ┌──────────────┐
   │ POST /api/   │
   │ calificaciones│
   └──────┬───────┘
          │ { id_servicio, puntuacion, comentario }
          ▼
   ┌─────────────────────────────────────┐
   │ calificacion.controller.crear()     │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Verifica servicio completado │ │
   │ │ 2. Verifica pago realizado      │ │
   │ │ 3. Crea Calificacion            │ │
   │ │ 4. Recalcula promedio técnico   │ │
   │ │    (actualiza Tecnico)          │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

8. REPORTAR INCIDENCIA
   ┌──────────────┐
   │ POST /api/   │
   │ incidencias  │
   └──────┬───────┘
          │ { id_servicio, descripcion }
          ▼
   ┌─────────────────────────────────────┐
   │ incidencia.controller.crear()       │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Crea Incidencia              │ │
   │ │    estado: "pendiente"          │ │
   │ │ 2. Notifica a todos los admins  │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
```

---

## 🔧 FLUJO COMPLETO DEL TÉCNICO

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESO COMPLETO DEL TÉCNICO                  │
└─────────────────────────────────────────────────────────────────┘

1. REGISTRO (Requiere validación admin)
   ┌──────────────┐
   │ POST /api/   │
   │ auth/register│
   └──────┬───────┘
          │ { nombre, apellido, email, password, rol: "tecnico", descripcion }
          ▼
   ┌─────────────────────────────────────┐
   │ auth.controller.register()          │
   │ → Crea Usuario + Tecnico            │
   │ → estado: false (requiere validación)│
   └─────────────────────────────────────┘
          │
          │ Espera validación del admin
          ▼
   ┌─────────────────────────────────────┐
   │ Admin activa técnico                │
   │ PATCH /api/auth/tecnico/activar/:id │
   │ → estado: true                      │
   └─────────────────────────────────────┘

2. ACTUALIZAR UBICACIÓN
   ┌──────────────┐
   │ POST /api/   │
   │ ubicacion/   │
   │ actualizar   │
   └──────┬───────┘
          │ { lat, lon, direccion_texto }
          ▼
   ┌─────────────────────────────────────┐
   │ ubicacion.controller.              │
   │ actualizarUbicacion()              │
   │ → Crea TecnicoUbicacion            │
   │ → Guarda ubicación actual          │
   └─────────────────────────────────────┘

3. RECIBIR NOTIFICACIÓN DE SOLICITUD
   ┌─────────────────────────────────────┐
   │ Cliente crea solicitud              │
   │ → Sistema notifica técnicos         │
   │   disponibles de esa categoría      │
   └──────────────┬──────────────────────┘
                  │
                  │ Notificación push recibida
                  ▼
   ┌─────────────────────────────────────┐
   │ Técnico ve solicitud                │
   │ Puede crear oferta                  │
   └─────────────────────────────────────┘

4. CREAR OFERTA
   ┌──────────────┐
   │ POST /api/   │
   │ ofertas     │
   └──────┬───────┘
          │ { id_solicitud, precio, mensaje }
          ▼
   ┌─────────────────────────────────────┐
   │ oferta.controller.crear()          │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Valida solicitud existe      │ │
   │ │ 2. Verifica no haya oferta previa│ │
   │ │ 3. Crea OfertaTecnico          │ │
   │ │    estado: "enviada"            │ │
   │ │ 4. Notifica al cliente         │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

5. SER SELECCIONADO (Cliente asigna servicio)
   ┌─────────────────────────────────────┐
   │ Cliente selecciona oferta           │
   │ → Crea ServicioAsignado             │
   └──────────────┬──────────────────────┘
                  │
                  │ Notificación recibida
                  ▼
   ┌─────────────────────────────────────┐
   │ Técnico recibe notificación:         │
   │ "Has sido seleccionado"              │
   └─────────────────────────────────────┘

6. ACTUALIZAR ESTADO DEL SERVICIO
   ┌──────────────┐
   │ PUT /api/    │
   │ servicios/   │
   │ :id/estado   │
   └──────┬───────┘
          │ { estado: "en_camino" | "en_ejecucion" | "completado" }
          ▼
   ┌─────────────────────────────────────┐
   │ servicio.controller.cambiarEstado()│
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Valida estado permitido      │ │
   │ │ 2. Verifica es su servicio      │ │
   │ │ 3. Actualiza estado             │ │
   │ │ 4. Notifica al cliente          │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

7. CHAT CON CLIENTE
   ┌──────────────┐
   │ Socket.IO   │
   │ joinRoom    │
   └──────┬───────┘
          │ { id_servicio }
          ▼
   ┌─────────────────────────────────────┐
   │ chat.socket.js                      │
   │ Técnico se une a sala del servicio  │
   └─────────────────────────────────────┘

8. RECIBIR PAGO
   ┌─────────────────────────────────────┐
   │ Cliente paga servicio                │
   │ → Stripe webhook                     │
   │ → PagoServicio estado: "pagado"     │
   └──────────────┬───────────────────────┘
                  │
                  │ Notificación recibida
                  ▼
   ┌─────────────────────────────────────┐
   │ Técnico recibe notificación:       │
   │ "Pago recibido"                     │
   └─────────────────────────────────────┘

9. VER CALIFICACIONES
   ┌──────────────┐
   │ GET /api/    │
   │ calificaciones│
   │ /tecnico/:id │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ calificacion.controller.           │
   │ listarPorTecnico()                  │
   │ → Retorna todas las calificaciones  │
   └─────────────────────────────────────┘
```

---

## 👨‍💼 FLUJO COMPLETO DEL ADMINISTRADOR

```
┌─────────────────────────────────────────────────────────────────┐
│                  PROCESO COMPLETO DEL ADMINISTRADOR             │
└─────────────────────────────────────────────────────────────────┘

1. GESTIÓN DE TÉCNICOS
   ┌─────────────────────────────────────┐
   │ ACTIVAR TÉCNICO                     │
   │ PATCH /api/auth/tecnico/activar/:id │
   │ → Cambia estado: false → true       │
   └─────────────────────────────────────┘
   
   ┌─────────────────────────────────────┐
   │ DESACTIVAR TÉCNICO                  │
   │ PATCH /api/auth/tecnico/            │
   │ desactivar/:id                      │
   │ → Cambia estado: true → false      │
   └─────────────────────────────────────┘

2. GESTIÓN DE CATEGORÍAS
   ┌──────────────┐
   │ POST /api/   │
   │ categorias  │
   └──────┬───────┘
          │ { nombre, descripcion }
          ▼
   ┌─────────────────────────────────────┐
   │ categoria.controller.crear()       │
   │ → Crea Categoria                     │
   └─────────────────────────────────────┘
   
   ┌──────────────┐
   │ PUT /api/    │
   │ categorias/:id│
   └──────┬───────┘
          │ { nombre, descripcion }
          ▼
   ┌─────────────────────────────────────┐
   │ categoria.controller.actualizar()  │
   │ → Actualiza Categoria               │
   └─────────────────────────────────────┘
   
   ┌──────────────┐
   │ DELETE /api/ │
   │ categorias/:id│
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ categoria.controller.eliminar()   │
   │ → Elimina Categoria                │
   └─────────────────────────────────────┘

3. GESTIÓN DE ZONAS
   ┌──────────────┐
   │ POST /api/   │
   │ zonas       │
   └──────┬───────┘
          │ { nombre, ciudad, coordenadas }
          ▼
   ┌─────────────────────────────────────┐
   │ zona.controller.crear()            │
   │ → Crea Zona                         │
   └─────────────────────────────────────┘

4. GESTIÓN DE ESPECIALIDADES
   ┌──────────────┐
   │ POST /api/   │
   │ especialidades│
   └──────┬───────┘
          │ { nombre, referencias, anio_experiencia }
          ▼
   ┌─────────────────────────────────────┐
   │ especialidad.controller.crear()    │
   │ → Crea Especialidad                 │
   └─────────────────────────────────────┘

5. GESTIÓN DE INCIDENCIAS
   ┌──────────────┐
   │ GET /api/    │
   │ incidencias  │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ incidencia.controller.listarTodas()│
   │ → Retorna todas las incidencias     │
   └─────────────────────────────────────┘
   
   ┌──────────────┐
   │ PUT /api/    │
   │ incidencias/ │
   │ estado       │
   └──────┬───────┘
          │ { id_incidencia, estado }
          ▼
   ┌─────────────────────────────────────┐
   │ incidencia.controller.cambiarEstado│
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Actualiza estado incidencia  │ │
   │ │ 2. Notifica al usuario que      │ │
   │ │    reportó la incidencia        │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

6. AUDITORÍA
   ┌──────────────┐
   │ GET /api/    │
   │ auditoria   │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ auditoria.controller.listar()      │
   │ → Retorna todos los logs de        │
   │   auditoría ordenados por fecha    │
   └─────────────────────────────────────┘

7. VER TODOS LOS PERFILES
   ┌──────────────┐
   │ GET /api/    │
   │ auth/perfiles│
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ auth.controller.getAllPerfiles()    │
   │ → Retorna todos los usuarios con   │
   │   datos según su rol                │
   └─────────────────────────────────────┘

8. ENVIAR NOTIFICACIONES
   ┌──────────────┐
   │ POST /api/   │
   │ notificaciones│
   └──────┬───────┘
          │ { id_usuario, titulo, cuerpo }
          ▼
   ┌─────────────────────────────────────┐
   │ notificacion.controller.enviar()    │
   │ → Crea Notificacion + Push          │
   └─────────────────────────────────────┘
```

---

## 💬 FLUJO DEL CHAT (Socket.IO)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DEL CHAT EN TIEMPO REAL                │
└─────────────────────────────────────────────────────────────────┘

1. CONEXIÓN
   ┌──────────────┐
   │ Cliente      │
   │ conecta      │
   └──────┬───────┘
          │ Socket.IO connection
          ▼
   ┌─────────────────────────────────────┐
   │ server.js                           │
   │ chat.socket.js                      │
   │ ┌─────────────────────────────────┐ │
   │ │ io.on("connection")              │ │
   │ │ → socket.id generado             │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘

2. UNIRSE A SALA DEL SERVICIO
   ┌──────────────┐
   │ Cliente      │
   │ joinRoom     │
   └──────┬───────┘
          │ { id_servicio }
          ▼
   ┌─────────────────────────────────────┐
   │ socket.on("joinRoom")               │
   │ → socket.join("servicio_<id>")      │
   │ → Usuario unido a sala privada      │
   └─────────────────────────────────────┘

3. ENVIAR MENSAJE
   ┌──────────────┐
   │ Cliente      │
   │ enviarMensaje│
   └──────┬───────┘
          │ { id_servicio, emisor_id, mensaje }
          ▼
   ┌─────────────────────────────────────┐
   │ socket.on("enviarMensaje")          │
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Guarda en BD:                │ │
   │ │    ChatMensaje.create()         │ │
   │ │ 2. Emite a sala:                │ │
   │ │    io.to("servicio_X")          │ │
   │ │    .emit("nuevoMensaje")        │ │
   │ │ 3. Busca receptor               │ │
   │ │ 4. Envía push notification     │ │
   │ │ 5. Crea Notificacion en BD      │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
          │
          │ Mensaje emitido a todos en la sala
          ▼
   ┌─────────────────────────────────────┐
   │ Cliente y Técnico reciben mensaje    │
   │ en tiempo real                       │
   └─────────────────────────────────────┘

4. MARCAR MENSAJES COMO LEÍDOS
   ┌──────────────┐
   │ PUT /api/    │
   │ chat/leidos/ │
   │ :id_servicio │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ chat.controller.marcarLeidos()      │
   │ → Actualiza leido: true             │
   │   (mensajes del otro usuario)        │
   └─────────────────────────────────────┘
```

---

## 🤖 FLUJO DEL MACHINE LEARNING

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUJO DEL SISTEMA DE RECOMENDACIÓN ML              │
└─────────────────────────────────────────────────────────────────┘

FASE 1: PREPARACIÓN DE DATOS (Una vez o periódicamente)
┌─────────────────────────────────────────────────────────────────┐
│ 1. build_dataset.py                                             │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ Consulta PostgreSQL:                                     │  │
│    │ - solicitud_servicio                                     │  │
│    │ - tecnico + tecnico_ubicacion                           │  │
│    │ - calificacion                                           │  │
│    │ - oferta_tecnico                                        │  │
│    │ - servicio_asignado                                      │  │
│    └─────────────────────────────────────────────────────────┘  │
│    │                                                            │
│    │ Para cada combinación solicitud-técnico:                 │
│    │ - Calcula distancia (Haversine)                          │
│    │ - Obtiene rating_promedio                                 │
│    │ - Obtiene historico_rating                                │
│    │ - Obtiene cantidad_calificaciones                        │
│    │ - Obtiene precio_promedio                                 │
│    │ - Obtiene ofertas_totales                                 │
│    │ - Obtiene servicios_realizados                            │
│    │ - Obtiene disponibilidad                                  │
│    │ - Marca target (1 si fue asignado, 0 si no)              │
│    │                                                            │
│    └───────────────────────────────────────────────────────────┘
│    │
│    │ Genera dataset_tecnicos.csv
│    ▼
└─────────────────────────────────────────────────────────────────┘

FASE 2: ENTRENAMIENTO (Una vez o cuando actualices datos)
┌─────────────────────────────────────────────────────────────────┐
│ 2. train_model.py                                               │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ 1. Lee dataset_tecnicos.csv                             │  │
│    │ 2. Define 8 features:                                     │  │
│    │    - distancia_km                                         │  │
│    │    - rating_promedio                                      │  │
│    │    - historico_rating                                     │  │
│    │    - cantidad_calificaciones                             │  │
│    │    - precio_promedio                                      │  │
│    │    - ofertas_totales                                      │  │
│    │    - servicios_realizados                                 │  │
│    │    - disponibilidad                                       │  │
│    │ 3. Define target (1 o 0)                                  │  │
│    │ 4. Agrupa por id_solicitud (para ranking)                │  │
│    │ 5. Normaliza features (StandardScaler)                    │  │
│    │ 6. Entrena XGBoost Ranker                                 │  │
│    │ 7. Guarda modelo_recomendacion.pkl                        │  │
│    │ 8. Guarda scaler.pkl                                       │  │
│    └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

FASE 3: PREDICCIÓN EN TIEMPO REAL
┌─────────────────────────────────────────────────────────────────┐
│ 3. Flask API (app.py) - Puerto 5005                            │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ POST /recomendar                                         │  │
│    │ Body: { "id_solicitud": 123 }                            │  │
│    └─────────────────────────────────────────────────────────┘  │
│    │                                                            │
│    │ Llama a recommender.py                                    │
│    ▼                                                            │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ recommender.recomendar_tecnicos(id_solicitud)             │  │
│ │ ┌────────────────────────────────────────────────────────┐ │  │
│ │ │ 1. Obtiene solicitud de BD:                            │ │  │
│ │ │    - lat, lon del cliente                              │ │  │
│ │ │    - id_categoria                                       │ │  │
│ │ │ 2. Busca técnicos disponibles:                          │ │  │
│ │ │    - disponibilidad = true                             │ │  │
│ │ │    - lat, lon del técnico                              │ │  │
│ │ │ 3. Para cada técnico calcula:                          │ │  │
│ │ │    - distancia_km (Haversine)                          │ │  │
│ │ │    - rating_promedio                                    │ │  │
│ │ │    - historico_rating (de calificaciones)              │ │  │
│ │ │    - cantidad_calificaciones                           │ │  │
│ │ │    - precio_promedio (de ofertas)                       │ │  │
│ │ │    - ofertas_totales                                    │ │  │
│ │ │    - servicios_realizados                               │ │  │
│ │ │    - disponibilidad                                     │ │  │
│ │ │ 4. Normaliza features con scaler                        │ │  │
│ │ │ 5. Predice score con modelo                             │ │  │
│ │ │ 6. Ordena técnicos por score (DESC)                     │ │  │
│ │ └────────────────────────────────────────────────────────┘ │  │
│ └────────────────────────────────────────────────────────────┘  │
│    │                                                            │
│    │ Retorna lista de técnicos ordenados por score             │
│    ▼                                                            │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Response:                                                   │  │
│ │ {                                                            │  │
│ │   "id_solicitud": 123,                                      │  │
│ │   "tecnicos_recomendados": [                                │  │
│ │     {                                                        │  │
│ │       "id_tecnico": 5,                                      │  │
│ │       "distancia_km": 2.5,                                  │  │
│ │       "rating_promedio": 4.8,                               │  │
│ │       "score": 0.95,                                        │  │
│ │       ...                                                    │  │
│ │     },                                                       │  │
│ │     ...                                                     │  │
│ │   ],                                                         │  │
│ │   "total": 10                                                │  │
│ │ }                                                            │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

INTEGRACIÓN CON BACKEND NODE.JS
┌─────────────────────────────────────────────────────────────────┐
│ (Opcional - No implementado actualmente)                        │
│                                                                  │
│ Node.js puede llamar al ML cuando cliente crea solicitud:      │
│                                                                  │
│ POST http://localhost:5005/recomendar                           │
│ Body: { "id_solicitud": 123 }                                   │
│                                                                  │
│ → Retorna técnicos recomendados                                 │
│ → Node.js puede mostrar estos técnicos al cliente              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUJO COMPLETO DE UN SERVICIO (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│              FLUJO COMPLETO DE UN SERVICIO                       │
└─────────────────────────────────────────────────────────────────┘

1. CLIENTE CREA SOLICITUD
   Cliente → POST /api/solicitudes
   → SolicitudServicio creada (estado: "pendiente")
   → Notificaciones enviadas a técnicos disponibles

2. TÉCNICOS CREAN OFERTAS
   Técnico 1 → POST /api/ofertas { id_solicitud, precio: 100 }
   Técnico 2 → POST /api/ofertas { id_solicitud, precio: 150 }
   → OfertaTecnico creadas
   → Cliente recibe notificaciones

3. CLIENTE SELECCIONA OFERTA
   Cliente → POST /api/servicios/asignar { id_oferta: 1 }
   → ServicioAsignado creado (estado: "en_camino")
   → SolicitudServicio actualizada (estado: "asignado")
   → Técnico notificado

4. TÉCNICO ACTUALIZA ESTADO
   Técnico → PUT /api/servicios/:id/estado { estado: "en_ejecucion" }
   → ServicioAsignado actualizado
   → Cliente notificado

5. CHAT ENTRE CLIENTE Y TÉCNICO
   Ambos → Socket.IO joinRoom { id_servicio }
   Cliente → Socket.IO enviarMensaje { mensaje }
   → ChatMensaje guardado en BD
   → Mensaje emitido en tiempo real
   → Push notification enviada

6. TÉCNICO COMPLETA SERVICIO
   Técnico → PUT /api/servicios/:id/estado { estado: "completado" }
   → ServicioAsignado actualizado
   → Cliente notificado

7. CLIENTE PAGA
   Cliente → POST /api/pago/checkout { id_servicio }
   → PagoServicio creado (estado: "pendiente")
   → Stripe Checkout Session creada
   → Cliente redirigido a Stripe
   → Cliente paga
   → Stripe webhook → POST /api/pago/webhook
   → PagoServicio actualizado (estado: "pagado")
   → Técnico y Cliente notificados

8. CLIENTE CALIFICA
   Cliente → POST /api/calificaciones { id_servicio, puntuacion, comentario }
   → Calificacion creada
   → Tecnico.calificacion_promedio recalculado
   → Sistema completo
```

---

## 📊 DIAGRAMA DE BASE DE DATOS (Relaciones Principales)

```
┌──────────────┐
│   Usuario    │ (Tabla principal)
│──────────────│
│ id_usuario   │──┐
│ nombre       │  │
│ apellido     │  │
│ email        │  │
│ password     │  │
│ rol          │  │
│ estado       │  │
└──────────────┘  │
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Cliente  │ │ Tecnico  │ │  Admin   │
│──────────│ │──────────│ │──────────│
│id_cliente│ │id_tecnico│ │id_admin  │
│preferencia│ │descripcion│ │          │
│          │ │calificacion│ │          │
│          │ │disponibilidad│          │
└──────────┘ └──────────┘ └──────────┘
     │            │
     │            │
     ▼            ▼
┌──────────────────────┐
│ SolicitudServicio   │
│──────────────────────│
│ id_solicitud        │
│ id_cliente          │──┐
│ id_categoria        │  │
│ descripcion         │  │
│ lat, lon            │  │
│ estado              │  │
└──────────────────────┘  │
                          │
                          │
        ┌─────────────────┘
        │
        ▼
┌──────────────────────┐
│   OfertaTecnico     │
│──────────────────────│
│ id_oferta           │
│ id_solicitud        │
│ id_tecnico          │
│ precio              │
│ mensaje             │
│ estado              │
└──────────────────────┘
        │
        │
        ▼
┌──────────────────────┐
│ ServicioAsignado    │
│──────────────────────│
│ id_servicio         │
│ id_solicitud        │
│ id_oferta           │
│ id_tecnico          │
│ estado              │
└──────────────────────┘
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│PagoServicio │  │ Calificacion │
│──────────────│  │──────────────│
│ id_pago      │  │ id_calificacion│
│ id_servicio  │  │ id_servicio  │
│ monto_total  │  │ id_cliente   │
│ estado       │  │ id_tecnico   │
└──────────────┘  │ puntuacion   │
                  └──────────────┘
```

---

## 🔔 FLUJO DE NOTIFICACIONES

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE NOTIFICACIONES                    │
└─────────────────────────────────────────────────────────────────┘

1. NOTIFICACIÓN PUSH (Firebase)
   ┌─────────────────────────────────────┐
   │ Evento en el sistema                │
   │ (ej: nueva oferta, pago recibido)   │
   └──────────────┬──────────────────────┘
                  │
                  ▼
   ┌─────────────────────────────────────┐
   │ notificacion.util.enviarNotificacion│
   │ ┌─────────────────────────────────┐ │
   │ │ 1. Obtiene Usuario.token_real   │ │
   │ │ 2. Crea Notificacion en BD      │ │
   │ │ 3. Envía push via Firebase      │ │
   │ │ 4. Emite Socket.IO si conectado │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
                  │
                  │ Firebase Cloud Messaging
                  ▼
   ┌─────────────────────────────────────┐
   │ Dispositivo del usuario             │
   │ Recibe notificación push            │
   └─────────────────────────────────────┘

2. NOTIFICACIÓN EN APP
   ┌──────────────┐
   │ GET /api/    │
   │ notificaciones│
   └──────┬───────┘
          │
          ▼
   ┌─────────────────────────────────────┐
   │ notificacion.controller.listar()    │
   │ → Retorna todas las notificaciones  │
   │   del usuario                       │
   └─────────────────────────────────────┘

3. SOCKET.IO PARA NOTIFICACIONES EN TIEMPO REAL
   ┌──────────────┐
   │ Socket.IO   │
   │ authUser    │
   └──────┬───────┘
          │ { id_usuario }
          ▼
   ┌─────────────────────────────────────┐
   │ notificacion.socket.js              │
   │ → socket.join("user_<id_usuario>")  │
   └─────────────────────────────────────┘
          │
          │ Cuando se crea notificación
          ▼
   ┌─────────────────────────────────────┐
   │ io.to("user_X").emit(               │
   │   "nuevaNotificacion",              │
   │   notificacion                      │
   │ )                                    │
   └─────────────────────────────────────┘
```

---

## 🔒 MIDDLEWARE Y SEGURIDAD

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE MIDDLEWARES                         │
└─────────────────────────────────────────────────────────────────┘

REQUEST ENTRANTE
       │
       ▼
┌─────────────────────────────────────┐
│ auth.middleware.js                  │
│ ┌─────────────────────────────────┐ │
│ │ 1. Extrae token del header      │ │
│ │    Authorization: Bearer <token>│ │
│ │ 2. Verifica JWT                  │ │
│ │ 3. Busca usuario en BD            │ │
│ │ 4. Verifica estado=true           │ │
│ │ 5. Agrega req.user                │ │
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               │ Si token válido
               ▼
┌─────────────────────────────────────┐
│ role.middleware.js                  │
│ ┌─────────────────────────────────┐ │
│ │ 1. Verifica req.user.rol        │ │
│ │ 2. Compara con roles permitidos │ │
│ │ 3. Si no coincide → 403         │ │
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               │ Si rol válido
               ▼
┌─────────────────────────────────────┐
│ auditoria.middleware.js             │
│ ┌─────────────────────────────────┐ │
│ │ (Opcional - comentado)          │ │
│ │ Registra logs de operaciones    │ │
│ │ POST, PUT, PATCH, DELETE         │ │
│ └─────────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Controller                          │
│ Ejecuta lógica de negocio           │
└─────────────────────────────────────┘
```

---

## 📝 NOTAS IMPORTANTES

1. **Autenticación**: Todas las rutas protegidas requieren token JWT en el header `Authorization: Bearer <token>`

2. **Roles**: 
   - `cliente`: Puede crear solicitudes, asignar servicios, calificar
   - `tecnico`: Puede crear ofertas, cambiar estado de servicios
   - `admin`: Acceso completo al sistema

3. **Estados de Solicitud**: `pendiente` → `con_ofertas` → `asignado` → `en_proceso` → `completado` / `cancelado`

4. **Estados de Servicio**: `en_camino` → `en_ejecucion` → `completado`

5. **Estados de Pago**: `pendiente` → `pagado` / `fallido`

6. **Socket.IO**: Usa salas por servicio (`servicio_<id>`) y por usuario (`user_<id>`)

7. **Machine Learning**: Funciona independientemente, puede ser llamado desde Node.js cuando sea necesario

