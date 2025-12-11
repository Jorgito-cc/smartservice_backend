const { SolicitudServicio, Cliente, Categoria, Usuario, Tecnico, TecnicoZona, Notificacion } = require("../models");
const { Op } = require("sequelize");
const { admin } = require("../utils/firebase");
const { enviarNotificacion, emitirEvento } = require("../utils/notificacion.util");

module.exports = {

    // ===========================
    //     CREAR SOLICITUD
    // ===========================
    async crear(req, res) {
        try {
            console.log("👉 INICIO CREAR SOLICITUD");
            console.log("Body:", req.body);
            console.log("User:", req.user);

            const { id_categoria, descripcion, ubicacion_texto, lat, lon, precio_ofrecido, fotos } = req.body;

            if (!req.user || !req.user.id_usuario) {
                return res.status(401).json({ msg: "Usuario no autenticado o token inválido" });
            }

            const id_cliente = req.user.id_usuario; // VIENE DEL JWT

            // Validar categoría
            if (id_categoria) {
                const categoria = await Categoria.findByPk(id_categoria);
                if (!categoria) {
                    return res.status(400).json({ msg: "Categoría no válida" });
                }
            }

            // Validar que el usuario sea un cliente registrado
            const cliente = await Cliente.findByPk(id_cliente);
            if (!cliente) {
                // Si no existe, lo creamos automáticamente (opcional, depende de tu lógica de registro)
                // O devolvemos error
                console.log("⚠️ Cliente no encontrado en tabla 'cliente', intentando crear...");
                try {
                    await Cliente.create({ id_cliente });
                } catch (err) {
                    return res.status(400).json({ msg: "El usuario no tiene perfil de cliente configurado" });
                }
            }

            // Parsear fotos de forma segura
            let fotosProcesadas = null;
            if (fotos) {
                try {
                    fotosProcesadas = Array.isArray(fotos) ? fotos : JSON.parse(fotos);
                } catch (e) {
                    console.warn("Error parseando fotos, se ignorarán:", e);
                    fotosProcesadas = [];
                }
            }

            // Crear la solicitud
            console.log("👉 Creando registro en BD...");
            const solicitud = await SolicitudServicio.create({
                id_cliente,
                id_categoria,
                descripcion,
                ubicacion_texto,
                lat,
                lon,
                precio_ofrecido: precio_ofrecido || null,
                fotos: fotosProcesadas,
                estado: "pendiente"
            });
            console.log("✅ Solicitud creada ID:", solicitud.id_solicitud);

            // ==============================================
            //   ENVIAR NOTIFICACIÓN A TÉCNICOS DISPONIBLES
            // ==============================================

            // Emitir evento en tiempo real a todos los técnicos conectados
            console.log("👉 Emitiendo evento socket...");
            try {
                emitirEvento("technicians", "new_request", solicitud);
                console.log("✅ Evento emitido");
            } catch (err) {
                console.error("❌ Error emitiendo socket:", err);
            }

            // Buscar técnicos disponibles para push notifications
            console.log("👉 Buscando técnicos...");
            try {
                const tecnicosDisponibles = await Tecnico.findAll({
                    where: { disponibilidad: true },
                    include: [{
                        model: Usuario,
                        where: { rol: 'tecnico', estado: true },
                        attributes: ['id_usuario', 'nombre', 'apellido', 'token_real']
                    }]
                });
                console.log(`✅ Técnicos encontrados: ${tecnicosDisponibles.length}`);

                // Enviar notificaciones push
                const precioTexto = precio_ofrecido ? `Bs. ${precio_ofrecido}` : "Negociable";
                const descripcionCorta = descripcion.length > 100 ? `${descripcion.substring(0, 100)}...` : descripcion;

                for (const t of tecnicosDisponibles) {
                    const usuario = t.Usuario;
                    if (usuario) {
                        await enviarNotificacion(
                            usuario.id_usuario,
                            "Nueva solicitud de servicio",
                            `${descripcionCorta} - Precio: ${precioTexto}`
                        );
                    }
                }
            } catch (err) {
                console.error("❌ Error notificando técnicos:", err);
                // No fallamos la request si falla la notificación
            }

            res.json({
                msg: "Solicitud creada correctamente",
                solicitud
            });

        } catch (error) {
            console.error("ERROR EN CREAR SOLICITUD:", error);
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({ msg: "Error de validación", errors: error.errors.map(e => e.message) });
            }
            // DEBUG: Devolver el error completo para ver qué pasa
            res.status(500).json({
                msg: "Error interno del servidor",
                error: error.toString(),
                stack: error.stack,
                details: error
            });
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
    },

    // ===========================
    //     LISTAR DISPONIBLES PARA TÉCNICOS
    // ===========================
    async listarDisponibles(req, res) {
        try {
            const id_tecnico = req.user.id_usuario;

            // Obtener todas las solicitudes que no están asignadas o completadas
            const solicitudes = await SolicitudServicio.findAll({
                where: {
                    estado: {
                        [Op.in]: ["pendiente", "con_ofertas"]
                    }
                },
                include: [{
                    model: Categoria,
                    attributes: ['id_categoria', 'nombre', 'descripcion']
                }],
                order: [["fecha_publicacion", "DESC"]]
            });

            res.json({
                msg: "Solicitudes disponibles",
                data: solicitudes
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // ===========================
    //  ADMIN: LISTAR TODAS
    // ===========================
    async listarTodas(req, res) {
        try {
            const solicitudes = await SolicitudServicio.findAll({
                include: [
                    {
                        model: Cliente,
                        attributes: ['id_cliente'],
                        include: [{
                            model: Usuario,
                            attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'telefono']
                        }]
                    },
                    {
                        model: Categoria,
                        attributes: ['id_categoria', 'nombre', 'descripcion']
                    },
                    {
                        model: require("../models").ServicioAsignado,
                        required: false,
                        attributes: ['id_servicio', 'id_tecnico'],
                        include: [{
                            model: require("../models").Tecnico,
                            attributes: ['id_tecnico'],
                            include: [{
                                model: Usuario,
                                attributes: ['id_usuario', 'nombre', 'apellido']
                            }]
                        }]
                    }
                ],
                order: [['fecha_publicacion', 'DESC']]
            });

            res.json(solicitudes);

        } catch (error) {
            console.error("❌ ERROR en listarTodas:", error.message);
            console.error("Stack:", error.stack);
            res.status(500).json({ 
                msg: "Error interno del servidor",
                detalle: error.message
            });
        }
    }
};