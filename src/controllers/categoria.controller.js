const { Categoria } = require("../models");

module.exports = {

    // =============================
    //      CREAR CATEGORÍA
    // =============================
    async crear(req, res) {
        try {
            const { nombre, descripcion } = req.body;

            const existe = await Categoria.findOne({ where: { nombre } });
            if (existe)
                return res.status(400).json({ msg: "La categoría ya existe" });

            const categoria = await Categoria.create({
                nombre,
                descripcion
            });

            return res.json({
                msg: "Categoría creada correctamente",
                categoria
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: "Error interno" });
        }
    },

    // =============================
    //      LISTAR TODO
    // =============================
    async listar(req, res) {
        try {
            const categorias = await Categoria.findAll();
            return res.json(categorias);

        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: "Error interno" });
        }
    },

    // =============================
    //      BUSCAR POR ID
    // =============================
    async obtener(req, res) {
        try {
            const { id } = req.params;

            const categoria = await Categoria.findByPk(id);
            if (!categoria)
                return res.status(404).json({ msg: "Categoría no encontrada" });

            return res.json(categoria);

        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: "Error interno" });
        }
    },

    // =============================
    //        ACTUALIZAR
    // =============================
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion } = req.body;

            const categoria = await Categoria.findByPk(id);
            if (!categoria)
                return res.status(404).json({ msg: "Categoría no encontrada" });

            await categoria.update({ nombre, descripcion });

            return res.json({
                msg: "Categoría actualizada",
                categoria
            });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: "Error interno" });
        }
    },

    // =============================
    //         ELIMINAR
    // =============================
    async eliminar(req, res) {
        try {
            const { id } = req.params;

            const categoria = await Categoria.findByPk(id);
            if (!categoria)
                return res.status(404).json({ msg: "Categoría no encontrada" });

            await categoria.destroy();

            return res.json({ msg: "Categoría eliminada" });

        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: "Error interno" });
        }
    },

};
