const express = require("express");
const router = express.Router();
const role = require("../middleware/role.middleware");
const controller = require("../controllers/notificacion.controller");
// NOTA: El middleware 'auth' se aplica globalmente en app.js antes de estas rutas

/**
 * ============================================
 * RUTAS DE NOTIFICACIONES
 * ============================================
 * 
 * - GET    /api/notificaciones           - Listar mis notificaciones
 * - PUT    /api/notificaciones/leidas    - Marcar todas como leídas
 * - POST   /api/notificaciones           - Enviar notificación (solo admin)
 * - DELETE /api/notificaciones/:id       - Eliminar una notificación
 * - DELETE /api/notificaciones           - Eliminar todas mis notificaciones
 */

// Listar mis notificaciones
// NOTA: Si esta ruta está después del middleware global de auth, no necesita 'auth' aquí
router.get("/", controller.listar);

// Marcar todas como leídas
router.put("/leidas", controller.marcarLeidas);

// Marcar una como leída
router.put("/:id_notificacion/leida", controller.marcarLeida);

// Enviar notificación (solo admin)
router.post("/", role("admin"), controller.enviar);

// Eliminar una notificación
router.delete("/:id_notificacion", controller.eliminar);

// Eliminar todas mis notificaciones
router.delete("/", controller.eliminarTodas);

module.exports = router;




// import { Router } from "express";
// import authMiddleware from "../../middlewares/auth.middleware.js";
// import * as NotificacionCtrl from "./notificacion.controller.js";

// const router = Router();

// // Crear notificación (admin o sistema)
// router.post("/", authMiddleware, NotificacionCtrl.enviar);

// // Listar por usuario
// router.get("/:id_usuario", authMiddleware, NotificacionCtrl.listar);

// // Marcar una como leída
// router.put("/leer/:id_notificacion", authMiddleware, NotificacionCtrl.marcarLeida);

// // Marcar todas como leídas
// router.put("/leer-todas", authMiddleware, NotificacionCtrl.marcarTodas);

// // Eliminar una
// router.delete("/:id_notificacion", authMiddleware, NotificacionCtrl.eliminar);

// // Eliminar todas
// router.delete("/", authMiddleware, NotificacionCtrl.eliminarTodas);

// export default router;
