const {
    Incidencia,
    ServicioAsignado,
    Usuario,
    Notificacion,
    AuditoriaLog,
} = require("../models");

const sendPush = require("../utils/firebase");

module.exports = {

    // ==========================================
    //      REGISTRAR UNA INCIDENCIA
    // ==========================================
    async crear(req, res) {
        try {
            const { id_servicio, descripcion } = req.body;
            const id_usuario = req.user.id_usuario;

            // Verificar servicio
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio)
                return res.status(404).json({ msg: "Servicio no existe" });

            // Crear incidencia
            const nueva = await Incidencia.create({
                id_servicio,
                id_usuario_reporta: id_usuario,
                descripcion,
                estado: "pendiente"
            });

            // Notificar a admin
            const adminUsers = await Usuario.findAll({ where: { rol: "admin" } });
            adminUsers.forEach(async (admin) => {
                if (admin.token_real) {
                    await sendPush(admin.token_real, {
                        title: "Nueva Incidencia",
                        body: `Un usuario ha reportado un problema en el servicio #${id_servicio}`
                    });
                }

                await Notificacion.create({
                    id_usuario: admin.id_usuario,
                    titulo: "Nueva incidencia",
                    cuerpo: `Un usuario reportó un problema en el servicio ID ${id_servicio}`
                });
            });

            // Auditoría
            await AuditoriaLog.create({
                usuario_id: id_usuario,
                accion: "CREAR_INCIDENCIA",
                detalles: `Incidencia ID: ${nueva.id_incidencia}`
            });

            res.json({
                msg: "Incidencia registrada correctamente",
                incidencia: nueva
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error registrando incidencia" });
        }
    },
    async listarPorUsuario(req, res) {
        try {
            const id_usuario = req.user.id_usuario;

            const lista = await Incidencia.findAll({
                where: { id_usuario_reporta: id_usuario },
                order: [["fecha_reporte", "DESC"]]
            });

            res.json(lista);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo incidencias" });
        }
    },
    async listarPorServicio(req, res) {
        try {
            const { id_servicio } = req.params;

            const lista = await Incidencia.findAll({
                where: { id_servicio },
                order: [["fecha_reporte", "DESC"]]
            });

            res.json(lista);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo incidencias" });
        }
    },
    async listarTodas(req, res) {
        try {
            // El middleware de roles ya valida que sea admin, pero por seguridad:
            if (req.user.rol !== "admin")
                return res.status(403).json({ msg: "Sin permisos" });

            const lista = await Incidencia.findAll({
                include: [{
                    model: Usuario,
                    attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'rol']
                }],
                order: [["fecha_reporte", "DESC"]]
            });

            res.json(lista);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo incidencias" });
        }
    },
    async cambiarEstado(req, res) {
        try {
            // El middleware de roles ya valida que sea admin, pero por seguridad:
            if (req.user.rol !== "admin")
                return res.status(403).json({ msg: "Sin permisos" });

            const { id_incidencia, estado } = req.body;

            const incidencia = await Incidencia.findByPk(id_incidencia);
            if (!incidencia)
                return res.status(404).json({ msg: "Incidencia no existe" });

            incidencia.estado = estado;
            await incidencia.save();

            // Notificar al usuario que reportó
            const usuario = await Usuario.findByPk(incidencia.id_usuario_reporta);

            if (usuario.token_real) {
                await sendPush(usuario.token_real, {
                    title: "Actualización de incidencia",
                    body: `Tu incidencia #${id_incidencia} ahora está: ${estado}`
                });
            }

            await Notificacion.create({
                id_usuario: usuario.id_usuario,
                titulo: "Incidencia actualizada",
                cuerpo: `Tu incidencia ahora está: ${estado}`
            });

            res.json({ msg: "Estado actualizado", incidencia });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error actualizando estado" });
        }
    }
};
