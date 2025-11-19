const jwt = require("jsonwebtoken");
const { Usuario } = require("../models/index");

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];

        if (!token)
            return res.status(401).json({ message: "Token no proporcionado" });

        // Token viene como: "Bearer eyJhbGciOiJIUzI1NiIs..."
        const cleanToken = token.split(" ")[1];

        if (!cleanToken)
            return res.status(401).json({ message: "Formato de token inválido" });

        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

        // Verificar si el usuario sigue activo
        const user = await Usuario.findByPk(decoded.id_usuario);
        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        if (user.estado === false) {
            return res.status(401).json({ message: "Usuario deshabilitado" });
        }

        req.user = {
            id_usuario: user.id_usuario,
            rol: user.rol,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expirado" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Token inválido" });
        }
        return res.status(401).json({ message: "Error verificando token" });
    }
};

module.exports = verifyToken;
