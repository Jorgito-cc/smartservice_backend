const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/refresh-token', controller.refreshToken);

// Rutas protegidas
router.get('/perfil', verifyToken, controller.getPerfil);

module.exports = router; 


