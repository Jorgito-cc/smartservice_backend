import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { Server as SocketServer } from "socket.io";
import admin from "firebase-admin";
import router from "./routes/index.js";
import sequelize from "./database.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// =============================================
// 1. 🔥 CONFIGURAR SOCKET.IO (CHAT EN TIEMPO REAL)
// =============================================
const io = new SocketServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// SALA: "servicio_<id>"
io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado al socket:", socket.id);

    socket.on("joinRoom", (servicioId) => {
        socket.join(`servicio_${servicioId}`);
        console.log(`🟢 Usuario se unió a sala servicio_${servicioId}`);
    });

    socket.on("sendMessage", (data) => {
        // data = { servicioId, emisor_id, mensaje }
        io.to(`servicio_${data.servicioId}`).emit("newMessage", data);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado:", socket.id);
    });
});

// Exportar io global
export { io };


// =============================================
// 2. 🔥 CONFIGURAR FIREBASE ADMIN (NOTIFICACIONES)
// =============================================
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FB_PROJECT_ID,
            clientEmail: process.env.FB_CLIENT_EMAIL,
            privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

export const firebaseAdmin = admin;


// =============================================
// 3. 🔥 MIDDLEWARES GLOBALES
// =============================================

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));


// =============================================
// 4. 🔥 CONEXIÓN A POSTGRESQL (SEQUELIZE)
// =============================================

(async () => {
    try {
        await sequelize.authenticate();
        console.log("📦 PostgreSQL conectado correctamente");

        // Opcional: sincronizar modelos
        // await sequelize.sync({ alter: false });

    } catch (error) {
        console.error("❌ Error al conectar a PostgreSQL:", error);
    }
})();


// =============================================
// 5. 🔥 RUTAS DEL SISTEMA
// =============================================

app.get("/", (req, res) => {
    res.send("🚀 API funcionando correctamente");
});

app.use("/api", router);


// =============================================
// 6. 🔥 ENDPOINT PARA COMUNICARSE CON FLASK (ML)
// =============================================

import axios from "axios";

app.post("/api/ml/recomendar", async (req, res) => {
    try {
        const response = await axios.post(
            process.env.ML_SERVER_URL + "/predict",
            req.body
        );
        return res.json(response.data);
    } catch (error) {
        console.error("Error ML:", error);
        return res.status(500).json({ message: "Error en ML" });
    }
});


// =============================================
// 7. 🔥 MANEJO DE ERRORES GLOBAL
// =============================================

app.use((err, req, res, next) => {
    console.error("❌ Error interno:", err);
    return res.status(500).json({ message: "Error interno del servidor" });
});


// =============================================
// 8. 🔥 INICIAR SERVIDOR
// =============================================

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
