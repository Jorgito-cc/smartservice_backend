const admin = require("firebase-admin");

const serviceAccount = require("../firebase-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

module.exports = async (token, notification) => {
    try {
        await admin.messaging().send({
            token,
            notification
        });
    } catch (err) {
        console.error("Error enviando FCM:", err);
    }
};





// import axios from "axios";
// import { Usuario } from "../models/Usuario.js";
// import { Notificacion } from "../models/Notificacion.js";

// export const enviarNotificacionPush = async ({ id_servicio, emisor_id, mensaje }) => {

//     // Buscar receptor
//     const receptor = await Usuario.findOne({
//         where: { id_usuario: emisor_id === 1 ? 2 : 1 } // Ejemplo, luego lo ajustamos
//     });

//     if (!receptor || !receptor.token_real) return;

//     const payload = {
//         to: receptor.token_real,
//         notification: {
//             title: "Nuevo mensaje",
//             body: mensaje
//         },
//         data: { id_servicio: String(id_servicio) }
//     };

//     await axios.post(
//         "https://fcm.googleapis.com/fcm/send",
//         payload,
//         {
//             headers: {
//                 Authorization: "key=" + process.env.FIREBASE_SERVER_KEY,
//                 "Content-Type": "application/json"
//             }
//         }
//     );

//     // Guardar historial en BD
//     await Notificacion.create({
//         id_usuario: receptor.id_usuario,
//         titulo: "Nuevo mensaje",
//         cuerpo: mensaje
//     });
// };
