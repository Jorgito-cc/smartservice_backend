/**
 * ============================================
 * MIDDLEWARE DE ROLES
 * ============================================
 * 
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 * para acceder a una ruta específica.
 * 
 * USO:
 * router.post("/ruta", auth, role(['admin']), controller.funcion);
 * router.get("/ruta", auth, role(['admin', 'tecnico']), controller.funcion);
 */

/**
 * Función que retorna un middleware para verificar roles
 * @param {Array<string>} rolesPermitidos - Array de roles que pueden acceder
 * @returns {Function} Middleware de Express
 */
const requireRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        // Obtener el rol del usuario desde req.user (seteado por auth.middleware)
        const rolUsuario = req.user?.rol;

        // Si no hay rol, el usuario no está autenticado correctamente
        if (!rolUsuario) {
            return res.status(403).json({ 
                message: "Usuario sin rol asignado" 
            });
        }

        // Verificar si el rol del usuario está en la lista de roles permitidos
        if (!rolesPermitidos.includes(rolUsuario)) {
            return res.status(403).json({
                message: "No tienes permisos para esta acción",
                requiere: rolesPermitidos,
                tu_rol: rolUsuario
            });
        }

        // Si pasa todas las validaciones, continuar con el siguiente middleware
        next();
    };
};

module.exports = requireRole;
