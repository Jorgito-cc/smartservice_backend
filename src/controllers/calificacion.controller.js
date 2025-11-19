const {
    Calificacion,
    ServicioAsignado,
    PagoServicio,
    Usuario,
    Tecnico,
    sequelize
} = require("../models");

module.exports = {

    // ==========================================
    //         REGISTRAR CALIFICACIÓN
    // ==========================================
    async crear(req, res) {
        try {
            const { id_servicio, puntuacion, comentario } = req.body;
            const id_cliente = req.user.id_usuario;

            // 1. Verificar servicio
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio)
                return res.status(404).json({ msg: "Servicio no encontrado" });

            // 2. Verificar que el cliente es dueño del servicio
            const solicitud = await sequelize.models.SolicitudServicio.findByPk(servicio.id_solicitud);
            if (solicitud.id_cliente !== id_cliente)
                return res.status(403).json({ msg: "No puedes calificar este servicio" });

            // 3. Verificar que está completado
            if (servicio.estado !== "completado")
                return res.status(400).json({ msg: "Solo se pueden calificar servicios completados" });

            // 4. Verificar pago
            const pago = await PagoServicio.findOne({ where: { id_servicio } });
            if (!pago || pago.estado !== "pagado")
                return res.status(400).json({ msg: "Debes pagar antes de calificar" });

            // 5. Evitar calificación duplicada
            const existe = await Calificacion.findOne({ where: { id_servicio } });
            if (existe)
                return res.status(400).json({ msg: "Este servicio ya fue calificado" });

            // 6. Crear calificación
            const nueva = await Calificacion.create({
                id_servicio,
                id_cliente,
                id_tecnico: servicio.id_tecnico,
                puntuacion,
                comentario
            });

            // 7. Recalcular promedio del técnico
            const promedio = await Calificacion.findAll({
                where: { id_tecnico: servicio.id_tecnico },
                attributes: [
                    [sequelize.fn("AVG", sequelize.col("puntuacion")), "promedio"]
                ]
            });

            const valor = Number(promedio[0].dataValues.promedio).toFixed(2);

            await Tecnico.update(
                { calificacion_promedio: valor },
                { where: { id_tecnico: servicio.id_tecnico } }
            );

            res.json({
                msg: "Calificación registrada",
                calificacion: nueva,
                promedio_tecnico: valor
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error registrando calificación" });
        }
    },
        // ==========================================
    //     OBTENER CALIFICACIONES DE TÉCNICO
    // ==========================================
    async listarPorTecnico(req, res) {
        try {
            const { id_tecnico } = req.params;

            const lista = await Calificacion.findAll({
                where: { id_tecnico },
                order: [["fecha", "DESC"]]
            });

            res.json(lista);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo calificaciones" });
        }
    }
};

