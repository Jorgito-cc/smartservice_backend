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
