const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/incidencia.controller");

/**
 * ============================================
 * RUTAS DE INCIDENCIAS
 * ============================================
 * 
 * - POST   /api/incidencias                    - Crear incidencia (cualquier usuario autenticado)
 * - GET    /api/incidencias/mias               - Listar mis incidencias
 * - GET    /api/incidencias/servicio/:id       - Listar incidencias de un servicio
 * - GET    /api/incidencias                    - Listar todas (solo admin)
 * - PUT    /api/incidencias/estado             - Cambiar estado (solo admin)
 */

// Crear incidencia (cualquier usuario autenticado)
router.post("/", auth, controller.crear);

// Listar por usuario (mis incidencias)
router.get("/mias", auth, controller.listarPorUsuario);

// Listar por servicio
router.get("/servicio/:id_servicio", auth, controller.listarPorServicio);

// ADMIN — Listar todas las incidencias
router.get("/", auth, role("admin"), controller.listarTodas);

// ADMIN — Cambiar estado de una incidencia
router.put("/estado", auth, role("admin"), controller.cambiarEstado);

module.exports = router;
