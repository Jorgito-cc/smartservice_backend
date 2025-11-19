const { Notificacion } = require("../models");

module.exports = {

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
