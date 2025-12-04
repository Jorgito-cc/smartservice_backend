const { Notificacion, Usuario } = require("../models");
let ioInstance = null; // socket global

module.exports.setSocket = (io) => {
    ioInstance = io;
};

module.exports.enviarNotificacion = async (id_usuario, titulo, cuerpo) => {
    try {
        // Guardar en BD
        const registro = await Notificacion.create({
            id_usuario,
            titulo,
            cuerpo
        });

        // Emitir en Socket.IO si está conectado (reemplaza Firebase push)
        if (ioInstance) {
            ioInstance.to(`user_${id_usuario}`).emit("nuevaNotificacion", registro);
        }

        return registro;
    } catch (err) {
        console.error("❌ Error enviando notificación:", err);
        return null;
    }
};

module.exports.emitirEvento = (room, event, data) => {
    if (ioInstance) {
        ioInstance.to(room).emit(event, data);
    }
};
