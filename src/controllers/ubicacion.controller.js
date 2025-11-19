const { TecnicoUbicacion } = require("../models");

exports.actualizarUbicacion = async (req, res) => {
    const { lat, lon, direccion_texto } = req.body;
    const id_tecnico = req.user.id_usuario;

    await TecnicoUbicacion.create({
        id_tecnico,
        lat,
        lon,
        direccion_texto,
        fecha_actualizacion: new Date()
    });

    res.json({ message: "Ubicación actualizada" });
};
