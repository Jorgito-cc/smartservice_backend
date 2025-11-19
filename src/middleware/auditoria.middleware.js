const { AuditoriaLog } = require("../models");

module.exports = async (req, res, next) => {
    // Esperar respuesta
    res.on("finish", async () => {

        // Solo auditar métodos que cambian datos
        if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return;

        try {
            await AuditoriaLog.create({
                usuario_id: req.user?.id_usuario || null,
                accion: `${req.method} ${req.originalUrl}`,
                detalles: JSON.stringify({
                    body: req.body,
                    params: req.params,
                    query: req.query,
                    statusCode: res.statusCode,
                    userAgent: req.headers["user-agent"]
                })
            });

        } catch (error) {
            console.error("❌ Error guardando auditoría:", error);
        }
    });

    next();
};
