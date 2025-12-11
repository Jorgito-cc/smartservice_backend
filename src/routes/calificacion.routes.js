const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/calificacion.controller");

// Crear (cliente)
router.post("/", auth, role("cliente"), controller.crear);

// Listar calificaciones de un técnico
router.get("/tecnico/:id_tecnico", controller.listarPorTecnico);

module.exports = router;
