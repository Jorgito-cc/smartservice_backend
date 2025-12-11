const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/oferta.controller");

// Crear oferta (solo TÉCNICO)
router.post("/", auth, role("tecnico"), controller.crear);

// Listar ofertas de una solicitud
router.get("/solicitud/:id_solicitud", auth, controller.listarPorSolicitud);

// Ver detalle
router.get("/:id", auth, controller.obtener);

module.exports = router;
