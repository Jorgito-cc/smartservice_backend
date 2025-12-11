/**
 * ============================================
 * CONTROLADOR DE AUDITORÍA
 * ============================================
 * 
 * Este módulo maneja la consulta de logs de auditoría.
 * Los logs se crean automáticamente mediante el middleware de auditoría
 * para todas las operaciones que modifican datos (POST, PUT, PATCH, DELETE).
 */
//asdasdasd
const { AuditoriaLog, Usuario } = require("../models");
//memememe
//afacascasc
//sadasdasdas
module.exports = {
    /**
     * ==========================================
     * FUNCIÓN: listar
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Obtiene todos los logs de auditoría del sistema ordenados por fecha
     * (más recientes primero). Incluye información del usuario que realizó la acción.
     * 
     * PERMISOS:
     * - Requiere autenticación (token válido)
     * - Requiere rol de administrador
     * 
     * RESPUESTA EXITOSA (200):
     * Array de objetos con la siguiente estructura:
     * [
     *   {
     *     id_log: 1,
     *     usuario_id: 1,
     *     accion: "POST /api/categorias",
     *     fecha: "2025-01-20T10:30:00.000Z",
     *     detalles: "{\"body\":{...},\"params\":{...},\"query\":{...}}",
     *     Usuario: {
     *       id_usuario: 1,
     *       nombre: "Admin",
     *       apellido: "Sistema",
     *       email: "admin@email.com",
     *       rol: "admin"
     *     }
     *   },
     *   ...
     * ]
     * 
     * ERRORES POSIBLES:
     * - 401: No autenticado
     * - 403: No tiene permisos (no es admin)
     * - 500: Error del servidor
     */
    async listar(req, res) {
        try {
            // Obtener todos los logs de auditoría
            // include: Incluye los datos del usuario que realizó la acción
            // order: Ordena por fecha descendente (más recientes primero)
            const logs = await AuditoriaLog.findAll({
                include: [{ 
                    model: Usuario,
                    attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'rol'] // Solo incluir estos campos
                }],
                order: [["fecha", "DESC"]] // Ordenar por fecha descendente
            });

            // Retornar los logs
            return res.json(logs);

        } catch (error) {
            // Manejo de errores
            console.error("Error obteniendo auditoría:", error);
            return res.status(500).json({ 
                msg: "Error obteniendo auditoría",
                error: error.message 
            });
        }
    }
};
