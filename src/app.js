const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { sequelize } = require("./models/index");

// Rutas
const authRoutes = require("./routes/auth.routes");
const categoriaRoutes = require("./routes/categoria.routes");
const zonaRoutes = require("./routes/zona.route");
const especialidadRoutes = require("./routes/especialidad.routes");
const solicitudRoutes = require("./routes/solicitud.routes");
const ofertaRoutes = require("./routes/oferta.routes");
const servicioRoutes = require("./routes/servicio.routes");
const auditoria = require("./middleware/auditoria.middleware");
// nuevos cambios 
const app = express();
app.use(cors());
app.use(express.json());
// cambios nuevos
// Servir archivos estáticos del frontend web
const path = require("path");
app.use(express.static(path.join(__dirname, "../public")));

// ==========================================
// RUTAS PÚBLICAS (sin autenticación)
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/zonas", zonaRoutes);
app.use("/api/especialidades", especialidadRoutes);
app.use("/api/calificaciones", require("./routes/calificacion.routes"));
app.use("/api/pago", require("./routes/pago.routes"));

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN GLOBAL
// ==========================================
app.use(require("./middleware/auth.middleware"));
app.use(auditoria);

// ==========================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==========================================
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/ofertas", ofertaRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/incidencias", require("./routes/incidencia.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/notificaciones", require("./routes/notificacion.routes"));
app.use("/api/auditoria", require("./routes/auditoria.routes"));
app.use("/api/reportes", require("./routes/reportes.routes"));
app.use("/api/ubicacion", require("./routes/ubicacion.routes"));
app.use("/api/ml", require("./routes/ml.routes")); // 🤖 Machine Learning Microservice Integration

// Conexión BD
sequelize.sync({ alter: false })
    .then(() => console.log("📌 Base de datos sincronizada"))
    .catch(err => console.error("❌ Error BD:", err));

module.exports = app;
