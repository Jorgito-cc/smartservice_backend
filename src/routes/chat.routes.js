const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chat.controller");

// Chat 1 a 1 (después de asignar servicio)
router.get("/servicio/:id_servicio", auth, controller.obtenerHistorial);
router.post("/", auth, controller.enviarMensaje);
router.put("/leidos/:id_servicio", auth, controller.marcarLeidos);

// Chat grupal (antes de asignar servicio)
router.get("/solicitud/:id_solicitud", auth, controller.obtenerHistorialGrupal);

module.exports = router;
