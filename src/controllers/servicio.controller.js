const {
    ServicioAsignado,
    SolicitudServicio,
    OfertaTecnico,
    Usuario,
    Cliente,
    Notificacion
} = require("../models");
const { Op } = require("sequelize");

const { enviarNotificacion } = require("../utils/notificacion.util");

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

            // 6. Notificar al técnico (usa el util que maneja push y BD)
            await enviarNotificacion(
                oferta.id_tecnico,
                "Has sido seleccionado",
                "Un cliente eligió tu oferta"
            );

            // 7. Rechazar otras ofertas de la misma solicitud
            await OfertaTecnico.update(
                { estado: "rechazada" },
                {
                    where: {
                        id_solicitud: solicitud.id_solicitud,
                        id_oferta: { [Op.ne]: oferta.id_oferta }
                    }
                }
            );

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

            // Notificar al cliente (usa el util que maneja push y BD)
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);
            await enviarNotificacion(
                solicitud.id_cliente,
                "Actualización del servicio",
                `El técnico cambió el estado a: ${estado}`
            );

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

            const servicio = await ServicioAsignado.findByPk(id_servicio, {
                include: [{
                    model: SolicitudServicio,
                    include: [{
                        model: Cliente,
                        include: [{
                            model: Usuario,
                            attributes: ['id_usuario', 'nombre', 'apellido', 'telefono', 'foto']
                        }]
                    }]
                }]
            });
            if (!servicio) return res.status(404).json({ msg: "No encontrado" });

            res.json(servicio);

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno" });
        }
    },

    // ==========================================
    //       LISTAR SERVICIOS POR TÉCNICO
    // ==========================================
    async listarPorTecnico(req, res) {
        try {
            const id_tecnico = req.user.id_usuario;

            const servicios = await ServicioAsignado.findAll({
                where: { id_tecnico },
                include: [{
                    model: SolicitudServicio,
                    include: [{
                        model: Cliente,
                        include: [{
                            model: Usuario,
                            attributes: ['id_usuario', 'nombre', 'apellido', 'telefono', 'foto']
                        }]
                    }]
                }],
                order: [["fecha_asignacion", "DESC"]]
            });

            res.json({
                msg: "Servicios del técnico",
                data: servicios
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ==========================================
    //       LISTAR SERVICIOS POR CLIENTE
    // ==========================================
    async listarPorCliente(req, res) {
        try {
            const id_cliente = req.user.id_usuario;

            // Necesitamos incluir el modelo Tecnico que probablemente se llame 'Tecnico' o 'Usuario' dependiendo de la asociación
            // En index.js: ServicioAsignado.belongsTo(Tecnico, { foreignKey: "id_tecnico" });
            // Y Tecnico.belongsTo(Usuario, { foreignKey: "id_usuario" });

            const { Tecnico, Categoria } = require("../models");

            const servicios = await ServicioAsignado.findAll({
                include: [
                    {
                        model: SolicitudServicio,
                        where: { id_cliente }, // Filtrar por el cliente dueño de la solicitud
                        include: [{
                            model: Categoria
                        }]
                    },
                    {
                        model: Tecnico,
                        include: [{
                            model: Usuario,
                            attributes: ['id_usuario', 'nombre', 'apellido', 'telefono', 'foto']
                        }]
                    }
                ],
                order: [["fecha_asignacion", "DESC"]]
            });

            res.json({
                msg: "Servicios del cliente",
                data: servicios
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    }
};
