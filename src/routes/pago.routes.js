const express = require("express");
const router = express.Router();
const controller = require("../controllers/pago.controller");
const auth = require("../middleware/auth.middleware");

// Cliente inicia pago
router.post("/checkout", auth, controller.crearCheckout);

// Webhook (IMPORTANTE: sin auth)
router.post("/webhook", express.raw({ type: "application/json" }), controller.webhook);

module.exports = router;







