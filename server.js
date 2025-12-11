require("dotenv").config();
const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

// Crear servidor HTTP manualmente
const httpServer = http.createServer(app);

// Instancia de socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// === 📌 Registrar Sockets ===
const chatSocket = require("./src/socket/chat.socket");
const notiSocket = require("./src/socket/notificacion.socket");

// Ejecutar sockets
chatSocket(io);
notiSocket(io);

// === 📌 Pasar la instancia de IO al util de notificaciones ===
const { setSocket } = require("./src/utils/notificacion.util");
setSocket(io);

// Puerto
const PORT = process.env.PORT || 5000;

// Levantar servidor http + socket
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    console.log("🔥 Socket.IO listo para usarse");
});


/* httpServer.listen(PORT, 'localhost', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log("🔥 Socket.IO listo para usarse");
}); */