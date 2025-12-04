const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/servicio.controller");

// Cliente selecciona oferta → crea servicio
router.post("/asignar", role("cliente"), controller.asignar);

// Técnico lista sus servicios
router.get("/tecnico/mis-servicios", role("tecnico"), controller.listarPorTecnico);

// Cliente lista sus servicios
router.get("/cliente/mis-servicios", role("cliente"), controller.listarPorCliente);

// Técnico actualiza estado del servicio
router.put("/:id_servicio/estado", role("tecnico"), controller.cambiarEstado);

// Obtener detalle (cualquier usuario autenticado)
router.get("/:id_servicio", controller.obtener);

module.exports = router;
