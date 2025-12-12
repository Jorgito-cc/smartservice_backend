const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { sequelize } = require("./models/index");
const fixAllSequences = require("./utils/fix-sequences");

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

// ==========================================
// CONFIGURACIÓN DE CORS MEJORADA
// ==========================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://smartservicet.netlify.app",
      "https://smartservice-admin.netlify.app",
      "https://smartservice.netlify.app",
    ];

    // Permitir requests sin origin (mobile, desktop apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado para origen: ${origin}`);
      callback(new Error("CORS no permitido para este origen"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
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
app.use("/api/analisis", require("./routes/analisis.routes"));
app.use("/api/ubicacion", require("./routes/ubicacion.routes"));
app.use("/api/ml", require("./routes/ml.routes")); // 🤖 Machine Learning Microservice Integration

// Conexión BD
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("📌 Base de datos sincronizada");
    // Auto-fix secuencias desincronizadas
    fixAllSequences();
  })
  .catch((err) => console.error("❌ Error BD:", err));

module.exports = app;
