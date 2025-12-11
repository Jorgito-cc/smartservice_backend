const { ChatMensaje, Usuario, ServicioAsignado, Notificacion, SolicitudServicio } = require("../models");
const { Op } = require("sequelize");
const sendPush = require("../utils/firebase");

module.exports = {

    async obtenerHistorial(req, res) {
        try {
            const { id_servicio } = req.params;

            const mensajes = await ChatMensaje.findAll({
                where: { id_servicio },
                include: [{
                    model: Usuario,
                    attributes: ['id_usuario', 'nombre', 'apellido', 'foto', 'rol']
                }],
                order: [["fecha", "ASC"]]
            });

            res.json(mensajes);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo historial" });
        }
    },

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
