import admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
});

export const enviarNotificacion = async (token, payload) => {
    try {
        await admin.messaging().send({
            notification: payload,
            token
        });
    } catch (err) {
        console.log("Error enviando FCM:", err);
    }
};
