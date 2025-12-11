const jwt = require('jsonwebtoken');

// Generar token de acceso (corto)
function generateToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, { 
        expiresIn: process.env.JWT_EXPIRES || '7d' 
    });
}

// Generar refresh token (más largo)
function generateRefreshToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, { 
        expiresIn: '30d' // Refresh token dura 30 días
    });
}

// Verificar token
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken
}; 
