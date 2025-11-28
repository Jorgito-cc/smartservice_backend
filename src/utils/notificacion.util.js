const { admin } = require("./firebase");
const { Notificacion, Usuario } = require("../models");
let ioInstance = null; // socket global

module.exports.setSocket = (io) => {
    ioInstance = io;
};

module.exports.enviarNotificacion = async (id_usuario, titulo, cuerpo) => {
    try {
        // Obtener token del usuario
        const user = await Usuario.findByPk(id_usuario);

        // Guardar en BD
        const registro = await Notificacion.create({
            id_usuario,
            titulo,
            cuerpo
        });

        // Si tiene token, enviar push
        if (user?.token_real) {
            await admin.messaging().send({
                token: user.token_real,
                notification: {
                    title: titulo,
                    body: cuerpo
                }
            });
        }

        // Emitir en Socket.IO si está conectado
        if (ioInstance) {
            ioInstance.to(`user_${id_usuario}`).emit("nuevaNotificacion", registro);
        }

        return registro;

    } catch (err) {
        console.error("❌ Error enviando notificación:", err);
        return null;
    }
};
