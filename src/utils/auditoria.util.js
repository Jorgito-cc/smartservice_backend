/**
 * ============================================
 * UTILIDADES DE AUDITORÍA
 * ============================================
 * 
 * Este módulo proporciona funciones auxiliares para registrar
 * logs de auditoría manualmente cuando sea necesario.
 * 
 * NOTA: La mayoría de los logs se crean automáticamente mediante
 * el middleware de auditoría, pero esta función es útil para
 * registrar acciones específicas que no son capturadas automáticamente.
 */

const { AuditoriaLog } = require("../models");

module.exports = {
    /**
     * ==========================================
     * FUNCIÓN: registrar
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Registra manualmente un log de auditoría en la base de datos.
     * Útil para acciones específicas que no son capturadas por el middleware.
     * 
     * PARÁMETROS:
     * @param {number} usuario_id - ID del usuario que realiza la acción
     * @param {string} accion - Descripción de la acción realizada (ej: "CREAR_INCIDENCIA")
     * @param {object} detalles - Objeto con detalles adicionales de la acción
     * 
     * EJEMPLO DE USO:
     * const auditoria = require("../utils/auditoria.util");
     * 
     * await auditoria.registrar(
     *   req.user.id_usuario,
     *   "CREAR_INCIDENCIA",
     *   { 
     *     id_incidencia: nueva.id_incidencia,
     *     id_servicio: id_servicio 
     *   }
     * );
     * 
     * NOTA: Esta función no lanza errores, solo los registra en consola
     * para no interrumpir el flujo de la aplicación.
     */
    registrar: async (usuario_id, accion, detalles) => {
        try {
            // Crear el log de auditoría
            await AuditoriaLog.create({
                usuario_id,                    // ID del usuario
                accion,                        // Descripción de la acción
                detalles: JSON.stringify(detalles) // Detalles en formato JSON string
            });
        } catch (e) {
            // Si hay error, solo lo registra en consola sin interrumpir la aplicación
            console.error("Error auditoría manual:", e);
        }
    }
};
