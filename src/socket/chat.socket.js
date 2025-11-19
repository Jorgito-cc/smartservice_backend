const { ChatMensaje, Usuario, Notificacion } = require("../models");
const sendPush = require("../utils/firebase");

module.exports = (io) => {

    io.on("connection", (socket) => {
        console.log("🔵 Usuario conectado:", socket.id);

        // Usuario se une a sala del servicio
        socket.on("joinRoom", ({ id_servicio }) => {
            socket.join(`servicio_${id_servicio}`);
            console.log(`🟢 Usuario unido a sala servicio_${id_servicio}`);
        });

        // Usuario envía mensaje
        socket.on("enviarMensaje", async (data) => {
            const { id_servicio, emisor_id, mensaje } = data;

            // Guardar en BD
            const nuevo = await ChatMensaje.create({
                id_servicio,
                emisor_id,
                mensaje
            });

            // Emitir a todos en la sala
            io.to(`servicio_${id_servicio}`).emit("nuevoMensaje", nuevo);

            // Buscar receptor
            const usuarios = await Usuario.findAll({
                where: { /* luego según servicio */ }
            });

            // Notificaciones push
            usuarios.forEach(async (u) => {
                if (u.id_usuario !== emisor_id && u.token_real) {
                    await sendPush(u.token_real, {
                        title: "Nuevo mensaje",
                        body: mensaje
                    });

                    await Notificacion.create({
                        id_usuario: u.id_usuario,
                        titulo: "Nuevo mensaje",
                        cuerpo: mensaje
                    });
                }
            });
        });

        // typing
        socket.on("typing", ({ id_servicio, usuario }) => {
            socket.to(`servicio_${id_servicio}`).emit("typing", usuario);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Usuario desconectado:", socket.id);
        });

    });
};
