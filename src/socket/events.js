import { ChatMensaje } from "../models/ChatMensaje.js";
import { enviarNotificacionPush } from "../utils/firebase.js";
import { Notificacion } from "../models/Notificacion.js";

export default function registerEvents(io, socket) {

    // 🟩 Unirse a un "room" basado en ID del servicio
    socket.on("join_service", ({ id_servicio }) => {
        socket.join("servicio_" + id_servicio);
        console.log(`📌 Usuario se unió al room servicio_${id_servicio}`);
    });

    // 🟩 Enviar mensaje en el chat
    socket.on("send_message", async ({ id_servicio, mensaje }) => {

        const emisor_id = socket.user.id;

        // Guardar en BD
        const nuevoMensaje = await ChatMensaje.create({
            id_servicio,
            emisor_id,
            mensaje,
            leido: false
        });

        // Emitir mensaje al room
        io.to("servicio_" + id_servicio).emit("new_message", {
            id_mensaje: nuevoMensaje.id_mensaje,
            id_servicio,
            emisor_id,
            mensaje,
            fecha: nuevoMensaje.fecha
        });

        // 🔥 ENVIAR PUSH CON FIREBASE AL OTRO USUARIO
        await enviarNotificacionPush({
            id_servicio,
            emisor_id,
            mensaje
        });
    });

    // 🟩 Confirmar mensajes leídos
    socket.on("leer_mensajes", async ({ id_servicio }) => {
        await ChatMensaje.update(
            { leido: true },
            { where: { id_servicio } }
        );
    });
}
