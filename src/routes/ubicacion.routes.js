const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/ubicacion.controller");

/**
 * ============================================
 * RUTAS DE UBICACIÓN
 * ============================================
 * 
 * - POST /api/ubicacion/actualizar - Actualizar ubicación del técnico (solo técnicos)
 */

// Actualizar ubicación (solo técnicos)
router.post("/actualizar", auth, role("tecnico"), controller.actualizarUbicacion);

module.exports = router;
