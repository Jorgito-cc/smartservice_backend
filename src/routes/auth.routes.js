const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');
const isAdmin = require('../middleware/roleSS.middleware');

// Rutas públicas
router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/refresh-token', controller.refreshToken);

// Rutas protegidas
router.get('/perfil', verifyToken, controller.getPerfil);
router.get('/perfiles', verifyToken, controller.getAllPerfiles);
router.get('/tecnicos/todos', verifyToken, controller.obtenerTodosTecnicos);
router.put('/token-real', verifyToken, controller.actualizarTokenReal);
// NUEVAS RUTAS ADMIN
router.patch('/tecnico/activar/:id', verifyToken,  controller.activarTecnico);
router.patch('/tecnico/desactivar/:id', verifyToken, controller.desactivarTecnico);





module.exports = router; 


