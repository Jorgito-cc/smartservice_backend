const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/incidencia.controller");

// Crear
router.post("/", auth, controller.crear);

// Listar por usuario
router.get("/mias", auth, controller.listarPorUsuario);

// Listar por servicio
router.get("/servicio/:id_servicio", auth, controller.listarPorServicio);

// ADMIN — Listar todas
router.get("/", auth, controller.listarTodas);

// ADMIN — Cambiar estado
router.put("/estado", auth, controller.cambiarEstado);

module.exports = router;
