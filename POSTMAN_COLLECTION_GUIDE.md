# 📮 GUÍA COMPLETA DE RUTAS PARA POSTMAN

**Base URL:** `http://localhost:3000` (o el puerto configurado en tu `.env`)

**Headers comunes:**
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (para rutas protegidas)

---

## 🔐 AUTENTICACIÓN (`/api/auth`)

### 1. REGISTRAR USUARIO (Cliente)
**POST** `/api/auth/register`

**Body (JSON):**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "rol": "cliente",
  "telefono": "1234567890",
  "preferencia": "Servicios rápidos"
}
```

**Body (JSON) - Técnico:**
```json
{
  "nombre": "Carlos",
  "apellido": "García",
  "email": "carlos@example.com",
  "password": "123456",
  "rol": "tecnico",
  "telefono": "0987654321",
  "descripcion": "Técnico especializado en plomería"
}
```

**Body (JSON) - Admin:**
```json
{
  "nombre": "Admin",
  "apellido": "Sistema",
  "email": "admin@example.com",
  "password": "admin123",
  "rol": "admin",
  "telefono": "1111111111"
}
```

---

### 2. INICIAR SESIÓN
**POST** `/api/auth/login`

**Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "msg": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id_usuario": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "rol": "cliente",
    "estado": true
  }
}
```

---

### 3. RENOVAR TOKEN
**POST** `/api/auth/refresh-token`

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 4. OBTENER PERFIL
**GET** `/api/auth/perfil`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 📁 CATEGORÍAS (`/api/categorias`)

### 1. CREAR CATEGORÍA (Admin)
**POST** `/api/categorias`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Plomería",
  "descripcion": "Servicios de plomería y fontanería"
}
```

---

### 2. LISTAR TODAS LAS CATEGORÍAS (Público)
**GET** `/api/categorias`

---

### 3. OBTENER CATEGORÍA POR ID (Público)
**GET** `/api/categorias/:id`

**Ejemplo:** `/api/categorias/1`

---

### 4. ACTUALIZAR CATEGORÍA (Admin)
**PUT** `/api/categorias/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Plomería Actualizada",
  "descripcion": "Nueva descripción"
}
```

---

### 5. ELIMINAR CATEGORÍA (Admin)
**DELETE** `/api/categorias/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

---

## 🗺️ ZONAS (`/api/zonas`)

### 1. CREAR ZONA (Admin)
**POST** `/api/zonas`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Zona Norte",
  "ciudad": "La Paz",
  "coordenadas": "{\"lat\": -16.5000, \"lon\": -68.1500}"
}
```

---

### 2. LISTAR TODAS LAS ZONAS (Público)
**GET** `/api/zonas`

---

### 3. OBTENER ZONA POR ID (Público)
**GET** `/api/zonas/:id`

---

### 4. ACTUALIZAR ZONA (Admin)
**PUT** `/api/zonas/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Zona Norte Actualizada",
  "ciudad": "La Paz",
  "coordenadas": "{\"lat\": -16.5000, \"lon\": -68.1500}"
}
```

---

### 5. ELIMINAR ZONA (Admin)
**DELETE** `/api/zonas/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

---

## 🎯 ESPECIALIDADES (`/api/especialidades`)

### 1. CREAR ESPECIALIDAD (Admin)
**POST** `/api/especialidades`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Fontanero Certificado",
  "referencias": "Certificado por ABC",
  "anio_experiencia": 5
}
```

---

### 2. LISTAR TODAS LAS ESPECIALIDADES (Público)
**GET** `/api/especialidades`

---

### 3. OBTENER ESPECIALIDAD POR ID (Público)
**GET** `/api/especialidades/:id`

---

### 4. ACTUALIZAR ESPECIALIDAD (Admin)
**PUT** `/api/especialidades/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "nombre": "Fontanero Certificado",
  "referencias": "Certificado por XYZ",
  "anio_experiencia": 7
}
```

---

### 5. ELIMINAR ESPECIALIDAD (Admin)
**DELETE** `/api/especialidades/:id`

**Headers:**
```
Authorization: Bearer <token_admin>
```

---

## 📋 SOLICITUDES (`/api/solicitudes`)

### 1. CREAR SOLICITUD (Cliente)
**POST** `/api/solicitudes`

**Headers:**
```
Authorization: Bearer <token_cliente>
```

**Body (JSON):**
```json
{
  "id_categoria": 1,
  "descripcion": "Necesito reparar una fuga de agua en mi baño",
  "ubicacion_texto": "Av. Principal #123, La Paz",
  "lat": -16.5000,
  "lon": -68.1500
}
```

---

### 2. LISTAR MIS SOLICITUDES (Cliente)
**GET** `/api/solicitudes`

**Headers:**
```
Authorization: Bearer <token_cliente>
```

---

### 3. OBTENER SOLICITUD POR ID
**GET** `/api/solicitudes/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/solicitudes/1`

---

### 4. CAMBIAR ESTADO DE SOLICITUD
**PUT** `/api/solicitudes/:id/estado`

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "estado": "asignado"
}
```

**Estados posibles:** `pendiente`, `con_ofertas`, `asignado`, `completado`, `cancelado`

---

## 💰 OFERTAS (`/api/ofertas`)

### 1. CREAR OFERTA (Técnico)
**POST** `/api/ofertas`

**Headers:**
```
Authorization: Bearer <token_tecnico>
```

**Body (JSON):**
```json
{
  "id_solicitud": 1,
  "precio": 150.00,
  "mensaje": "Puedo realizar el trabajo en 2 horas"
}
```

---

### 2. LISTAR OFERTAS DE UNA SOLICITUD
**GET** `/api/ofertas/solicitud/:id_solicitud`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/ofertas/solicitud/1`

---

### 3. OBTENER OFERTA POR ID
**GET** `/api/ofertas/:id`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 🔧 SERVICIOS (`/api/servicios`)

### 1. ASIGNAR SERVICIO (Cliente selecciona oferta)
**POST** `/api/servicios/asignar`

**Headers:**
```
Authorization: Bearer <token_cliente>
```

**Body (JSON):**
```json
{
  "id_oferta": 1
}
```

---

### 2. CAMBIAR ESTADO DEL SERVICIO (Técnico)
**PUT** `/api/servicios/:id_servicio/estado`

**Headers:**
```
Authorization: Bearer <token_tecnico>
```

**Body (JSON):**
```json
{
  "estado": "en_ejecucion"
}
```

**Estados posibles:** `en_camino`, `en_ejecucion`, `completado`

**Ejemplo:** `/api/servicios/1/estado`

---

### 3. OBTENER SERVICIO POR ID
**GET** `/api/servicios/:id_servicio`

**Headers:**
```
Authorization: Bearer <token>
```

---

## ⭐ CALIFICACIONES (`/api/calificaciones`)

### 1. CREAR CALIFICACIÓN (Cliente)
**POST** `/api/calificaciones`

**Headers:**
```
Authorization: Bearer <token_cliente>
```

**Body (JSON):**
```json
{
  "id_servicio": 1,
  "puntuacion": 5,
  "comentario": "Excelente servicio, muy profesional"
}
```

**Nota:** Solo se puede calificar servicios completados y pagados.

---

### 2. LISTAR CALIFICACIONES DE UN TÉCNICO (Público)
**GET** `/api/calificaciones/tecnico/:id_tecnico`

**Ejemplo:** `/api/calificaciones/tecnico/2`

---

## 💳 PAGOS (`/api/pago`)

### 1. CREAR CHECKOUT (Iniciar pago)
**POST** `/api/pago/checkout`

**Headers:**
```
Authorization: Bearer <token_cliente>
```

**Body (JSON):**
```json
{
  "id_servicio": 1
}
```

**Respuesta:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

### 2. WEBHOOK DE STRIPE (No requiere auth)
**POST** `/api/pago/webhook`

**Headers:**
```
Stripe-Signature: <signature>
Content-Type: application/json
```

**Nota:** Este endpoint es llamado automáticamente por Stripe, no se prueba manualmente.

---

## 📝 INCIDENCIAS (`/api/incidencias`)

### 1. CREAR INCIDENCIA
**POST** `/api/incidencias`

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "id_servicio": 1,
  "descripcion": "El técnico no llegó a la hora acordada"
}
```

---

### 2. LISTAR MIS INCIDENCIAS
**GET** `/api/incidencias/mias`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. LISTAR INCIDENCIAS DE UN SERVICIO
**GET** `/api/incidencias/servicio/:id_servicio`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/incidencias/servicio/1`

---

### 4. LISTAR TODAS LAS INCIDENCIAS (Admin)
**GET** `/api/incidencias`

**Headers:**
```
Authorization: Bearer <token_admin>
```

---

### 5. CAMBIAR ESTADO DE INCIDENCIA (Admin)
**PUT** `/api/incidencias/estado`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "id_incidencia": 1,
  "estado": "resuelta"
}
```

**Estados posibles:** `pendiente`, `en_revision`, `resuelta`, `rechazada`

---

## 💬 CHAT (`/api/chat`)

### 1. OBTENER HISTORIAL DE CHAT
**GET** `/api/chat/:id_servicio`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/chat/1`

---

### 2. ENVIAR MENSAJE
**POST** `/api/chat`

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "id_servicio": 1,
  "mensaje": "¿A qué hora llegas?"
}
```

---

### 3. MARCAR MENSAJES COMO LEÍDOS
**PUT** `/api/chat/leidos/:id_servicio`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/chat/leidos/1`

---

## 🔔 NOTIFICACIONES (`/api/notificaciones`)

### 1. LISTAR MIS NOTIFICACIONES
**GET** `/api/notificaciones`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 2. MARCAR TODAS COMO LEÍDAS
**PUT** `/api/notificaciones/leidas`

**Headers:**
```
Authorization: Bearer <token>
```

---

### 3. ENVIAR NOTIFICACIÓN (Admin)
**POST** `/api/notificaciones`

**Headers:**
```
Authorization: Bearer <token_admin>
```

**Body (JSON):**
```json
{
  "id_usuario": 1,
  "titulo": "Bienvenido",
  "cuerpo": "Gracias por usar nuestro servicio"
}
```

---

### 4. ELIMINAR UNA NOTIFICACIÓN
**DELETE** `/api/notificaciones/:id_notificacion`

**Headers:**
```
Authorization: Bearer <token>
```

**Ejemplo:** `/api/notificaciones/1`

---

### 5. ELIMINAR TODAS MIS NOTIFICACIONES
**DELETE** `/api/notificaciones`

**Headers:**
```
Authorization: Bearer <token>
```

---

## 📊 AUDITORÍA (`/api/auditoria`)

### 1. LISTAR LOGS DE AUDITORÍA (Admin)
**GET** `/api/auditoria`

**Headers:**
```
Authorization: Bearer <token_admin>
```

---

## 📍 UBICACIÓN (`/api/ubicacion`)

### 1. ACTUALIZAR UBICACIÓN (Técnico)
**POST** `/api/ubicacion/actualizar`

**Headers:**
```
Authorization: Bearer <token_tecnico>
```

**Body (JSON):**
```json
{
  "lat": -16.5000,
  "lon": -68.1500,
  "direccion_texto": "Av. Principal #123"
}
```

**Nota:** Esta ruta ya está corregida y registrada.

---

## 🤖 MACHINE LEARNING (`/api/ml`)

### 1. RECOMENDAR TÉCNICOS
**POST** `/api/ml/recomendar`

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "id_solicitud": 1
}
```

**Nota:** Esta ruta usa ES6 modules y necesita ser convertida a CommonJS.

---

## 📝 NOTAS IMPORTANTES

1. **Tokens:** Después de hacer login, copia el `token` y úsalo en el header `Authorization: Bearer <token>`

2. **Roles:**
   - `cliente`: Puede crear solicitudes, asignar servicios, calificar
   - `tecnico`: Puede crear ofertas, cambiar estado de servicios
   - `admin`: Acceso completo, puede gestionar categorías, zonas, especialidades, ver auditoría

3. **Estados de Solicitud:**
   - `pendiente`: Recién creada
   - `con_ofertas`: Tiene ofertas de técnicos
   - `asignado`: Cliente seleccionó un técnico
   - `completado`: Servicio terminado
   - `cancelado`: Cancelado

4. **Estados de Servicio:**
   - `en_camino`: Técnico en camino
   - `en_ejecucion`: Trabajando
   - `completado`: Terminado

5. **Orden de Flujo:**
   1. Cliente crea solicitud
   2. Técnicos crean ofertas
   3. Cliente asigna servicio (selecciona oferta)
   4. Técnico cambia estado del servicio
   5. Cliente paga
   6. Cliente califica

---

## 🚨 RUTAS QUE NECESITAN CORRECCIÓN

1. **`/api/ubicacion`** - No está registrada en `app.js` y el router está incompleto
2. **`/api/ml`** - No está registrada en `app.js` y usa ES6 modules

