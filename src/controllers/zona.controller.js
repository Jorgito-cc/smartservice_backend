const { Zona } = require("../models");

module.exports = {

    // =============================
    //      CREAR ZONA (ADMIN)
    // =============================
    async crear(req, res) {
        try {
            const { nombre, ciudad, coordenadas } = req.body;

            const existe = await Zona.findOne({ where: { nombre } });
            if (existe)
                return res.status(400).json({ msg: "La zona ya existe" });

            const zona = await Zona.create({ nombre, ciudad, coordenadas });

            res.json({
                msg: "Zona creada correctamente",
                zona
            });

        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //        LISTAR ZONAS
    // =============================
    async listar(req, res) {
        try {
            const zonas = await Zona.findAll();
            res.json(zonas);

        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //       OBTENER POR ID
    // =============================
    async obtener(req, res) {
        try {
            const { id } = req.params;

            const zona = await Zona.findByPk(id);
            if (!zona)
                return res.status(404).json({ msg: "Zona no encontrada" });

            res.json(zona);

        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //          ACTUALIZAR
    // =============================
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, ciudad, coordenadas } = req.body;

            const zona = await Zona.findByPk(id);
            if (!zona)
                return res.status(404).json({ msg: "Zona no encontrada" });

            await zona.update({ nombre, ciudad, coordenadas });

            res.json({
                msg: "Zona actualizada correctamente",
                zona
            });

        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //          ELIMINAR
    // =============================
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const zona = await Zona.findByPk(id);
            if (!zona)
                return res.status(404).json({ msg: "Zona no encontrada" });

            await zona.destroy();

            res.json({ msg: "Zona eliminada" });

        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

};
