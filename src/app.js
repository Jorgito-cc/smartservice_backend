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
//conceatr ruta con el servidor para solicitudes 
const solicitudRoutes = require ("./routes/solicitud_servicio.routes");
//conceatr ruta con el servidor para oferta
const ofertaRoutes = require ("./routes/oferta.routes");
//conceatr ruta con el servidor para servicio
const servicioRoutes = require ("./routes/servicio.routes");


//concertar ruta con el servidor para auditoria 
const auditoria = require("./middleware/auditoria.middleware");



const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/categorias", categoriaRoutes);
app.use("/api/zonas", zonaRoutes);
app.use("/api/especialidades", especialidadRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/ofertas", ofertaRoutes);
app.use("/api/servicios", servicioRoutes);


// Registrar ruta de pagos (incluye webhook de Stripe)
app.use("/api/pago", require("./routes/pago.routes"));



// Rutas públicas (sin autenticación)
app.use("/api/auth", authRoutes);

//rutas para calificacion 
app.use("/api/calificaciones", require("./routes/calificacion.routes"));
//ruta para incidencia 
app.use("/api/incidencias", require("./routes/incidencia.routes"));
//ruta para chat 
app.use("/api/chat", require("./routes/chat.routes"));
//ruta para auditoría (solo admin puede ver los logs)
app.use("/api/auditoria", require("./routes/auditoria.routes"));

// Middleware de autenticación (aplica a todas las rutas siguientes)
app.use(require("./middleware/auth.middleware"));
app.use(auditoria);

// Rutas protegidas (requieren autenticación)
// Las rutas que necesiten auth deben estar después de los middlewares

// Conexión BD
sequelize.sync({ alter: false })
    .then(() => console.log("📌 Base de datos sincronizada"))
    .catch(err => console.error("❌ Error BD:", err));

module.exports = app;
