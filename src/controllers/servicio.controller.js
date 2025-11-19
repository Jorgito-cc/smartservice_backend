const {
    ServicioAsignado,
    SolicitudServicio,
    OfertaTecnico,
    Usuario,
    Notificacion
} = require("../models");

const admin = require("firebase-admin");

module.exports = {

    // ==========================================
    //        CLIENTE ASIGNA UN SERVICIO
    // ==========================================
    async asignar(req, res) {
        try {
            const id_cliente = req.user.id_usuario;
            const { id_oferta } = req.body;

            // 1. Buscar oferta ganadora
            const oferta = await OfertaTecnico.findByPk(id_oferta);
            if (!oferta) return res.status(404).json({ msg: "Oferta no encontrada" });

            // 2. Verificar que la solicitud pertenezca al cliente
            const solicitud = await SolicitudServicio.findByPk(oferta.id_solicitud);
            if (solicitud.id_cliente !== id_cliente)
                return res.status(403).json({ msg: "No puedes asignar esta solicitud" });

            // 3. Verificar que no tenga ya un servicio asignado
            const yaAsignado = await ServicioAsignado.findOne({
                where: { id_solicitud: solicitud.id_solicitud }
            });

            if (yaAsignado)
                return res.status(400).json({ msg: "Esta solicitud ya tiene técnico asignado" });

            // 4. Crear servicio asignado
            const servicio = await ServicioAsignado.create({
                id_solicitud: solicitud.id_solicitud,
                id_oferta: oferta.id_oferta,
                id_tecnico: oferta.id_tecnico,
                estado: "en_camino"
            });

            // 5. Cambiar estado de solicitud
            await solicitud.update({ estado: "asignado" });

            // 6. Notificar al técnico
            const tecnico = await Usuario.findByPk(oferta.id_tecnico);

            if (tecnico && tecnico.token_real) {
                const payload = {
                    notification: {
                        title: "Has sido seleccionado",
                        body: "Un cliente eligió tu oferta"
                    }
                };
                await admin.messaging().sendToDevice(tecnico.token_real, payload);

                await Notificacion.create({
                    id_usuario: tecnico.id_usuario,
                    titulo: "Oferta seleccionada",
                    cuerpo: "Un cliente te asignó un servicio"
                });
            }

            res.json({
                msg: "Servicio asignado correctamente",
                servicio
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ==========================================
    //         CAMBIAR ESTADO DEL SERVICIO
    // ==========================================
    async cambiarEstado(req, res) {
        try {
            const id_tecnico = req.user.id_usuario;
            const { id_servicio } = req.params;
            const { estado } = req.body;

            // Validar estados permitidos
            const permitidos = ["en_camino", "en_ejecucion", "completado"];
            if (!permitidos.includes(estado))
                return res.status(400).json({ msg: "Estado inválido" });

            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio) return res.status(404).json({ msg: "Servicio no encontrado" });

            // Validar que sea su servicio
            if (servicio.id_tecnico !== id_tecnico)
                return res.status(403).json({ msg: "No puedes actualizar este servicio" });

            await servicio.update({ estado });

            // Notificar al cliente
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);
            const cliente = await Usuario.findByPk(solicitud.id_cliente);

            if (cliente.token_real) {
                await admin.messaging().sendToDevice(cliente.token_real, {
                    notification: {
                        title: "Actualización del servicio",
                        body: `El técnico cambió el estado a: ${estado}`
                    }
                });

                await Notificacion.create({
                    id_usuario: cliente.id_usuario,
                    titulo: "Estado del servicio actualizado",
                    cuerpo: `Nuevo estado: ${estado}`
                });
            }

            res.json({
                msg: "Estado actualizado correctamente",
                servicio
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ==========================================
    //       OBTENER DETALLE DEL SERVICIO
    // ==========================================
    async obtener(req, res) {
        try {
            const { id_servicio } = req.params;

            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio) return res.status(404).json({ msg: "No encontrado" });

            res.json(servicio);

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno" });
        }
    }
};
