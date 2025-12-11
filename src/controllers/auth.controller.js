/**
 * ============================================
 * CONTROLADOR DE AUTENTICACIÓN
 * ============================================
 * 
 * Este módulo maneja todas las operaciones relacionadas con autenticación:
 * - Registro de usuarios (cliente, técnico, admin)
 * - Inicio de sesión (login)
 * - Renovación de tokens (refresh token)
 * - Obtención de perfil de usuario
 */

// Importar librerías necesarias
const bcrypt = require("bcrypt"); // Para hashear y comparar contraseñas
const { generateToken, generateRefreshToken, verifyToken } = require("../utils/generateJWT");

// Importar modelos de la base de datos
const {
    Usuario,    // Tabla principal de usuarios
    Cliente,    // Tabla de clientes (relación 1:1 con Usuario)
    Tecnico,    // Tabla de técnicos (relación 1:1 con Usuario)
    Admin       // Tabla de administradores (relación 1:1 con Usuario)
    ,
    Especialidad,
    TecnicoEspecialidad
} = require("../models/index");

module.exports = {
    /**
     * ==========================================
     * FUNCIÓN: register
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Registra un nuevo usuario en el sistema. Puede ser cliente, técnico o admin.
     * 
     * PROCESO:
     * 1. Valida que el rol sea válido (cliente, tecnico o admin)
     * 2. Verifica que el email no esté ya registrado
     * 3. Valida que los campos requeridos estén presentes
     * 4. Hashea la contraseña usando bcrypt (seguridad)
     * 5. Crea el registro en la tabla Usuario
     * 6. Crea el registro correspondiente según el rol (Cliente, Tecnico o Admin)
     * 
     * PARÁMETROS DE ENTRADA (req.body):
     * - nombre: string (requerido) - Nombre del usuario
     * - apellido: string (requerido) - Apellido del usuario
     * - email: string (requerido) - Email único del usuario
     * - password: string (requerido) - Contraseña del usuario
     * - rol: string (requerido) - Rol del usuario: "cliente", "tecnico" o "admin"
     * - telefono: string (opcional) - Teléfono del usuario
     * - preferencia: string (opcional) - Solo para clientes, preferencias del cliente
     * - descripcion: string (opcional) - Solo para técnicos, descripción del técnico
     * 
     * RESPUESTA EXITOSA (201):
     * {
     *   msg: "Usuario registrado correctamente" o "Técnico registrado, esperando validación",
     *   usuario: { id_usuario, nombre, apellido, email, rol, estado }
     * }
     * 
     * ERRORES POSIBLES:
     * - 400: Rol inválido, email ya registrado, campos faltantes
     * - 500: Error del servidor
     * 
     * NOTAS IMPORTANTES:
     * - Los técnicos se crean con estado=false (requieren validación del admin)
     * - Las contraseñas se hashean con bcrypt (salt rounds: 10)
     * - El id_cliente, id_tecnico o id_admin es igual al id_usuario (herencia)
     */
    async register(req, res) {
        try {
            // Extraer datos del cuerpo de la petición
            const { nombre, apellido, email, password, rol, telefono, preferencia, descripcion, foto, ci, foto_ci, calificacion_promedio, especialidades } = req.body;

            // ========================================
            // VALIDACIÓN 1: Verificar que el rol sea válido
            // ========================================
            // Solo acepta estos tres roles, cualquier otro es inválido
            if (!["cliente", "tecnico", "admin"].includes(rol)) {
                return res.status(400).json({
                    msg: "Rol inválido. Debe ser: cliente, tecnico o admin"
                });
            }

            // ========================================
            // VALIDACIÓN 2: Verificar que el email no esté registrado
            // ========================================
            // Busca en la base de datos si ya existe un usuario con ese email
            const existe = await Usuario.findOne({ where: { email } });
            if (existe) {
                return res.status(400).json({
                    msg: "Email ya registrado"
                });
            }

            // ========================================
            // VALIDACIÓN 3: Verificar campos requeridos
            // ========================================
            // Los campos nombre, apellido, email y password son obligatorios
            if (!nombre || !apellido || !email || !password) {
                return res.status(400).json({
                    msg: "Faltan campos requeridos"
                });
            }

            // ========================================
            // SEGURIDAD: Hashear la contraseña
            // ========================================
            // Genera un "salt" (valor aleatorio) para aumentar la seguridad
            // El número 10 indica la complejidad del hash (más alto = más seguro pero más lento)
            const salt = await bcrypt.genSalt(10);
            // Hashea la contraseña con el salt generado
            // Esto convierte "123456" en algo como "$2b$10$abcdefghijklmnopqrstuvwxyz..."
            const hashed = await bcrypt.hash(password, salt);

            // ========================================
            // CREAR USUARIO EN LA TABLA PRINCIPAL
            // ========================================
            // Crea el registro en la tabla "usuario" con los datos básicos
            const usuario = await Usuario.create({
                nombre,              // Nombre del usuario
                apellido,            // Apellido del usuario
                email,               // Email único
                telefono: telefono || null,  // Teléfono (opcional, si no viene es null)
                password: hashed,    // Contraseña hasheada (NUNCA se guarda en texto plano)
                foto: foto || null,
                ci: ci || null,
                foto_ci: foto_ci || null,
                rol,                 // Rol: "cliente", "tecnico" o "admin"
                // IMPORTANTE: Los técnicos se crean con estado=false
                // Esto significa que no pueden hacer login hasta que un admin los valide
                estado: rol === "tecnico" ? false : true
            });

            // ========================================
            // CREAR REGISTRO ESPECÍFICO SEGÚN EL ROL
            // ========================================
            // Dependiendo del rol, crea un registro adicional en la tabla correspondiente
            // Esto permite tener datos específicos para cada tipo de usuario

            // Si es CLIENTE
            if (rol === "cliente") {
                await Cliente.create({
                    id_cliente: usuario.id_usuario,  // El id_cliente es igual al id_usuario
                    preferencia: preferencia || null  // Preferencias del cliente (opcional)
                });
            }

            // Si es TÉCNICO
            if (rol === "tecnico") {
                await Tecnico.create({
                    id_tecnico: usuario.id_usuario,   // El id_tecnico es igual al id_usuario
                    descripcion: descripcion || null, // Descripción del técnico (opcional)
                    disponibilidad: false,
                    calificacion_promedio: calificacion_promedio || 0              // Inicialmente no disponible

                });

                // ================================
                //   REGISTRAR ESPECIALIDADES
                // ================================
                if (req.body.especialidades && Array.isArray(req.body.especialidades)) {

                    for (const esp of req.body.especialidades) {

                        // 1) Crear o buscar la especialidad
                        const [especialidad] = await Especialidad.findOrCreate({
                            where: { nombre: esp.nombre },
                            defaults: {
                                referencias: esp.referencias || null,
                                anio_experiencia: esp.anio_experiencia || null
                            }
                        });

                        // 2) Crear la relación N:M en técnico_especialidad
                        await TecnicoEspecialidad.create({
                            id_tecnico: usuario.id_usuario,
                            id_especialidad: especialidad.id_especialidad
                        });
                    }
                }

            }
            // Si es ADMIN
            if (rol === "admin") {
                await Admin.create({
                    id_admin: usuario.id_usuario      // El id_admin es igual al id_usuario
                });
            }

            // ========================================
            // RESPUESTA EXITOSA
            // ========================================
            // Retorna un mensaje y los datos del usuario creado (sin la contraseña)
            return res.status(201).json({
                // Mensaje diferente para técnicos (indica que necesitan validación)
                msg: rol === "tecnico"
                    ? "Técnico registrado, esperando validación del administrador"
                    : "Usuario registrado correctamente",
                // Datos del usuario creado (sin password por seguridad)
                usuario: {
                    id_usuario: usuario.id_usuario,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email,
                    rol: usuario.rol,
                    foto: usuario.foto,
                    estado: usuario.estado, // false para técnicos, true para otros
                    ci: usuario.ci,
                    foto_ci: usuario.foto_ci
                }
            });

        } catch (err) {
            // ========================================
            // MANEJO DE ERRORES
            // ========================================
            // Si ocurre cualquier error, lo registra en consola y retorna error 500
            console.error("Error en register:", err);
            return res.status(500).json({
                msg: "Error en el servidor",
                error: err.message
            });
        }
    },

    /**
     * ==========================================
     * FUNCIÓN: login
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Permite a un usuario iniciar sesión en el sistema.
     * Valida las credenciales y genera tokens de autenticación.
     * 
     * PROCESO:
     * 1. Valida que email y password estén presentes
     * 2. Busca el usuario por email en la base de datos
     * 3. Compara la contraseña ingresada con la hasheada en la BD
     * 4. Verifica que el usuario esté activo (estado = true)
     * 5. Genera un token de acceso y un refresh token
     * 6. Retorna los tokens y los datos del usuario
     * 
     * PARÁMETROS DE ENTRADA (req.body):
     * - email: string (requerido) - Email del usuario
     * - password: string (requerido) - Contraseña del usuario
     * 
     * RESPUESTA EXITOSA (200):
     * {
     *   msg: "Login exitoso",
     *   token: "eyJhbGciOiJIUzI1NiIs...",        // Token de acceso (válido por 7 días)
     *   refreshToken: "eyJhbGciOiJIUzI1NiIs...", // Refresh token (válido por 30 días)
     *   usuario: { id_usuario, nombre, apellido, email, telefono, rol, estado, foto }
     * }
     * 
     * ERRORES POSIBLES:
     * - 400: Email o password faltantes, contraseña incorrecta
     * - 404: Usuario no encontrado
     * - 403: Usuario deshabilitado (estado = false)
     * - 500: Error del servidor
     * 
     * NOTAS IMPORTANTES:
     * - El token se usa para autenticar peticiones posteriores
     * - El refreshToken se usa para renovar el token cuando expire
     * - Los técnicos con estado=false no pueden hacer login
     */
    async login(req, res) {
        try {
            // Extraer email y password del cuerpo de la petición
            const { email, password } = req.body;

            // ========================================
            // VALIDACIÓN 1: Verificar que los campos estén presentes
            // ========================================
            if (!email || !password) {
                return res.status(400).json({
                    msg: "Email y contraseña son requeridos"
                });
            }

            // ========================================
            // BUSCAR USUARIO EN LA BASE DE DATOS
            // ========================================
            // Busca un usuario que tenga el email proporcionado
            const usuario = await Usuario.findOne({ where: { email } });
            if (!usuario) {
                return res.status(404).json({
                    msg: "Usuario no encontrado"
                });
            }

            // ========================================
            // VALIDACIÓN 2: Verificar la contraseña
            // ========================================
            // Compara la contraseña ingresada con la contraseña hasheada guardada
            // bcrypt.compare() hashea la contraseña ingresada y la compara con la guardada
            const valid = await bcrypt.compare(password, usuario.password);
            if (!valid) {
                return res.status(400).json({
                    msg: "Contraseña incorrecta"
                });
            }

            // ========================================
            // VALIDACIÓN 3: Verificar que el usuario esté activo
            // ========================================
            // Los usuarios con estado=false no pueden hacer login
            // Esto incluye técnicos que aún no han sido validados por un admin
            if (usuario.estado === false) {
                return res.status(403).json({
                    msg: "Usuario deshabilitado. Contacte al administrador"
                });
            }

            // ========================================
            // GENERAR TOKENS DE AUTENTICACIÓN
            // ========================================
            // Prepara los datos que se incluirán en el token
            const tokenData = {
                id_usuario: usuario.id_usuario,  // ID del usuario
                rol: usuario.rol                 // Rol del usuario (cliente, tecnico, admin)
            };

            // Genera el token de acceso (válido por 7 días según JWT_EXPIRES)
            // Este token se usa para autenticar peticiones al API
            const token = generateToken(tokenData);

            // Genera el refresh token (válido por 30 días)
            // Este token se usa para renovar el token de acceso cuando expire
            const refreshToken = generateRefreshToken(tokenData);

            // ========================================
            // PREPARAR DATOS DEL USUARIO PARA LA RESPUESTA
            // ========================================
            // IMPORTANTE: Nunca se retorna la contraseña, ni siquiera hasheada
            const usuarioData = {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: usuario.rol,
                estado: usuario.estado,
                foto: usuario.foto,
                ci: usuario.ci,
                foto_ci: usuario.foto_ci
            };

            // ========================================
            // RESPUESTA EXITOSA
            // ========================================
            // Retorna los tokens y los datos del usuario
            return res.json({
                msg: "Login exitoso",
                token,              // Token de acceso (usar en header Authorization: Bearer <token>)
                refreshToken,       // Refresh token (guardar para renovar el token)
                usuario: usuarioData // Datos del usuario (sin password)
            });

        } catch (err) {
            // ========================================
            // MANEJO DE ERRORES
            // ========================================
            console.error("Error en login:", err);
            return res.status(500).json({
                msg: "Error en el servidor",
                error: err.message
            });
        }
    },
    // ======================================================
    //        ACTIVAR TÉCNICO
    // ======================================================
    async activarTecnico(req, res) {
        try {
            const { id } = req.params;

            const usuario = await Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
            if (usuario.rol !== "tecnico") return res.status(400).json({ msg: "El usuario no es técnico" });

            usuario.estado = true;
            await usuario.save();

            return res.json({ msg: "Técnico activado correctamente" });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ msg: "Error activando técnico" });
        }
    },

    // ======================================================
    //        DESACTIVAR TÉCNICO
    // ======================================================
    async desactivarTecnico(req, res) {
        try {
            const { id } = req.params;

            const usuario = await Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
            if (usuario.rol !== "tecnico") return res.status(400).json({ msg: "El usuario no es técnico" });

            usuario.estado = false;
            await usuario.save();

            return res.json({ msg: "Técnico desactivado correctamente" });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ msg: "Error desactivando técnico" });
        }
    },

    /**
     * ==========================================
     * FUNCIÓN: refreshToken
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Renueva los tokens de autenticación cuando el token de acceso ha expirado.
     * Usa el refresh token para generar nuevos tokens sin necesidad de hacer login nuevamente.
     * 
     * PROCESO:
     * 1. Recibe el refresh token del cliente
     * 2. Verifica que el refresh token sea válido y no haya expirado
     * 3. Verifica que el usuario aún exista y esté activo
     * 4. Genera nuevos tokens (token de acceso y refresh token)
     * 5. Retorna los nuevos tokens
     * 
     * PARÁMETROS DE ENTRADA (req.body):
     * - refreshToken: string (requerido) - El refresh token que se obtuvo en el login
     * 
     * RESPUESTA EXITOSA (200):
     * {
     *   msg: "Tokens renovados exitosamente",
     *   token: "nuevo_token...",           // Nuevo token de acceso
     *   refreshToken: "nuevo_refresh..."   // Nuevo refresh token
     * }
     * 
     * ERRORES POSIBLES:
     * - 400: Refresh token no proporcionado
     * - 401: Refresh token inválido, expirado o usuario no encontrado
     * - 403: Usuario deshabilitado
     * - 500: Error del servidor
     * 
     * NOTAS IMPORTANTES:
     * - El refresh token tiene una duración de 30 días
     * - Cuando se renuevan los tokens, se generan ambos (token y refreshToken)
     * - Esto permite mantener la sesión activa sin hacer login cada vez
     */
    async refreshToken(req, res) {
        try {
            // Extraer el refresh token del cuerpo de la petición
            const { refreshToken } = req.body;

            // ========================================
            // VALIDACIÓN 1: Verificar que el refresh token esté presente
            // ========================================
            if (!refreshToken) {
                return res.status(400).json({
                    msg: "Refresh token es requerido"
                });
            }

            // ========================================
            // VALIDACIÓN 2: Verificar y decodificar el refresh token
            // ========================================
            // verifyToken() verifica que el token sea válido y no haya expirado
            // Si es válido, retorna los datos decodificados (id_usuario, rol)
            // Si es inválido o expirado, retorna null
            const decoded = verifyToken(refreshToken);
            if (!decoded) {
                return res.status(401).json({
                    msg: "Refresh token inválido o expirado"
                });
            }

            // ========================================
            // VALIDACIÓN 3: Verificar que el usuario aún exista
            // ========================================
            // Busca el usuario en la base de datos usando el ID del token
            const usuario = await Usuario.findByPk(decoded.id_usuario);
            if (!usuario) {
                return res.status(401).json({
                    msg: "Usuario no encontrado"
                });
            }

            // ========================================
            // VALIDACIÓN 4: Verificar que el usuario esté activo
            // ========================================
            // Aunque el token sea válido, si el usuario fue deshabilitado, no se renuevan los tokens
            if (usuario.estado === false) {
                return res.status(403).json({
                    msg: "Usuario deshabilitado"
                });
            }

            // ========================================
            // GENERAR NUEVOS TOKENS
            // ========================================
            // Prepara los datos para los nuevos tokens
            const tokenData = {
                id_usuario: usuario.id_usuario,
                rol: usuario.rol
            };

            // Genera un nuevo token de acceso (válido por 7 días)
            const newToken = generateToken(tokenData);

            // Genera un nuevo refresh token (válido por 30 días)
            const newRefreshToken = generateRefreshToken(tokenData);

            // ========================================
            // RESPUESTA EXITOSA
            // ========================================
            // Retorna los nuevos tokens
            // El cliente debe actualizar sus tokens guardados con estos nuevos
            return res.json({
                msg: "Tokens renovados exitosamente",
                token: newToken,              // Nuevo token de acceso
                refreshToken: newRefreshToken // Nuevo refresh token
            });

        } catch (err) {
            // ========================================
            // MANEJO DE ERRORES
            // ========================================
            console.error("Error en refreshToken:", err);
            return res.status(500).json({
                msg: "Error en el servidor",
                error: err.message
            });
        }
    },

    /**
     * ==========================================
     * FUNCIÓN: getPerfil
     * ==========================================
     * 
     * DESCRIPCIÓN:
     * Obtiene el perfil completo del usuario autenticado.
     * Incluye datos básicos del usuario y datos adicionales según su rol.
     * 
     * PROCESO:
     * 1. Obtiene el ID del usuario desde req.user (seteado por el middleware de autenticación)
     * 2. Busca el usuario en la base de datos (sin incluir la contraseña)
     * 3. Según el rol, obtiene datos adicionales:
     *    - Cliente: obtiene preferencias
     *    - Técnico: obtiene descripción, calificación promedio y disponibilidad
     *    - Admin: solo datos básicos
     * 4. Retorna el perfil completo
     * 
     * PARÁMETROS:
     * - No requiere parámetros en el body
     * - Usa req.user.id_usuario (proporcionado por el middleware de autenticación)
     * 
     * RESPUESTA EXITOSA (200):
     * {
     *   usuario: {
     *     // Datos básicos del usuario
     *     id_usuario, nombre, apellido, email, telefono, rol, estado, foto,
     *     // Datos adicionales según el rol:
     *     // Si es cliente: preferencia
     *     // Si es técnico: descripcion, calificacion_promedio, disponibilidad
     *   }
     * }
     * 
     * ERRORES POSIBLES:
     * - 404: Usuario no encontrado
     * - 401: No autenticado (el middleware rechaza antes de llegar aquí)
     * - 500: Error del servidor
     * 
     * NOTAS IMPORTANTES:
     * - Esta función requiere autenticación (middleware verifyToken)
     * - Nunca retorna la contraseña
     * - Los datos adicionales se obtienen de las tablas Cliente o Tecnico según el rol
     */
    async getPerfil(req, res) {
        try {
            // ========================================
            // OBTENER USUARIO DE LA BASE DE DATOS
            // ========================================
            // req.user.id_usuario fue seteado por el middleware de autenticación
            // attributes: { exclude: ['password'] } asegura que la contraseña NO se incluya
            const usuario = await Usuario.findByPk(req.user.id_usuario, {
                attributes: { exclude: ['password'] } // Excluir password por seguridad
            });

            // Verificar que el usuario existe (aunque debería existir si pasó el middleware)
            if (!usuario) {
                return res.status(404).json({
                    msg: "Usuario no encontrado"
                });
            }

            // ========================================
            // OBTENER DATOS ADICIONALES SEGÚN EL ROL
            // ========================================
            // Inicializa un objeto vacío para datos adicionales
            let datosAdicionales = {};

            // Si el usuario es un CLIENTE
            if (usuario.rol === "cliente") {
                // Busca el registro en la tabla Cliente
                // El id_cliente es igual al id_usuario (relación 1:1)
                const cliente = await Cliente.findByPk(usuario.id_usuario);
                // Si existe, agrega las preferencias
                datosAdicionales = cliente ? {
                    preferencia: cliente.preferencia
                } : {};
            }

            // Si el usuario es un TÉCNICO
            if (usuario.rol === "tecnico") {
                // Busca el registro en la tabla Tecnico
                // El id_tecnico es igual al id_usuario (relación 1:1)
                const tecnico = await Tecnico.findByPk(usuario.id_usuario);
                // Si existe, agrega descripción, calificación promedio y disponibilidad
                datosAdicionales = tecnico ? {
                    descripcion: tecnico.descripcion,                    // Descripción del técnico
                    calificacion_promedio: tecnico.calificacion_promedio, // Promedio de calificaciones
                    disponibilidad: tecnico.disponibilidad               // Si está disponible para trabajar
                } : {};
            }

            // Si es ADMIN, no hay datos adicionales (solo usa la tabla Usuario)

            // ========================================
            // RESPUESTA EXITOSA
            // ========================================
            // Combina los datos básicos del usuario con los datos adicionales según el rol
            // usuario.toJSON() convierte el modelo Sequelize a un objeto JSON plano
            return res.json({
                usuario: {
                    ...usuario.toJSON(),  // Datos básicos del usuario
                    ...datosAdicionales   // Datos adicionales según el rol
                }
            });

        } catch (err) {
            // ========================================
            // MANEJO DE ERRORES
            // ========================================
            console.error("Error en getPerfil:", err);
            return res.status(500).json({
                msg: "Error en el servidor",
                error: err.message
            });
        }
    },
    /**
 * ==========================================
 * FUNCIÓN: getAllPerfiles
 * ==========================================
 * 
 * Obtiene todos los usuarios del sistema con su información completa,
 * incluyendo datos específicos según su rol:
 *  - Cliente → preferencia
 *  - Técnico → descripcion, calificacion_promedio, disponibilidad
 *  - Admin → solo datos básicos
 * 
 * NO incluye contraseñas.
 * Solo para administradores.
 */
    async getAllPerfiles(req, res) {
        try {
            const usuarios = await Usuario.findAll({
                attributes: { exclude: ["password"] },

                include: [
                    {
                        model: Cliente,
                        attributes: ["preferencia"]
                    },
                    {
                        model: Tecnico,
                        attributes: ["descripcion", "calificacion_promedio", "disponibilidad"]
                    },
                    {
                        model: Admin,
                        attributes: ["id_admin"]
                    },
                ]
            });

            return res.json({
                total: usuarios.length,
                usuarios
            });

        } catch (err) {
            console.error("Error obteniendo perfiles:", err);
            return res.status(500).json({
                msg: "Error obteniendo perfiles",
                error: err.message
            });
        }
    },

    /**
     * Actualiza el token FCM (token_real) del usuario autenticado
     */
    async actualizarTokenReal(req, res) {
        try {
            const { token_real } = req.body;
            const id_usuario = req.user.id_usuario;

            if (!token_real) {
                return res.status(400).json({ msg: "token_real es requerido" });
            }

            const usuario = await Usuario.findByPk(id_usuario);
            if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

            usuario.token_real = token_real;
            await usuario.save();

            return res.json({ msg: "Token de notificaciones actualizado" });

        } catch (error) {
            console.error("Error actualizando token_real:", error);
            return res.status(500).json({ msg: "Error guardando token" });
        }
    },

    /**
     * ==========================================
     * FUNCIÓN: obtenerTodosTecnicos
     * ==========================================
     * 
     * Obtiene todos los técnicos del sistema con información completa:
     * - Datos básicos del usuario (nombre, email, teléfono, foto)
     * - Datos específicos del técnico (descripción, calificación, disponibilidad)
     * - Especialidades del técnico
     * 
     * Solo para administradores.
     */
    async obtenerTodosTecnicos(req, res) {
        try {
            const tecnicos = await Tecnico.findAll({
                attributes: ['id_tecnico', 'descripcion', 'calificacion_promedio', 'disponibilidad'],
                include: [
                    {
                        model: Usuario,
                        attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'telefono', 'foto', 'estado'],
                        required: true
                    },
                    {
                        model: require("../models").Especialidad,
                        attributes: ['id_especialidad', 'nombre'],
                        through: { attributes: [] }
                    }
                ],
                order: [['id_tecnico', 'ASC']]
            });

            // Mapear los datos para una estructura más clara
            const resultado = tecnicos.map(t => ({
                id_tecnico: t.id_tecnico,
                id_usuario: t.Usuario?.id_usuario,
                nombre: t.Usuario?.nombre,
                apellido: t.Usuario?.apellido,
                email: t.Usuario?.email,
                telefono: t.Usuario?.telefono,
                foto: t.Usuario?.foto,
                estado: t.Usuario?.estado,
                descripcion: t.descripcion,
                calificacion_promedio: t.calificacion_promedio,
                disponibilidad: t.disponibilidad,
                especialidades: t.Especialidades?.map(e => ({
                    id_especialidad: e.id_especialidad,
                    nombre: e.nombre
                })) || []
            }));

            res.json(resultado);

        } catch (error) {
            console.error("❌ ERROR en obtenerTodosTecnicos:", error.message);
            console.error("Stack:", error.stack);
            res.status(500).json({ 
                msg: "Error obteniendo técnicos",
                detalle: error.message
            });
        }
    }
};
