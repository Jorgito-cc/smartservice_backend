const { Notificacion, Usuario } = require("../models");
const { enviarNotificacion } = require("../utils/notificacion.util");

module.exports = {

    /**
     * ==========================================
     * LISTAR NOTIFICACIONES DEL USUARIO
     * ==========================================
     */
    async listar(req, res) {
        try {
            const id_usuario = req.user.id_usuario;

            const notis = await Notificacion.findAll({
                where: { id_usuario },
                order: [["fecha_envio", "DESC"]]
            });

            res.json(notis);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo notificaciones" });
        }
    },

    /**
     * ==========================================
     * MARCAR TODAS COMO LEÍDAS
     * ==========================================
     */
    async marcarLeidas(req, res) {
        try {
            const id_usuario = req.user.id_usuario;

            await Notificacion.update(
                { leido: true },
                { where: { id_usuario } }
            );

            res.json({ msg: "Notificaciones marcadas como leídas" });

        } catch (error) {
            res.status(500).json({ msg: "Error marcando leídas" });
        }
    },

    /**
     * ==========================================
     * MARCAR UNA NOTIFICACIÓN COMO LEÍDA
     * ==========================================
     */
    async marcarLeida(req, res) {
        try {
            const { id_notificacion } = req.params;
            const id_usuario = req.user.id_usuario;

            const notificacion = await Notificacion.findByPk(id_notificacion);
            if (!notificacion) {
                return res.status(404).json({ msg: "Notificación no encontrada" });
            }

            // Solo puede marcar sus propias notificaciones
            if (notificacion.id_usuario !== id_usuario) {
                return res.status(403).json({ msg: "No puedes marcar esta notificación" });
            }

            await notificacion.update({ leido: true });

            res.json({ msg: "Notificación marcada como leída" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error marcando notificación" });
        }
    },

    /**
     * ==========================================
     * ENVIAR NOTIFICACIÓN (ADMIN O SISTEMA)
     * ==========================================
     */
    async enviar(req, res) {
        try {
            // Solo admin puede enviar notificaciones manualmente
            if (req.user.rol !== "admin") {
                return res.status(403).json({ msg: "Solo administradores pueden enviar notificaciones" });
            }

            const { id_usuario, titulo, cuerpo } = req.body;

            if (!id_usuario || !titulo || !cuerpo) {
                return res.status(400).json({ msg: "Faltan campos requeridos: id_usuario, titulo, cuerpo" });
            }

            // Verificar que el usuario existe
            const usuario = await Usuario.findByPk(id_usuario);
            if (!usuario) {
                return res.status(404).json({ msg: "Usuario no encontrado" });
            }

            // Enviar notificación usando el util
            const notificacion = await enviarNotificacion(id_usuario, titulo, cuerpo);

            res.json({
                msg: "Notificación enviada correctamente",
                notificacion
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error enviando notificación" });
        }
    },

    /**
     * ==========================================
     * ELIMINAR UNA NOTIFICACIÓN
     * ==========================================
     */
    async eliminar(req, res) {
        try {
            const { id_notificacion } = req.params;
            const id_usuario = req.user.id_usuario;

            const notificacion = await Notificacion.findByPk(id_notificacion);
            if (!notificacion) {
                return res.status(404).json({ msg: "Notificación no encontrada" });
            }

            // Solo puede eliminar sus propias notificaciones (o admin puede eliminar cualquiera)
            if (notificacion.id_usuario !== id_usuario && req.user.rol !== "admin") {
                return res.status(403).json({ msg: "No puedes eliminar esta notificación" });
            }

            await notificacion.destroy();

            res.json({ msg: "Notificación eliminada" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error eliminando notificación" });
        }
    },

    /**
     * ==========================================
     * ELIMINAR TODAS LAS NOTIFICACIONES
     * ==========================================
     */
    async eliminarTodas(req, res) {
        try {
            const id_usuario = req.user.id_usuario;

            await Notificacion.destroy({
                where: { id_usuario }
            });

            res.json({ msg: "Todas las notificaciones eliminadas" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error eliminando notificaciones" });
        }
    }
};


// import * as NotiService from "./notificacion.service.js";

// export const enviar = async (req, res) => {
//   const { id_usuario, titulo, cuerpo } = req.body;

//   try {
//     const noti = await NotiService.crearNotificacion(id_usuario, titulo, cuerpo);
//     res.json({ ok: true, notificacion: noti });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };

// export const listar = async (req, res) => {
//   const { id_usuario } = req.params;

//   try {
//     const data = await NotiService.listarPorUsuario(id_usuario);
//     res.json({ ok: true, notificaciones: data });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };

// export const marcarLeida = async (req, res) => {
//   const { id_notificacion } = req.params;

//   try {
//     await NotiService.marcarLeida(id_notificacion);
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };

// export const marcarTodas = async (req, res) => {
//   const id_usuario = req.user.id_usuario;

//   try {
//     await NotiService.marcarTodasLeidas(id_usuario);
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };

// export const eliminar = async (req, res) => {
//   const { id_notificacion } = req.params;

//   try {
//     await NotiService.eliminarNotificacion(id_notificacion);
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };

// export const eliminarTodas = async (req, res) => {
//   const id_usuario = req.user.id_usuario;

//   try {
//     await NotiService.eliminarTodas(id_usuario);
//     res.json({ ok: true });
//   } catch (err) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// };
