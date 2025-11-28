import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import tecnicoRoutes from "./routes/tecnico.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import zonaRoutes from "./routes/zona.routes.js";
import especialidadRoutes from "./routes/especialidad.routes.js";
import solicitudRoutes from "./routes/solicitud.routes.js";
import ofertaRoutes from "./routes/oferta.routes.js";
import asignacionRoutes from "./routes/asignacion.routes.js";
import estadoRoutes from "./routes/estado-servicio.routes.js";
import pagoRoutes from "./routes/pago.routes.js";
import calificacionRoutes from "./routes/calificacion.routes.js";
import incidenciaRoutes from "./routes/incidencia.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import notificacionRoutes from "./routes/notificacion.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mlRoutes from "./routes/ml.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Registrar rutas
app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/cliente", clienteRoutes);
app.use("/api/tecnico", tecnicoRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/zonas", zonaRoutes);
app.use("/api/especialidades", especialidadRoutes);
app.use("/api/solicitudes", solicitudRoutes);
app.use("/api/ofertas", ofertaRoutes);
app.use("/api/asignacion", asignacionRoutes);
app.use("/api/estado-servicio", estadoRoutes);
app.use("/api/pago", pagoRoutes);
app.use("/api/calificacion", calificacionRoutes);
app.use("/api/incidencia", incidenciaRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notificacion", notificacionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ml", mlRoutes);

export default app;







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







app.use(require("./middleware/auth.middleware"));
app.use(auditoria);
 
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

// Rutas de ubicación (solo técnicos)
app.use("/api/ubicacion", require("./routes/ubicacion.routes"));

// Rutas protegidas (requieren autenticación)
// Las rutas que necesiten auth deben estar después de los middlewares

// Conexión BD
sequelize.sync({ alter: false })
    .then(() => console.log("📌 Base de datos sincronizada"))
    .catch(err => console.error("❌ Error BD:", err));

module.exports = app;
  