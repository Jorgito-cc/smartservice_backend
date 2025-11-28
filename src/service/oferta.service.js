const { oferta_tecnico, solicitud_servicio, servicio_asignado } = require("../models");
const { enviarNotificacion } = require("../utils/notificacion.util");

module.exports = {
    // Crear una oferta del técnico
    async crearOferta(data) {
        // marcar solicitud como "con_ofertas" si estaba "pendiente"
        const solicitud = await solicitud_servicio.findByPk(data.id_solicitud);
        if (!solicitud) throw new Error("Solicitud no existe");

        if (solicitud.estado === "pendiente") {
            solicitud.estado = "con_ofertas";
            await solicitud.save();
        }

        // Crear oferta
        const oferta = await oferta_tecnico.create(data);

        // Notificar al cliente
        await enviarNotificacion(
            solicitud.id_cliente,
            "Nueva oferta recibida",
            "Un técnico ofertó por tu solicitud."
        );

        return oferta;
    },

    // Ver ofertas de una solicitud
    async obtenerPorSolicitud(id_solicitud) {
        return oferta_tecnico.findAll({
            where: { id_solicitud },
            order: [["precio", "ASC"]]
        });
    },

    // CRUD básico
    async obtenerPorId(id) {
        return oferta_tecnico.findByPk(id);
    },

    async eliminar(id) {
        return oferta_tecnico.destroy({ where: { id_oferta: id } });
    },

    // Seleccionar oferta ganadora
    async seleccionarOferta(id_oferta) {
        const oferta = await oferta_tecnico.findByPk(id_oferta);
        if (!oferta) throw new Error("Oferta no existe");

        // Rechazar todas las demás ofertas
        await oferta_tecnico.update(
            { estado: "rechazada" },
            { where: { id_solicitud: oferta.id_solicitud, id_oferta: { [require("sequelize").Op.ne]: id_oferta } } }
        );

        // Marcar ganadora
        oferta.estado = "seleccionada";
        await oferta.save();

        // Crear servicio asignado
        const servicio = await servicio_asignado.create({
            id_solicitud: oferta.id_solicitud,
            id_oferta: oferta.id_oferta,
            id_tecnico: oferta.id_tecnico,
            estado: "en_camino"
        });

        // Notificar técnico ganador
        await enviarNotificacion(
            oferta.id_tecnico,
            "Oferta ganadora",
            "Un cliente te ha seleccionado para un servicio."
        );

        return servicio;
    }
};
