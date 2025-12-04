const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/servicio.controller");

// Cliente selecciona oferta → crea servicio
router.post("/asignar", auth, role("cliente"), controller.asignar);

// Técnico lista sus servicios
router.get("/tecnico/mis-servicios", auth, role("tecnico"), controller.listarPorTecnico);

// Técnico actualiza estado del servicio
router.put("/:id_servicio/estado", auth, role("tecnico"), controller.cambiarEstado);

// Obtener detalle
router.get("/:id_servicio", auth, controller.obtener);

module.exports = router;
