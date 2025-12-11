const express = require("express");
const router = express.Router();
const controller = require("../controllers/pago.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

// ADMIN: LISTAR TODOS LOS PAGOS
router.get("/admin/listar", auth, role("admin"), controller.listarTodos);

// Cliente inicia pago
router.post("/checkout", auth, controller.crearCheckout);

// Obtener información del pago por servicio
router.get("/servicio/:id_servicio", auth, controller.obtenerPorServicio);

// Webhook (IMPORTANTE: sin auth)
router.post("/webhook", express.raw({ type: "application/json" }), controller.webhook);

module.exports = router;
