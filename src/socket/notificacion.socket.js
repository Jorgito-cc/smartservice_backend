const { Usuario } = require("../models");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("🔵 Usuario conectado:", socket.id);

        // El frontend envía el id_usuario una vez autenticado
        socket.on("authUser", ({ id_usuario }) => {
            socket.join(`user_${id_usuario}`);
            console.log(`🟢 Usuario ${id_usuario} unido a user_${id_usuario}`);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Usuario desconectado:", socket.id);
        });
    });
};
