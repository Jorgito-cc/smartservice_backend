const express = require('express');
const router = express.Router();

// Importar middlewares
const auth = require('../middleware/auth.middleware');  // Verifica autenticación
const role = require('../middleware/role.middleware'); // Verifica roles

// Importar controlador
const controller = require('../controllers/categoria.controller');

/**
 * ============================================
 * RUTAS DE CATEGORÍAS
 * ============================================
 * 
 * RUTAS PROTEGIDAS (requieren autenticación y rol admin):
 * - POST   /api/categorias        - Crear categoría (solo admin)
 * - PUT    /api/categorias/:id    - Actualizar categoría (solo admin)
 * - DELETE /api/categorias/:id    - Eliminar categoría (solo admin)
 * 
 * RUTAS PÚBLICAS (sin autenticación):
 * - GET    /api/categorias        - Listar todas las categorías
 * - GET    /api/categorias/:id    - Obtener una categoría por ID
 */

// ==========================================
// RUTAS PROTEGIDAS (solo admin)
// ==========================================
// Estas rutas requieren:
// 1. Autenticación (token válido) - middleware 'auth'
// 2. Rol de administrador - middleware 'role(['admin'])'

// Crear nueva categoría
router.post("/", auth, role('admin'), controller.crear);

// Actualizar categoría existente
router.put("/:id", auth, role('admin'), controller.actualizar);

// Eliminar categoría
router.delete("/:id", auth, role('admin'), controller.eliminar);

// ==========================================
// RUTAS PÚBLICAS (todos pueden acceder)
// ==========================================
// Estas rutas NO requieren autenticación

// Listar todas las categorías
router.get("/", controller.listar);

// Obtener una categoría por ID
router.get("/:id", controller.obtener);

module.exports = router;
router.get("/:id", controller.obtener);

module.exports = router;