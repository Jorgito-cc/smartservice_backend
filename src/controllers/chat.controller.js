const { ChatMensaje, Usuario, ServicioAsignado, Notificacion } = require("../models");
const sendPush = require("../utils/firebase");

module.exports = {

    async obtenerHistorial(req, res) {
        try {
            const { id_servicio } = req.params;

            const mensajes = await ChatMensaje.findAll({
                where: { id_servicio },
                order: [["fecha", "ASC"]]
            });

            res.json(mensajes);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo historial" });
        }
    },
    async enviarMensaje(req, res) {
        try {
            const { id_servicio, mensaje } = req.body;
            const emisor_id = req.user.id_usuario;

            const nuevo = await ChatMensaje.create({
                id_servicio,
                emisor_id,
                mensaje
            });

            res.json(nuevo);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error enviando mensaje" });
        }
    },
    async marcarLeidos(req, res) {
        try {
            const { id_servicio } = req.params;
            const id_usuario = req.user.id_usuario;

            await ChatMensaje.update(
                { leido: true },
                {
                    where: {
                        id_servicio,
                        emisor_id: { [Op.ne]: id_usuario }
                    }
                }
            );

            res.json({ msg: "Mensajes marcados como leídos" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error marcando leídos" });
        }
    }
};
