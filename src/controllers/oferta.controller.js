const { SolicitudServicio, OfertaTecnico, Usuario, Cliente, Notificacion } = require("../models");
const admin = require("firebase-admin");

module.exports = {

    // ==========================================
    //      TÉCNICO CREA UNA OFERTA
    // ==========================================
    async crear(req, res) {
        try {
            const id_tecnico = req.user.id_usuario;  // viene del JWT
            const { id_solicitud, precio, mensaje } = req.body;

            // 1. Validar solicitud
            const solicitud = await SolicitudServicio.findByPk(id_solicitud);
            if (!solicitud) {
                return res.status(404).json({ msg: "Solicitud no encontrada" });
            }

            // 2. Validar que un técnico no envíe varias ofertas
            const yaExiste = await OfertaTecnico.findOne({
                where: { id_solicitud, id_tecnico }
            });

            if (yaExiste) {
                return res.status(400).json({ msg: "Ya enviaste una oferta a esta solicitud" });
            }

            // 3. Crear oferta
            const oferta = await OfertaTecnico.create({
                id_solicitud,
                id_tecnico,
                precio,
                mensaje
            });

            // 4. Notificar al cliente
            const cliente = await Usuario.findByPk(solicitud.id_cliente);

            if (cliente && cliente.token_real) {
                const payload = {
                    notification: {
                        title: "Nueva oferta recibida",
                        body: `Un técnico te ofertó Bs. ${precio}`
                    }
                };
                await admin.messaging().sendToDevice(cliente.token_real, payload);

                // Guardar historial
                await Notificacion.create({
                    id_usuario: cliente.id_usuario,
                    titulo: "Nueva oferta",
                    cuerpo: `Has recibido una oferta por Bs. ${precio}`
                });
            }

            res.json({
                msg: "Oferta creada correctamente",
                oferta
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor", error });
        }
    },

    // ==========================================
    //   LISTAR OFERTAS DE UNA SOLICITUD
    // ==========================================
    async listarPorSolicitud(req, res) {
        try {
            const { id_solicitud } = req.params;

            const ofertas = await OfertaTecnico.findAll({
                where: { id_solicitud },
                order: [["precio", "ASC"]]
            });

            res.json(ofertas);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ==========================================
    //          OBTENER DETALLE OFERTA
    // ==========================================
    async obtener(req, res) {
        try {
            const { id } = req.params;

            const oferta = await OfertaTecnico.findByPk(id);
            if (!oferta) {
                return res.status(404).json({ msg: "Oferta no encontrada" });
            }

            res.json(oferta);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    }
};
