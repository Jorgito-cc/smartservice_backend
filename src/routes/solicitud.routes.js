const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/solicitud.controller");

// CLIENTE CREA SOLICITUD
router.post("/", auth, role(["cliente"]), controller.crear);

// CLIENTE VE SUS SOLICITUDES
router.get("/", auth, role(["cliente"]), controller.listarPorCliente);

// DETALLE
router.get("/:id", auth, controller.obtener);

// CAMBIAR ESTADO
router.put("/:id/estado", auth, controller.cambiarEstado);

module.exports = router;
