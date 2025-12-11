const { ChatMensaje, Usuario, Notificacion, SolicitudServicio, ServicioAsignado, OfertaTecnico } = require("../models");
const { Op } = require("sequelize");
const { verifyToken } = require("../utils/generateJWT");
const { enviarNotificacion } = require("../utils/notificacion.util");

module.exports = (io) => {

    // Middleware de autenticación para Socket.IO
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            // Permitir conexión pero requerir autenticación después
            return next();
        }

        try {
            const decoded = verifyToken(token);
            if (decoded) {
                socket.userId = decoded.id_usuario;
                socket.userRol = decoded.rol;
            }
        } catch (err) {
            // Token inválido, pero permitir conexión
            console.log("⚠️ Token inválido en socket:", err.message);
        }
        next();
    });

    io.on("connection", (socket) => {
        console.log("🔵 Usuario conectado:", socket.id);

        // Autenticar usuario si envía id_usuario
        socket.on("authUser", async ({ id_usuario }) => {
            try {
                const usuario = await Usuario.findByPk(id_usuario);
                if (usuario && usuario.estado === true) {
                    socket.userId = id_usuario;
                    socket.userRol = usuario.rol;
                    socket.join(`user_${id_usuario}`);

                    // Si es técnico, unir a sala de técnicos para recibir nuevas solicitudes
                    if (usuario.rol === 'tecnico') {
                        socket.join('technicians');
                        console.log(`🟢 Técnico ${id_usuario} unido a sala 'technicians'`);
                    }

                    console.log(`🟢 Usuario ${id_usuario} autenticado y unido a user_${id_usuario}`);
                } else {
                    console.log(`⚠️ Usuario ${id_usuario} no encontrado o deshabilitado`);
                }
            } catch (err) {
                console.error("Error autenticando usuario en socket:", err);
            }
        });

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
            try {
                const { id_solicitud, emisor_id, mensaje, precio } = data;

                // Validar que el emisor_id coincida con el usuario autenticado
                if (socket.userId && socket.userId !== emisor_id) {
                    return socket.emit("error", { msg: "No autorizado" });
                }

                // Verificar que la solicitud existe y no está asignada
                const solicitud = await SolicitudServicio.findByPk(id_solicitud);
                if (!solicitud) {
                    return socket.emit("error", { msg: "Solicitud no encontrada" });
                }

                if (solicitud.estado === "asignado" || solicitud.estado === "completado") {
                    return socket.emit("error", { msg: "Esta solicitud ya fue asignada" });
                }

                // Si tiene precio, es una oferta
                const esOferta = precio !== null && precio !== undefined && precio > 0;

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
                    // Verificar que el técnico no haya enviado ya una oferta
                    const ofertaExistente = await OfertaTecnico.findOne({
                        where: { id_solicitud, id_tecnico: emisor_id }
                    });

                    if (!ofertaExistente) {
                        const oferta = await OfertaTecnico.create({
                            id_solicitud,
                            id_tecnico: emisor_id,
                            precio,
                            mensaje,
                            estado: "enviada"
                        });

                        // Actualizar estado de solicitud
                        if (solicitud.estado === "pendiente") {
                            await solicitud.update({ estado: "con_ofertas" });
                        }
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
                if (emisor.rol === 'tecnico' && solicitud.id_cliente !== emisor_id) {
                    const cliente = await Usuario.findByPk(solicitud.id_cliente);
                    if (cliente && cliente.token_real) {
                        await sendPush(cliente.token_real, {
                            title: esOferta ? "Nueva oferta recibida" : "Nuevo mensaje",
                            body: esOferta ? `Oferta: Bs. ${precio}` : mensaje
                        });
                    }
                }
            } catch (error) {
                console.error("Error en enviarMensajeGrupal:", error);
                socket.emit("error", { msg: "Error enviando mensaje grupal" });
            }
        });

        // ==========================================
        // ENVIAR MENSAJE EN CHAT 1 A 1
        // ==========================================
        socket.on("enviarMensaje", async (data) => {
            try {
                const { id_servicio, emisor_id, mensaje } = data;

                // Validar que el emisor_id coincida con el usuario autenticado
                if (socket.userId && socket.userId !== emisor_id) {
                    return socket.emit("error", { msg: "No autorizado" });
                }

                // Guardar en BD
                const nuevoMensaje = await ChatMensaje.create({
                    id_servicio, // Chat 1 a 1
                    id_solicitud: null, // Ya no es chat grupal
                    emisor_id,
                    mensaje
                });

                // Obtener datos del emisor
                const emisor = await Usuario.findByPk(emisor_id, {
                    attributes: ['id_usuario', 'nombre', 'apellido', 'foto', 'rol']
                });

                // Emitir a todos en la sala
                io.to(`servicio_${id_servicio}`).emit("nuevoMensaje", {
                    ...nuevoMensaje.toJSON(),
                    emisor: emisor.toJSON()
                });

                // Notificaciones push
                const servicio = await ServicioAsignado.findByPk(id_servicio);
                if (servicio) {
                    const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);

                    // Determinar receptor
                    const receptor_id = servicio.id_tecnico === emisor_id
                        ? solicitud.id_cliente
                        : servicio.id_tecnico;

                    const receptor = await Usuario.findByPk(receptor_id);
                    if (receptor && receptor.token_real) {
                        await sendPush(receptor.token_real, {
                            title: "Nuevo mensaje",
                            body: mensaje
                        });
                    }
                }
            } catch (error) {
                console.error("Error en enviarMensaje:", error);
                socket.emit("error", { msg: "Error enviando mensaje" });
            }
        });

        // ==========================================
        // CLIENTE SELECCIONA OFERTA
        // ==========================================
        socket.on("seleccionarOferta", async (data) => {
            try {
                const { id_solicitud, id_mensaje_oferta } = data;
                const id_cliente = socket.userId || data.id_cliente;

                if (!id_cliente) {
                    return socket.emit("error", { msg: "No autenticado" });
                }

                // Obtener el mensaje que contiene la oferta
                const mensajeOferta = await ChatMensaje.findByPk(id_mensaje_oferta, {
                    include: [{
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'apellido', 'foto', 'rol']
                    }]
                });

                if (!mensajeOferta || !mensajeOferta.es_oferta) {
                    return socket.emit("error", { msg: "Mensaje no es una oferta válida" });
                }

                // Verificar que la solicitud pertenece al cliente
                const solicitud = await SolicitudServicio.findByPk(id_solicitud);
                if (!solicitud) {
                    return socket.emit("error", { msg: "Solicitud no encontrada" });
                }

                if (solicitud.id_cliente !== id_cliente) {
                    return socket.emit("error", { msg: "No tienes permiso para esta acción" });
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

                // Verificar que no haya servicio asignado ya
                const servicioExistente = await ServicioAsignado.findOne({
                    where: { id_solicitud }
                });

                if (servicioExistente) {
                    return socket.emit("error", { msg: "Esta solicitud ya tiene un servicio asignado" });
                }

                // Crear ServicioAsignado
                const servicio = await ServicioAsignado.create({
                    id_solicitud,
                    id_oferta: oferta.id_oferta,
                    id_tecnico: oferta.id_tecnico,
                    estado: "en_camino"
                });

                // Actualizar solicitud
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
                        if (tecnico && tecnico.token_real) {
                            await sendPush(tecnico.token_real, {
                                title: "Servicio asignado",
                                body: "El cliente seleccionó otra oferta"
                            });
                        }
                    }
                }

                // Notificar al técnico ganador
                const tecnicoGanador = await Usuario.findByPk(oferta.id_tecnico);
                if (tecnicoGanador && tecnicoGanador.token_real) {
                    await enviarNotificacion(
                        tecnicoGanador.id_usuario,
                        "¡Oferta seleccionada!",
                        "El cliente eligió tu oferta"
                    );
                }

                // Emitir evento de servicio asignado
                io.to(`solicitud_${id_solicitud}`).emit("servicioAsignado", {
                    id_servicio: servicio.id_servicio,
                    id_tecnico: oferta.id_tecnico,
                    tecnico: mensajeOferta.Usuario.toJSON(),
                    mensaje: "El chat grupal se ha cerrado. Continúa en chat 1 a 1"
                });

                // Redirigir al técnico ganador y cliente al chat 1 a 1
                io.to(`solicitud_${id_solicitud}`).emit("redirigirAchat", {
                    id_servicio: servicio.id_servicio
                });

            } catch (error) {
                console.error("Error en seleccionarOferta:", error);
                socket.emit("error", { msg: "Error seleccionando oferta" });
            }
        });

        // typing
        socket.on("typing", ({ id_servicio, usuario }) => {
            socket.to(`servicio_${id_servicio}`).emit("typing", usuario);
        });

        socket.on("typingGrupal", ({ id_solicitud, usuario }) => {
            socket.to(`solicitud_${id_solicitud}`).emit("typing", usuario);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Usuario desconectado:", socket.id);
        });

    });
};
