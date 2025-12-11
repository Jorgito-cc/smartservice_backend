const { Especialidad } = require("../models");

module.exports = {

    // =============================
    //        CREAR ESPECIALIDAD
    // =============================
    async crear(req, res) {
        try {
            const { nombre, referencias, anio_experiencia } = req.body;

            const existe = await Especialidad.findOne({ where: { nombre } });
            if (existe)
                return res.status(400).json({ msg: "La especialidad ya existe" });

            const especialidad = await Especialidad.create({
                nombre,
                referencias,
                anio_experiencia
            });

            res.json({
                msg: "Especialidad creada correctamente",
                especialidad
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //           LISTAR
    // =============================
    async listar(req, res) {
        try {
            const especialidades = await Especialidad.findAll();
            res.json(especialidades);

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //        OBTENER POR ID
    // =============================
    async obtener(req, res) {
        try {
            const { id } = req.params;

            const especialidad = await Especialidad.findByPk(id);
            if (!especialidad)
                return res.status(404).json({ msg: "Especialidad no encontrada" });

            res.json(especialidad);

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //          ACTUALIZAR
    // =============================
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const data = req.body;

            const especialidad = await Especialidad.findByPk(id);
            if (!especialidad)
                return res.status(404).json({ msg: "Especialidad no encontrada" });

            await especialidad.update(data);

            res.json({
                msg: "Especialidad actualizada correctamente",
                especialidad
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

    // =============================
    //           ELIMINAR
    // =============================
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const especialidad = await Especialidad.findByPk(id);
            if (!especialidad)
                return res.status(404).json({ msg: "Especialidad no encontrada" });

            await especialidad.destroy();

            res.json({ msg: "Especialidad eliminada" });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error interno del servidor" });
        }
    },

};
