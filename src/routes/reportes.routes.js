const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/reportes.controller");

// Todas las rutas requieren autenticación y rol admin
router.get("/dashboard", auth, role("admin"), controller.dashboard);
router.get("/ingresos-por-zona", auth, role("admin"), controller.ingresosPorZona);
router.get("/clientes-recurrentes", auth, role("admin"), controller.clientesRecurrentes);
router.get("/tecnicos-destacados", auth, role("admin"), controller.tecnicosDestacados);

module.exports = router;

