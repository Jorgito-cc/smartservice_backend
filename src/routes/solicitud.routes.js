const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/solicitud.controller");

// ADMIN: LISTAR TODAS LAS SOLICITUDES (debe ir primero para evitar conflictos con /:id)
router.get("/admin/listar", role("admin"), controller.listarTodas);

// CLIENTE CREA SOLICITUD
router.post("/", role("cliente"), controller.crear);

// CLIENTE VE SUS SOLICITUDES
router.get("/", role("cliente"), controller.listarPorCliente);

// TÉCNICOS VEN SOLICITUDES DISPONIBLES
router.get("/disponibles", role("tecnico"), controller.listarDisponibles);

// DETALLE (cualquier usuario autenticado)
router.get("/:id", controller.obtener);

// CAMBIAR ESTADO (cualquier usuario autenticado)
router.put("/:id/estado", controller.cambiarEstado);

module.exports = router;
