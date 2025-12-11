/**
 * ML Routes
 * Rutas para integración con servicio Flask ML
 */

const router = require("express").Router();
const controller = require("../controllers/ml.controller");
const verifyToken = require("../middleware/auth.middleware");

/**
 * POST /api/ml/recomendar
 * Obtiene recomendaciones de técnicos para una solicitud
 * @protected - Requiere autenticación JWT
 *
 * Body:
 * {
 *   "id_solicitud": number
 * }
 */
router.post("/recomendar", verifyToken, controller.obtenerRecomendaciones);

/**
 * GET /api/ml/health
 * Verifica la salud del servicio ML
 * @public - No requiere autenticación para permitir health checks automatizados
 *
 * Returns:
 * {
 *   "status": "ok" | "error",
 *   "modelo_cargado": boolean,
 *   "scaler_cargado": boolean,
 *   "modelo_disponible": boolean,
 *   "backend_disponible": boolean,
 *   "flask_url": string
 * }
 */
router.get("/health", controller.verificarSalud);

/**
 * GET /api/ml/info
 * Obtiene información del modelo entrenado
 * @public - No requiere autenticación
 *
 * Returns:
 * {
 *   "version": string,
 *   "features": string[],
 *   "descripcion": string,
 *   "flask_url": string
 * }
 */
router.get("/info", controller.obtenerInfo);

module.exports = router;
