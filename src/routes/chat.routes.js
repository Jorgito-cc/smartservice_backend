const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/chat.controller");

router.get("/:id_servicio", auth, controller.obtenerHistorial);
router.post("/", auth, controller.enviarMensaje);
router.put("/leidos/:id_servicio", auth, controller.marcarLeidos);

module.exports = router;
