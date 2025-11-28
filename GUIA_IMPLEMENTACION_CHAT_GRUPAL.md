# 🚀 GUÍA DE IMPLEMENTACIÓN: CHAT GRUPAL CON OFERTAS

## ✅ CAMBIOS IMPLEMENTADOS

He modificado tu backend para soportar el chat grupal con ofertas. Aquí está todo lo que se cambió:

---

## 📝 ARCHIVOS MODIFICADOS

### 1. **Modelos**

#### `src/models/solicitud_servicio.js`
- ✅ Agregado campo `precio_ofrecido` (DECIMAL)
- ✅ Agregado campo `fotos` (JSON array)

#### `src/models/chat_mensaje.js`
- ✅ Agregado campo `id_solicitud` (para chat grupal)
- ✅ Agregado campo `precio` (para ofertas en chat)
- ✅ Agregado campo `es_oferta` (BOOLEAN)
- ✅ `id_servicio` ahora es nullable (puede ser null en chat grupal)

#### `src/models/index.js`
- ✅ Agregada relación `SolicitudServicio.hasMany(ChatMensaje)`
- ✅ Agregada relación `ChatMensaje.belongsTo(SolicitudServicio)`

---

### 2. **Controladores**

#### `src/controllers/solicitud.controller.js`
- ✅ Acepta `precio_ofrecido` y `fotos` en el body
- ✅ Notificaciones incluyen precio ofrecido

#### `src/controllers/chat.controller.js`
- ✅ Nueva función `obtenerHistorialGrupal()` para obtener mensajes del chat grupal
- ✅ `obtenerHistorial()` ahora incluye datos del emisor

---

### 3. **Socket.IO**

#### `src/socket/chat.socket.js`
- ✅ Nuevo evento `joinSolicitudChat` - Unirse a chat grupal
- ✅ Nuevo evento `enviarMensajeGrupal` - Enviar mensaje en chat grupal
- ✅ Nuevo evento `seleccionarOferta` - Cliente selecciona oferta
- ✅ Nuevo evento `typingGrupal` - Indicar escritura en chat grupal
- ✅ Eventos del servidor:
  - `nuevoMensajeGrupal` - Nuevo mensaje en chat grupal
  - `servicioAsignado` - Servicio fue asignado
  - `expulsarDelChat` - Expulsar técnico del chat
  - `redirigirAchat` - Redirigir a chat 1 a 1

---

### 4. **Rutas**

#### `src/routes/chat.routes.js`
- ✅ Nueva ruta `GET /api/chat/solicitud/:id_solicitud` - Historial chat grupal
- ✅ Ruta existente `GET /api/chat/servicio/:id_servicio` - Historial chat 1 a 1

---

## 🗄️ MIGRACIONES SQL

**Archivo:** `migrations_chat_grupal.sql`

Ejecuta este archivo en tu base de datos PostgreSQL:

```bash
psql -U postgres -d tu_base_de_datos -f migrations_chat_grupal.sql
```

O ejecuta manualmente las queries del archivo.

---

## 📱 CÓMO USAR EL NUEVO SISTEMA

### **1. Cliente Crea Solicitud con Precio y Fotos**

```javascript
POST /api/solicitudes
Headers: { Authorization: "Bearer <token>" }
Body: {
  "id_categoria": 1,
  "descripcion": "Quiero arreglar una puerta, ofrezco 40 Bs.",
  "precio_ofrecido": 40.00,
  "fotos": ["https://cloudinary.com/foto1.jpg", "https://cloudinary.com/foto2.jpg"],
  "ubicacion_texto": "Calle Principal 123",
  "lat": -17.3935,
  "lon": -66.1570
}
```

### **2. Técnicos se Unen al Chat Grupal**

```javascript
// Socket.IO
socket.emit("joinSolicitudChat", { id_solicitud: 1 });
```

### **3. Técnicos Envían Ofertas en el Chat**

```javascript
// Técnico envía oferta
socket.emit("enviarMensajeGrupal", {
  id_solicitud: 1,
  emisor_id: 5,
  mensaje: "Yo lo hago por 30 Bs.",
  precio: 30.00  // ← Si tiene precio, es una oferta
});

// Técnico envía mensaje normal (sin oferta)
socket.emit("enviarMensajeGrupal", {
  id_solicitud: 1,
  emisor_id: 5,
  mensaje: "¿A qué hora necesitas el servicio?",
  precio: null  // ← Sin precio, es mensaje normal
});
```

### **4. Cliente Ve Historial del Chat Grupal**

```javascript
GET /api/chat/solicitud/1
Headers: { Authorization: "Bearer <token>" }

Response: [
  {
    "id_mensaje": 1,
    "id_solicitud": 1,
    "id_servicio": null,
    "emisor_id": 5,
    "mensaje": "Yo lo hago por 30 Bs.",
    "precio": 30.00,
    "es_oferta": true,
    "fecha": "2025-01-20T10:00:00Z",
    "Usuario": {
      "id_usuario": 5,
      "nombre": "Carlos",
      "apellido": "García",
      "foto": "url_foto.jpg",
      "rol": "tecnico"
    }
  },
  ...
]
```

### **5. Cliente Selecciona Oferta**

```javascript
// Socket.IO
socket.emit("seleccionarOferta", {
  id_solicitud: 1,
  id_mensaje_oferta: 5,  // ID del mensaje que contiene la oferta
  id_cliente: 1
});
```

**Eventos que se emiten:**
- `servicioAsignado` - A todos en el chat grupal
- `expulsarDelChat` - A técnicos no seleccionados
- `redirigirAchat` - A cliente y técnico ganador

### **6. Chat 1 a 1 Continúa**

```javascript
// Unirse al chat 1 a 1
socket.emit("joinRoom", { id_servicio: 1 });

// Enviar mensaje
socket.emit("enviarMensaje", {
  id_servicio: 1,
  emisor_id: 1,
  mensaje: "Perfecto, ¿a qué hora llegas?"
});
```

---

## 🔄 FLUJO COMPLETO

```
1. Cliente crea solicitud
   POST /api/solicitudes
   → SolicitudServicio creada (estado: "pendiente")
   → Notificaciones a técnicos

2. Técnicos se unen al chat grupal
   Socket.IO → joinSolicitudChat { id_solicitud: 1 }
   → Todos en sala "solicitud_1"

3. Técnicos envían ofertas
   Socket.IO → enviarMensajeGrupal { precio: 30.00, mensaje: "..." }
   → ChatMensaje creado (es_oferta: true)
   → OfertaTecnico creada automáticamente
   → Mensaje visible para todos

4. Cliente ve ofertas
   GET /api/chat/solicitud/1
   → Lista de mensajes con ofertas

5. Cliente selecciona oferta
   Socket.IO → seleccionarOferta { id_mensaje_oferta: 5 }
   → ServicioAsignado creado
   → Otros técnicos expulsados
   → Chat grupal cerrado

6. Chat 1 a 1
   Socket.IO → joinRoom { id_servicio: 1 }
   → Solo cliente y técnico ganador
```

---

## ⚠️ NOTAS IMPORTANTES

### **Autenticación en Socket.IO**

Actualmente el socket no valida el token JWT automáticamente. Necesitas implementar autenticación en el socket. Opciones:

1. **Enviar token al conectar:**
```javascript
socket.on("authenticate", async (data) => {
  const { token } = data;
  // Verificar token y guardar en socket.user
  socket.user = decodedUser;
});
```

2. **O pasar id_usuario en cada evento** (como está ahora)

### **Validaciones Adicionales**

El código actual tiene validaciones básicas. Puedes agregar:
- Verificar que el técnico pertenezca a la categoría de la solicitud
- Verificar que el técnico esté disponible
- Limitar número de ofertas por técnico

### **Performance**

Para muchas solicitudes simultáneas, considera:
- Índices en BD (ya incluidos en migraciones)
- Rate limiting en Socket.IO
- Paginación en historial de chat

---

## 🧪 TESTING

### **Probar Chat Grupal:**

1. Crear solicitud con precio
2. Conectar 2-3 técnicos al socket
3. Enviar ofertas desde cada técnico
4. Verificar que todos ven los mensajes
5. Cliente selecciona oferta
6. Verificar que otros técnicos son expulsados
7. Verificar que chat 1 a 1 funciona

---

## 📚 DOCUMENTACIÓN ADICIONAL

- Ver `ANALISIS_IDEA_CHAT_GRUPAL.md` para el análisis completo
- Ver `FLUJO_VISUAL.md` para diagramas de flujo
- Ver `GUIA_COMPLETA.md` para documentación completa del sistema

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Modelos modificados
- [x] Controladores actualizados
- [x] Socket.IO implementado
- [x] Rutas agregadas
- [ ] Migraciones SQL ejecutadas
- [ ] Frontend actualizado (tu responsabilidad)
- [ ] Testing realizado
- [ ] Documentación revisada

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar migraciones SQL** en tu base de datos
2. **Actualizar frontend** para usar los nuevos eventos de Socket.IO
3. **Probar el flujo completo** con usuarios reales
4. **Agregar validaciones adicionales** si es necesario
5. **Implementar autenticación en Socket.IO** para mayor seguridad

---

¡Listo! Tu backend ahora soporta el chat grupal con ofertas. 🎉

