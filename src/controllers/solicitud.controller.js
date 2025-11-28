const { SolicitudServicio, Cliente, Categoria, Usuario, Tecnico, TecnicoZona, Notificacion } = require("../models");
const { admin } = require("../utils/firebase");
const { enviarNotificacion } = require("../utils/notificacion.util");

module.exports = {

    // ===========================
    //     CREAR SOLICITUD
    // ===========================
    async crear(req, res) {
        try {
            const { id_categoria, descripcion, ubicacion_texto, lat, lon, precio_ofrecido, fotos } = req.body;
            const id_cliente = req.user.id_usuario; // VIENE DEL JWT

            // Crear la solicitud
            const solicitud = await SolicitudServicio.create({
                id_cliente,
                id_categoria,
                descripcion,
                ubicacion_texto,
                lat,
                lon,
                precio_ofrecido: precio_ofrecido || null,
                fotos: fotos ? (Array.isArray(fotos) ? fotos : JSON.parse(fotos)) : null
            });

            // ==============================================
            //   ENVIAR NOTIFICACIÓN A TÉCNICOS DISPONIBLES
            // ==============================================
            // 1) Buscar técnicos de esa categoría
            const tecnicosCategoria = await Tecnico.findAll();

            // 2) Enviar notificaciones a técnicos disponibles
            for (const t of tecnicosCategoria) {
                const usuario = await Usuario.findByPk(t.id_tecnico);
                if (usuario && t.disponibilidad === true) {
                    // Enviar notificación usando el util (maneja push y BD)
                    const precioTexto = precio_ofrecido ? `Bs. ${precio_ofrecido}` : "Negociable";
                    await enviarNotificacion(
                        usuario.id_usuario,
                        "Nueva solicitud de servicio",
                        `${descripcion} - Precio ofrecido: ${precioTexto}`
                    );
                }
            }

            res.json({
                msg: "Solicitud creada correctamente",
                solicitud
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ===========================
    //     LISTAR POR CLIENTE
    // ===========================
    async listarPorCliente(req, res) {
        try {
            const id_cliente = req.user.id_usuario;

            const solicitudes = await SolicitudServicio.findAll({
                where: { id_cliente },
                order: [["id_solicitud", "DESC"]]
            });

            res.json(solicitudes);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ===========================
    //     OBTENER UNA SOLICITUD
    // ===========================
    async obtener(req, res) {
        try {
            const { id } = req.params;

            const solicitud = await SolicitudServicio.findByPk(id);
            if (!solicitud)
                return res.status(404).json({ msg: "Solicitud no encontrada" });

            res.json(solicitud);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ===========================
    //     CAMBIAR ESTADO
    // ===========================
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const solicitud = await SolicitudServicio.findByPk(id);
            if (!solicitud)
                return res.status(404).json({ msg: "Solicitud no encontrada" });

            await solicitud.update({ estado });

            res.json({ msg: "Estado actualizado", solicitud });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    }
};
