export default function chatService(io) {
    io.on("connection", (socket) => {
        console.log("Cliente conectado:", socket.id);

        // Unirse a un chat por servicio
        socket.on("joinService", (id_servicio) => {
            socket.join("servicio_" + id_servicio);
        });

        // Enviar mensaje
        socket.on("mensaje", async (data) => {
            const { id_servicio, emisor_id, mensaje } = data;

            await ChatMensaje.create({
                id_servicio,
                emisor_id,
                mensaje
            });

            // reenviar a todos los del chat
            io.to("servicio_" + id_servicio).emit("mensajeNuevo", data);
        });
    });
}
