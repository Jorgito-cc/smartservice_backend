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

// Nuevas rutas para BI
router.get("/servicios-por-categoria", auth, role("admin"), controller.serviciosPorCategoria);
router.get("/ingresos", auth, role("admin"), controller.ingresosPorPeriodo);
router.get("/tecnicos-top", auth, role("admin"), controller.tecnicosTop);
router.get("/resumen-general", auth, role("admin"), controller.resumenGeneral);

module.exports = router;
