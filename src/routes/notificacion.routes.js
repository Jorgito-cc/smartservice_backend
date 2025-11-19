const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/notificacion.controller");

router.get("/", auth, controller.listar);
router.put("/leidas", auth, controller.marcarLeidas);

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
