const express = require("express");
const router = express.Router();

// Importar middlewares
const auth = require("../middleware/auth.middleware");  // Verifica autenticación
const role = require("../middleware/role.middleware"); // Verifica roles

// Importar controlador
const controller = require("../controllers/auditoria.controller");
//fsfsfd 
/**
 * ============================================
 * RUTAS DE AUDITORÍA
 * ============================================
 * 
 * RUTAS PROTEGIDAS (requieren autenticación y rol admin):
 * - GET /api/auditoria - Listar todos los logs de auditoría (solo admin)
 * 
 * NOTA: Los logs de auditoría se crean automáticamente mediante
 * el middleware de auditoría para todas las operaciones POST, PUT, PATCH, DELETE
 */

// Listar todos los logs de auditoría (solo admin)
router.get("/", auth, role('admin'), controller.listar);

module.exports = router;
