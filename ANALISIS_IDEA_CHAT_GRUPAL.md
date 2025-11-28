# 📊 ANÁLISIS: ¿Tu Backend Puede Hacer el Chat Grupal?

## ✅ LO QUE YA TIENES (Funciona)

### 1. **Solicitud de Servicio**
- ✅ Cliente puede crear solicitud con categoría
- ✅ Descripción del servicio
- ✅ Ubicación (lat, lon, texto)
- ✅ Notificaciones a técnicos de la categoría

### 2. **Sistema de Ofertas**
- ✅ Técnicos pueden crear ofertas con precio y mensaje
- ✅ Ofertas vinculadas a solicitud
- ✅ Estado de ofertas (enviada, seleccionada, rechazada)

### 3. **Chat con Socket.IO**
- ✅ Chat en tiempo real
- ✅ Mensajes guardados en BD
- ✅ Notificaciones push

### 4. **Asignación de Servicio**
- ✅ Cliente puede seleccionar oferta
- ✅ Se crea ServicioAsignado
- ✅ Estados del servicio

---

## ❌ LO QUE FALTA PARA TU IDEA

### 1. **Precio Ofrecido por el Cliente**
**Problema:** Tu modelo `SolicitudServicio` no tiene campo para el precio que el cliente ofrece.

**Solución:** Agregar campo `precio_ofrecido` en la tabla.

### 2. **Fotos en la Solicitud**
**Problema:** No hay campo para almacenar fotos de la solicitud.

**Solución:** Agregar campo `fotos` (JSON array o tabla separada).

### 3. **Chat Grupal ANTES de Asignar Servicio**
**Problema:** Actualmente el chat solo funciona DESPUÉS de crear `ServicioAsignado`. Tu idea necesita un chat grupal ANTES de asignar.

**Solución:** Modificar el modelo `ChatMensaje` para que también pueda estar vinculado a `SolicitudServicio` (no solo a `ServicioAsignado`).

### 4. **Ofertas como Mensajes en el Chat**
**Problema:** Actualmente las ofertas se crean con `POST /api/ofertas` (endpoint separado). Tu idea quiere que las ofertas sean mensajes en el chat.

**Solución:** Modificar el chat para que detecte mensajes con precio y los convierta en ofertas automáticamente.

### 5. **Chat que se Cierra para Otros Técnicos**
**Problema:** Cuando se asigna un servicio, todos los técnicos siguen viendo el chat.

**Solución:** Agregar lógica para expulsar técnicos del chat grupal cuando se asigna servicio.

---

## 🔧 MODIFICACIONES NECESARIAS

### **MODIFICACIÓN 1: Agregar Precio y Fotos a SolicitudServicio**

**Archivo:** `src/models/solicitud_servicio.js`

```javascript
SolicitudServicio.init({
    // ... campos existentes ...
    precio_ofrecido: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // NUEVO
    fotos: { type: DataTypes.JSON, allowNull: true }, // NUEVO - Array de URLs
    // ... resto de campos ...
});
```

**Migración SQL:**
```sql
ALTER TABLE solicitud_servicio 
ADD COLUMN precio_ofrecido DECIMAL(10,2) NULL,
ADD COLUMN fotos JSON NULL;
```

---

### **MODIFICACIÓN 2: Chat Vinculado a Solicitud (No Solo Servicio)**

**Archivo:** `src/models/chat_mensaje.js`

```javascript
ChatMensaje.init({
    id_mensaje: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_solicitud: { type: DataTypes.INTEGER, allowNull: true }, // NUEVO - Para chat grupal
    id_servicio: { type: DataTypes.INTEGER, allowNull: true }, // EXISTENTE - Para chat 1 a 1
    emisor_id: { type: DataTypes.INTEGER },
    mensaje: { type: DataTypes.TEXT, allowNull: false },
    precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true }, // NUEVO - Si es oferta
    es_oferta: { type: DataTypes.BOOLEAN, defaultValue: false }, // NUEVO - Marca si es oferta
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    leido: { type: DataTypes.BOOLEAN, defaultValue: false }
});
```

**Migración SQL:**
```sql
ALTER TABLE chat_mensaje 
ADD COLUMN id_solicitud INTEGER NULL,
ADD COLUMN precio DECIMAL(10,2) NULL,
ADD COLUMN es_oferta BOOLEAN DEFAULT FALSE;

-- Agregar foreign key
ALTER TABLE chat_mensaje 
ADD CONSTRAINT fk_chat_solicitud 
FOREIGN KEY (id_solicitud) REFERENCES solicitud_servicio(id_solicitud);
```

**Lógica:**
- Si `id_solicitud` existe y `id_servicio` es NULL → Chat grupal (antes de asignar)
- Si `id_servicio` existe → Chat 1 a 1 (después de asignar)

---

### **MODIFICACIÓN 3: Actualizar Controller de Solicitud**

**Archivo:** `src/controllers/solicitud.controller.js`

```javascript
async crear(req, res) {
    try {
        const { 
            id_categoria, 
            descripcion, 
            ubicacion_texto, 
            lat, 
            lon,
            precio_ofrecido, // NUEVO
            fotos // NUEVO - Array de URLs
        } = req.body;
        const id_cliente = req.user.id_usuario;

        // Crear la solicitud
        const solicitud = await SolicitudServicio.create({
            id_cliente,
            id_categoria,
            descripcion,
            ubicacion_texto,
            lat,
            lon,
            precio_ofrecido, // NUEVO
            fotos: fotos ? JSON.stringify(fotos) : null // NUEVO
        });

        // Buscar técnicos de esa categoría (mejorar esta consulta)
        const tecnicosCategoria = await Tecnico.findAll({
            include: [{
                model: Usuario,
                where: { rol: 'tecnico' }
            }],
            where: { disponibilidad: true }
        });

        // Enviar notificaciones
        for (const t of tecnicosCategoria) {
            const usuario = await Usuario.findByPk(t.id_tecnico);
            if (usuario && t.disponibilidad === true) {
                await enviarNotificacion(
                    usuario.id_usuario,
                    "Nueva solicitud de servicio",
                    `${descripcion} - Precio ofrecido: Bs. ${precio_ofrecido || 'Negociable'}`
                );
            }
        }

        res.json({
            msg: "Solicitud creada correctamente",
            solicitud
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error interno del servidor" });
    }
}
```

---

### **MODIFICACIÓN 4: Chat Grupal con Ofertas Integradas**

**Archivo:** `src/socket/chat.socket.js`

```javascript
module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("🔵 Usuario conectado:", socket.id);

        // ==========================================
        // UNIRSE A CHAT GRUPAL (ANTES DE ASIGNAR)
        // ==========================================
        socket.on("joinSolicitudChat", ({ id_solicitud }) => {
            socket.join(`solicitud_${id_solicitud}`);
            console.log(`🟢 Usuario unido a chat grupal solicitud_${id_solicitud}`);
        });

        // ==========================================
        // UNIRSE A CHAT 1 A 1 (DESPUÉS DE ASIGNAR)
        // ==========================================
        socket.on("joinRoom", ({ id_servicio }) => {
            socket.join(`servicio_${id_servicio}`);
            console.log(`🟢 Usuario unido a sala servicio_${id_servicio}`);
        });

        // ==========================================
        // ENVIAR MENSAJE EN CHAT GRUPAL
        // ==========================================
        socket.on("enviarMensajeGrupal", async (data) => {
            const { id_solicitud, emisor_id, mensaje, precio } = data;

            // Si tiene precio, es una oferta
            const esOferta = precio !== null && precio !== undefined;

            // Guardar mensaje en BD
            const nuevoMensaje = await ChatMensaje.create({
                id_solicitud, // Chat grupal
                id_servicio: null, // Aún no hay servicio asignado
                emisor_id,
                mensaje,
                precio: esOferta ? precio : null,
                es_oferta: esOferta
            });

            // Si es oferta, crear también en tabla OfertaTecnico
            if (esOferta) {
                const oferta = await OfertaTecnico.create({
                    id_solicitud,
                    id_tecnico: emisor_id,
                    precio,
                    mensaje,
                    estado: "enviada"
                });

                // Actualizar estado de solicitud
                const solicitud = await SolicitudServicio.findByPk(id_solicitud);
                if (solicitud.estado === "pendiente") {
                    await solicitud.update({ estado: "con_ofertas" });
                }
            }

            // Obtener datos del emisor para mostrar en el chat
            const emisor = await Usuario.findByPk(emisor_id, {
                attributes: ['id_usuario', 'nombre', 'apellido', 'foto', 'rol']
            });

            // Emitir a todos en el chat grupal
            io.to(`solicitud_${id_solicitud}`).emit("nuevoMensajeGrupal", {
                ...nuevoMensaje.toJSON(),
                emisor: emisor.toJSON()
            });

            // Notificar al cliente (si el emisor es técnico)
            const solicitud = await SolicitudServicio.findByPk(id_solicitud);
            if (emisor.rol === 'tecnico' && solicitud.id_cliente !== emisor_id) {
                const cliente = await Usuario.findByPk(solicitud.id_cliente);
                if (cliente.token_real) {
                    await sendPush(cliente.token_real, {
                        title: esOferta ? "Nueva oferta recibida" : "Nuevo mensaje",
                        body: esOferta ? `Oferta: Bs. ${precio}` : mensaje
                    });
                }
            }
        });

        // ==========================================
        // ENVIAR MENSAJE EN CHAT 1 A 1
        // ==========================================
        socket.on("enviarMensaje", async (data) => {
            const { id_servicio, emisor_id, mensaje } = data;

            // Guardar en BD
            const nuevo = await ChatMensaje.create({
                id_servicio, // Chat 1 a 1
                id_solicitud: null, // Ya no es chat grupal
                emisor_id,
                mensaje
            });

            // Emitir a todos en la sala
            io.to(`servicio_${id_servicio}`).emit("nuevoMensaje", nuevo);

            // Notificaciones push
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);
            
            // Determinar receptor
            const receptor_id = servicio.id_tecnico === emisor_id 
                ? solicitud.id_cliente 
                : servicio.id_tecnico;

            const receptor = await Usuario.findByPk(receptor_id);
            if (receptor.token_real) {
                await sendPush(receptor.token_real, {
                    title: "Nuevo mensaje",
                    body: mensaje
                });
            }
        });

        // ==========================================
        // CLIENTE SELECCIONA OFERTA
        // ==========================================
        socket.on("seleccionarOferta", async (data) => {
            const { id_solicitud, id_mensaje_oferta } = data;
            const id_cliente = socket.user?.id_usuario; // Necesitas autenticar el socket

            // Obtener el mensaje que contiene la oferta
            const mensajeOferta = await ChatMensaje.findByPk(id_mensaje_oferta);
            if (!mensajeOferta || !mensajeOferta.es_oferta) {
                return socket.emit("error", { msg: "Mensaje no es una oferta válida" });
            }

            // Obtener la oferta correspondiente
            const oferta = await OfertaTecnico.findOne({
                where: {
                    id_solicitud,
                    id_tecnico: mensajeOferta.emisor_id,
                    precio: mensajeOferta.precio
                }
            });

            if (!oferta) {
                return socket.emit("error", { msg: "Oferta no encontrada" });
            }

            // Crear ServicioAsignado
            const servicio = await ServicioAsignado.create({
                id_solicitud,
                id_oferta: oferta.id_oferta,
                id_tecnico: oferta.id_tecnico,
                estado: "en_camino"
            });

            // Actualizar solicitud
            const solicitud = await SolicitudServicio.findByPk(id_solicitud);
            await solicitud.update({ estado: "asignado" });

            // Actualizar oferta
            await oferta.update({ estado: "seleccionada" });

            // Rechazar otras ofertas
            await OfertaTecnico.update(
                { estado: "rechazada" },
                {
                    where: {
                        id_solicitud,
                        id_oferta: { [Op.ne]: oferta.id_oferta }
                    }
                }
            );

            // EXPULSAR TÉCNICOS DEL CHAT GRUPAL
            // Notificar a todos los técnicos que no fueron seleccionados
            const todasOfertas = await OfertaTecnico.findAll({
                where: { id_solicitud }
            });

            for (const o of todasOfertas) {
                if (o.id_tecnico !== oferta.id_tecnico) {
                    // Expulsar del chat grupal
                    io.to(`solicitud_${id_solicitud}`).emit("expulsarDelChat", {
                        id_tecnico: o.id_tecnico,
                        motivo: "Servicio asignado a otro técnico"
                    });

                    // Notificar
                    const tecnico = await Usuario.findByPk(o.id_tecnico);
                    if (tecnico.token_real) {
                        await sendPush(tecnico.token_real, {
                            title: "Servicio asignado",
                            body: "El cliente seleccionó otra oferta"
                        });
                    }
                }
            }

            // Notificar al técnico ganador
            const tecnicoGanador = await Usuario.findByPk(oferta.id_tecnico);
            if (tecnicoGanador.token_real) {
                await sendPush(tecnicoGanador.token_real, {
                    title: "¡Oferta seleccionada!",
                    body: "El cliente eligió tu oferta"
                });
            }

            // Emitir evento de servicio asignado
            io.to(`solicitud_${id_solicitud}`).emit("servicioAsignado", {
                id_servicio: servicio.id_servicio,
                id_tecnico: oferta.id_tecnico,
                mensaje: "El chat grupal se ha cerrado. Continúa en chat 1 a 1"
            });

            // Redirigir al técnico ganador y cliente al chat 1 a 1
            socket.emit("redirigirAchat", {
                id_servicio: servicio.id_servicio
            });
        });

        socket.on("disconnect", () => {
            console.log("🔴 Usuario desconectado:", socket.id);
        });
    });
};
```

---

### **MODIFICACIÓN 5: Controller para Obtener Chat Grupal**

**Archivo:** `src/controllers/chat.controller.js`

```javascript
// Obtener historial del chat grupal (antes de asignar)
async obtenerHistorialGrupal(req, res) {
    try {
        const { id_solicitud } = req.params;

        const mensajes = await ChatMensaje.findAll({
            where: { 
                id_solicitud,
                id_servicio: null // Solo mensajes del chat grupal
            },
            include: [{
                model: Usuario,
                attributes: ['id_usuario', 'nombre', 'apellido', 'foto', 'rol']
            }],
            order: [["fecha", "ASC"]]
        });

        res.json(mensajes);

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error obteniendo historial grupal" });
    }
}
```

**Ruta:** `GET /api/chat/solicitud/:id_solicitud` (requiere autenticación)

---

### **MODIFICACIÓN 6: Actualizar Modelo Index para Relaciones**

**Archivo:** `src/models/index.js`

```javascript
// Agregar relación ChatMensaje con SolicitudServicio
SolicitudServicio.hasMany(ChatMensaje, { 
    foreignKey: "id_solicitud",
    as: "mensajesGrupales"
});
ChatMensaje.belongsTo(SolicitudServicio, { 
    foreignKey: "id_solicitud",
    as: "solicitud"
});
```

---

## 📋 RESUMEN DE CAMBIOS

### **Modelos a Modificar:**
1. ✅ `solicitud_servicio.js` - Agregar `precio_ofrecido` y `fotos`
2. ✅ `chat_mensaje.js` - Agregar `id_solicitud`, `precio`, `es_oferta`

### **Controladores a Modificar:**
1. ✅ `solicitud.controller.js` - Aceptar precio y fotos
2. ✅ `chat.controller.js` - Agregar función para chat grupal

### **Socket.IO a Modificar:**
1. ✅ `chat.socket.js` - Agregar eventos para chat grupal y selección de oferta

### **Rutas a Agregar:**
1. ✅ `GET /api/chat/solicitud/:id_solicitud` - Historial chat grupal

---

## 🎯 FLUJO COMPLETO IMPLEMENTADO

### **1. Cliente Crea Solicitud**
```
POST /api/solicitudes
{
  "id_categoria": 1,
  "descripcion": "Quiero arreglar una puerta, ofrezco 40 Bs.",
  "precio_ofrecido": 40.00,
  "fotos": ["url1", "url2"],
  "lat": -17.3935,
  "lon": -66.1570
}
→ SolicitudServicio creada
→ Notificaciones a técnicos
```

### **2. Técnicos se Unen al Chat Grupal**
```
Socket.IO → joinSolicitudChat { id_solicitud: 1 }
→ Todos los técnicos en sala "solicitud_1"
```

### **3. Técnicos Envían Ofertas en el Chat**
```
Técnico 1 → enviarMensajeGrupal {
  "id_solicitud": 1,
  "mensaje": "Yo lo hago por 30 Bs.",
  "precio": 30.00
}
→ ChatMensaje creado (es_oferta: true)
→ OfertaTecnico creada automáticamente
→ Mensaje visible para todos en el chat
```

### **4. Cliente Ve Todas las Ofertas**
```
GET /api/chat/solicitud/1
→ Retorna todos los mensajes con ofertas
→ Frontend muestra lista de ofertas
```

### **5. Cliente Selecciona Oferta**
```
Socket.IO → seleccionarOferta {
  "id_solicitud": 1,
  "id_mensaje_oferta": 5
}
→ ServicioAsignado creado
→ Otros técnicos expulsados del chat
→ Chat grupal cerrado
→ Chat 1 a 1 iniciado
```

### **6. Chat 1 a 1 Continúa**
```
Socket.IO → joinRoom { id_servicio: 1 }
Socket.IO → enviarMensaje
→ Solo cliente y técnico ganador
```

---

## ✅ CONCLUSIÓN

**Tu backend SÍ puede hacer la idea**, pero necesitas estas modificaciones:

1. ✅ Agregar `precio_ofrecido` y `fotos` a SolicitudServicio
2. ✅ Modificar ChatMensaje para soportar chat grupal
3. ✅ Actualizar Socket.IO para chat grupal y selección de oferta
4. ✅ Agregar lógica para expulsar técnicos del chat

**Tiempo estimado de implementación:** 4-6 horas

**¿Quieres que implemente estos cambios?**

