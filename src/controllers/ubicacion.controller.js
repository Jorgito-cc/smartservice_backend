const { TecnicoUbicacion } = require("../models");

module.exports = {
    /**
     * ==========================================
     * ACTUALIZAR UBICACIÓN DEL TÉCNICO
     * ==========================================
     * Permite a un técnico actualizar su ubicación actual.
     * Útil para que los clientes vean dónde está el técnico.
     */
    async actualizarUbicacion(req, res) {
        try {
            const { lat, lon, direccion_texto } = req.body;
            const id_tecnico = req.user.id_usuario;

            if (!lat || !lon) {
                return res.status(400).json({ msg: "Latitud y longitud son requeridas" });
            }

            await TecnicoUbicacion.create({
                id_tecnico,
                lat,
                lon,
                direccion_texto: direccion_texto || null,
                fecha_actualizacion: new Date()
            });

            res.json({ 
                msg: "Ubicación actualizada correctamente",
                ubicacion: { lat, lon, direccion_texto }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error actualizando ubicación" });
        }
    }
};
