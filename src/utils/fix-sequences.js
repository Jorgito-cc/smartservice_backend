/**
 * Auto-fix para secuencias desincronizadas en PostgreSQL
 * Se ejecuta automáticamente cuando inicia el servidor
 */

const { sequelize } = require("../models");

async function fixAllSequences() {
    try {
        console.log("🔄 Verificando y reseteando secuencias...");

        const sequences = [
            { table: 'categoria', column: 'id_categoria', seq: 'categoria_id_categoria_seq' },
            { table: 'solicitud_servicio', column: 'id_solicitud', seq: 'solicitud_servicio_id_solicitud_seq' },
            { table: 'auditoria_log', column: 'id_log', seq: 'auditoria_log_id_log_seq' },
            { table: 'chat_mensaje', column: 'id_mensaje', seq: 'chat_mensaje_id_mensaje_seq' },
            { table: 'usuario', column: 'id_usuario', seq: 'usuario_id_usuario_seq' },
            { table: 'tecnico', column: 'id_tecnico', seq: 'tecnico_id_tecnico_seq' },
            { table: 'notificacion', column: 'id_notificacion', seq: 'notificacion_id_notificacion_seq' },
            { table: 'incidencia', column: 'id_incidencia', seq: 'incidencia_id_incidencia_seq' },
            { table: 'pago_servicio', column: 'id_pago', seq: 'pago_servicio_id_pago_seq' },
            { table: 'calificacion', column: 'id_calificacion', seq: 'calificacion_id_calificacion_seq' },
            { table: 'oferta_tecnico', column: 'id_oferta', seq: 'oferta_tecnico_id_oferta_seq' },
            { table: 'servicio_asignado', column: 'id_servicio', seq: 'servicio_asignado_id_servicio_seq' },
            { table: 'especialidad', column: 'id_especialidad', seq: 'especialidad_id_especialidad_seq' },
            { table: 'zona', column: 'id_zona', seq: 'zona_id_zona_seq' }
        ];

        for (const { table, column, seq } of sequences) {
            try {
                // Obtener el máximo ID actual
                const [result] = await sequelize.query(`SELECT COALESCE(MAX(${column}), 0) as max_id FROM ${table};`);
                const maxId = result[0].max_id;
                const nextId = parseInt(maxId) + 1;

                // Resetear la secuencia
                await sequelize.query(`SELECT SETVAL('${seq}', ${nextId});`);
                console.log(`✅ ${table}: Secuencia reseteada a ${nextId}`);
            } catch (err) {
                console.warn(`⚠️ ${table}: No se pudo resetear - ${err.message}`);
            }
        }

        console.log("✨ Todas las secuencias han sido verificadas y reseteadas\n");
    } catch (err) {
        console.error("❌ Error al resetear secuencias:", err.message);
    }
}

module.exports = fixAllSequences;
