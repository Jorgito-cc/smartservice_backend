const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const controller = require("../controllers/zona.controller");

// SOLO ADMIN CREA, EDITA, ELIMINA
router.post("/", auth, role("admin"), controller.crear);
router.put("/:id", auth, role("admin"), controller.actualizar);
router.delete("/:id", auth, role("admin"), controller.eliminar);

// TODOS PUEDEN VER LAS ZONAS
router.get("/", controller.listar);
router.get("/:id", controller.obtener);

module.exports = router;
