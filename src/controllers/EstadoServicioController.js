import { ServicioAsignado, Usuario } from "../models/index.js";
import { enviarNotificacion } from "../services/FirebaseService.js";

export const actualizarEstado = async (req, res) => {
    try {
        const { id_servicio, estado } = req.body;

        const servicio = await ServicioAsignado.findByPk(id_servicio, {
            include: [{ model: Usuario, as: "cliente" }]
        });

        servicio.estado = estado;
        await servicio.save();

        // Avisar al cliente
        enviarNotificacion(servicio.cliente.token_real, {
            titulo: "Actualización del servicio",
            cuerpo: `El servicio ahora está: ${estado}`
        });

        return res.json({ message: "Estado actualizado" });
    } catch (e) {
        return res.status(500).json({ error: "Error al cambiar estado" });
    }
};
