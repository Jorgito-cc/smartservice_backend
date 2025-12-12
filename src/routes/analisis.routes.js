const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/analisis.controller");

// Todas las rutas requieren autenticación y rol admin
router.get(
  "/interpretacion-inteligente",
  auth,
  role("admin"),
  controller.interpretacionInteligente
);
router.get(
  "/aconsejador-inteligente",
  auth,
  role("admin"),
  controller.aconsejadorInteligente
);
router.get(
  "/explicar-grafico-ingresos",
  auth,
  role("admin"),
  controller.explicarGraficoIngresos
);

module.exports = router;
