const express = require("express");
const cors = require("cors");




require("dotenv").config();

const { sequelize } = require("./models/index");

// Rutas
const authRoutes = require("./routes/auth.routes");
// ruta para el servidor  para categorias
const categoriaRoutes = require("./routes/categoria.routes");
// conectar ruta con el servidor para zona
const zonaRoutes = require("./routes/zona.route"); 
//conectar ruta con el servicio para especialidad
const especialidadRoutes = require("./routes/especialidad.routes");
//conectar ruta con el servidor para solicitudes 
const solicitudRoutes = require("./routes/solicitud.routes");
//conceatr ruta con el servidor para oferta
const ofertaRoutes = require ("./routes/oferta.routes");
//conceatr ruta con el servidor para servicio
const servicioRoutes = require ("./routes/servicio.routes");

//concertar ruta con el servidor para auditoria 
const auditoria = require("./middleware/auditoria.middleware");



const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend web
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));
/* 
app.use(require("./middleware/auth.middleware"));
app.use(auditoria); */

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================
// Autenticación (login, register, refresh-token)
app.use("/api/auth", authRoutes);

// Rutas públicas de categorías (GET - listar y obtener)
// Las rutas protegidas (POST, PUT, DELETE) tienen su propio middleware en el router
app.use("/api/categorias", categoriaRoutes);

// Rutas públicas de zonas (GET - listar y obtener)
app.use("/api/zonas", zonaRoutes);

// Rutas públicas de especialidades (GET - listar y obtener)
app.use("/api/especialidades", especialidadRoutes);

// Ruta pública para listar calificaciones de técnico
// La ruta POST (crear) tiene su propio middleware en el router
app.use("/api/calificaciones", require("./routes/calificacion.routes"));

// Webhook de Stripe (debe estar antes del middleware de auth)
app.use("/api/pago", require("./routes/pago.routes"));

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// ==========================================
// A partir de aquí, todas las rutas requieren autenticación
// NOTA: Las rutas anteriores ya tienen sus middlewares en sus routers






/* 
app.use(require("./middleware/auth.middleware"));
app.use(auditoria);
 */
// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
// Estas rutas están protegidas por el middleware global de autenticación
// Rutas de solicitudes (todas protegidas)
app.use("/api/solicitudes", solicitudRoutes);

// Rutas de ofertas (todas protegidas)
app.use("/api/ofertas", ofertaRoutes);

// Rutas de servicios (todas protegidas)
app.use("/api/servicios", servicioRoutes);


// Rutas de incidencias (todas protegidas)
app.use("/api/incidencias", require("./routes/incidencia.routes"));

// Rutas de chat (todas protegidas)
app.use("/api/chat", require("./routes/chat.routes"));

// Rutas de notificaciones (todas protegidas)
app.use("/api/notificaciones", require("./routes/notificacion.routes"));

// Rutas de auditoría (solo admin)
app.use("/api/auditoria", require("./routes/auditoria.routes"));

// Rutas de reportes (solo admin)
app.use("/api/reportes", require("./routes/reportes.routes"));

// Rutas de ubicación (solo técnicos)
app.use("/api/ubicacion", require("./routes/ubicacion.routes"));

// Rutas protegidas (requieren autenticación)
// Las rutas que necesiten auth deben estar después de los middlewares

// Conexión BD
sequelize.sync({ alter: false })
    .then(() => console.log("📌 Base de datos sincronizada"))
    .catch(err => console.error("❌ Error BD:", err));

module.exports = app;
