/**
 * ML Controller
 * Maneja las solicitudes de machine learning
 * Actúa como proxy hacia el servicio Flask ML
 */

const axios = require("axios");
const { Tecnico, Usuario, TecnicoEspecialidad, Especialidad } = require("../models");

// Variables de configuración
const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
const ML_REQUEST_TIMEOUT = parseInt(process.env.ML_REQUEST_TIMEOUT || "30000");
const ML_MAX_RETRIES = parseInt(process.env.ML_MAX_RETRIES || "2");

/**
 * Obtiene recomendaciones de técnicos para una solicitud
 * POST /api/ml/recomendar
 *
 * Body:
 * {
 *   "id_solicitud": number
 * }
 *
 * Response:
 * {
 *   "id_solicitud": number,
 *   "tecnicos_recomendados": [
 *     {
 *       "id_tecnico": number,
 *       "score": number,
 *       "distancia_km": number,
 *       "rating_promedio": number,
 *       "historico_rating": number,
 *       "cantidad_calificaciones": number,
 *       "precio_promedio": number,
 *       "ofertas_totales": number,
 *       "servicios_realizados": number,
 *       "disponibilidad": number
 *     }
 *   ],
 *   "total": number
 * }
 */
/**
 * Enriquece recomendaciones del ML con datos de técnico de la BD
 */
async function enriquecerRecomendaciones(recomendacionesML) {
  try {
    const recomendacionesEnriquecidas = [];

    for (const rec of recomendacionesML.tecnicos_recomendados) {
      try {
        // Obtener técnico con sus especialidades
        const tecnico = await Tecnico.findByPk(rec.id_tecnico, {
          include: [
            {
              model: Usuario,
              attributes: ["nombre", "apellido", "email", "telefono", "foto"],
            },
            {
              model: TecnicoEspecialidad,
              include: [
                {
                  model: Especialidad,
                  attributes: ["id_especialidad", "nombre"],
                },
              ],
            },
          ],
        });

        if (tecnico) {
          recomendacionesEnriquecidas.push({
            id_tecnico: tecnico.id_tecnico,
            id_usuario: tecnico.id_usuario,
            nombre: tecnico.Usuario?.nombre || "N/A",
            apellido: tecnico.Usuario?.apellido || "N/A",
            email: tecnico.Usuario?.email || "N/A",
            telefono: tecnico.Usuario?.telefono || "N/A",
            foto: tecnico.Usuario?.foto || null,
            calificacion_promedio: tecnico.calificacion_promedio,
            disponibilidad: tecnico.disponibilidad,
            descripcion: tecnico.descripcion,
            especialidades: (tecnico.TecnicoEspecialidads || []).map((te) => ({
              id_especialidad: te.Especialidad?.id_especialidad,
              nombre: te.Especialidad?.nombre,
            })),
            // Datos del ML
            score_recomendacion: rec.score,
            distancia_km: rec.distancia_km,
            rating_promedio: rec.rating_promedio,
            ofertas_totales: rec.ofertas_totales,
            servicios_realizados: rec.servicios_realizados,
          });
        }
      } catch (err) {
        console.error(`[ML Controller] Error enriqueciendo técnico ${rec.id_tecnico}:`, err.message);
      }
    }

    return recomendacionesEnriquecidas;
  } catch (error) {
    console.error("[ML Controller] Error en enriquecimiento:", error);
    throw error;
  }
}

async function obtenerRecomendaciones(req, res) {
  try {
    const { id_solicitud } = req.body;

    // Validar entrada
    if (!id_solicitud || typeof id_solicitud !== "number") {
      return res.status(400).json({
        error: "id_solicitud es requerido y debe ser un número",
      });
    }

    console.log(`[ML Controller] Solicitando recomendaciones para solicitud ${id_solicitud}`);

    // Hacer llamada al servicio Flask ML con reintentos
    let ultimoError = null;

    for (let intento = 0; intento <= ML_MAX_RETRIES; intento++) {
      try {
        const response = await axios.post(
          `${ML_SERVICE_URL}/recomendar`,
          { id_solicitud },
          { timeout: ML_REQUEST_TIMEOUT }
        );

        // Enriquecer recomendaciones con datos de la BD
        const tecnicosEnriquecidos = await enriquecerRecomendaciones(response.data);

        const respuestaFinal = {
          id_solicitud: response.data.id_solicitud,
          tecnicos_recomendados: tecnicosEnriquecidos,
          total: tecnicosEnriquecidos.length,
        };

        console.log(`[ML Controller] ✅ Recomendaciones obtenidas: ${respuestaFinal.total} técnicos`);
        return res.json(respuestaFinal);
      } catch (error) {
        ultimoError = error;

        if (intento < ML_MAX_RETRIES) {
          // Esperar antes de reintentar (backoff exponencial)
          const delayMs = 1000 * Math.pow(2, intento);
          console.warn(
            `[ML Controller] ⚠️  Reintentando en ${delayMs}ms (intento ${intento + 1}/${ML_MAX_RETRIES})`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // Si llegamos aquí, todos los reintentos fallaron
    console.error(`[ML Controller] ❌ Error después de ${ML_MAX_RETRIES} reintentos:`, ultimoError?.message);

    // Determinar si es error de conexión o del servicio
    if (ultimoError?.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Servicio ML no disponible",
        message: "El servicio de machine learning no está activo en este momento",
      });
    }

    if (ultimoError?.response?.status === 503) {
      return res.status(503).json({
        error: "Modelo ML no disponible",
        message:
          ultimoError.response.data?.message ||
          "El modelo no está entrenado. Ejecuta train_model.py",
      });
    }

    // Error genérico
    return res.status(500).json({
      error: "Error obteniendo recomendaciones",
      message: ultimoError?.message || "Error desconocido",
    });
  } catch (error) {
    console.error("[ML Controller] Error inesperado:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: error?.message || "Error desconocido",
    });
  }
}

/**
 * Verifica la salud del servicio ML
 * GET /api/ml/health
 *
 * Response:
 * {
 *   "status": "ok" | "error",
 *   "modelo_cargado": boolean,
 *   "scaler_cargado": boolean,
 *   "modelo_disponible": boolean,
 *   "backend_disponible": boolean,
 *   "flask_url": string
 * }
 */
async function verificarSalud(req, res) {
  try {
    console.log(`[ML Controller] Verificando salud del servicio ML en ${ML_SERVICE_URL}`);

    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    const resultado = {
      ...response.data,
      backend_disponible: true,
      flask_url: ML_SERVICE_URL,
    };

    console.log("[ML Controller] ✅ Servicio ML disponible");
    return res.json(resultado);
  } catch (error) {
    console.error("[ML Controller] ❌ Error verificando salud:", error?.message);

    const resultado = {
      status: "error",
      modelo_cargado: false,
      scaler_cargado: false,
      modelo_disponible: false,
      backend_disponible: false,
      flask_url: ML_SERVICE_URL,
      error: error?.message || "Servicio no disponible",
    };

    return res.status(503).json(resultado);
  }
}

/**
 * Obtiene información del modelo entrenado
 * GET /api/ml/info
 *
 * Response:
 * {
 *   "version": string,
 *   "features": string[],
 *   "entrenamiento": {
 *     "fecha": string,
 *     "registros": number,
 *     "acuracia": number
 *   }
 * }
 */
async function obtenerInfo(req, res) {
  try {
    console.log("[ML Controller] Obteniendo información del modelo");

    // TODO: Implementar endpoint /info en Flask que retorne metadatos del modelo
    // Por ahora, retornamos info básica

    const features = [
      "distancia_km",
      "rating_promedio",
      "historico_rating",
      "cantidad_calificaciones",
      "precio_promedio",
      "ofertas_totales",
      "servicios_realizados",
      "disponibilidad",
    ];

    return res.json({
      version: "1.0",
      features,
      descripcion: "Modelo XGBoost Ranker para recomendación de técnicos",
      flask_url: ML_SERVICE_URL,
    });
  } catch (error) {
    console.error("[ML Controller] Error obteniendo info:", error);
    return res.status(500).json({ error: error?.message });
  }
}

module.exports = {
  obtenerRecomendaciones,
  verificarSalud,
  obtenerInfo,
};
