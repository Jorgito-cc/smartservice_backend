/**
 * ============================================
 * UTILIDADES DE FIREBASE
 * ============================================
 * 
 * Este módulo centraliza la inicialización de Firebase Admin SDK
 * y proporciona funciones para enviar notificaciones push.
 * 
 * IMPORTANTE: Firebase solo se inicializa UNA VEZ aquí.
 * Todos los demás archivos deben usar este módulo.
 */

const admin = require("firebase-admin");

// Inicializar Firebase solo si no está ya inicializado
if (!admin.apps.length) {
    try {
        // Intentar usar variables de entorno primero (recomendado para producción)
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
                })
            });
        } else {
            // Fallback: usar archivo JSON (solo para desarrollo)
            const serviceAccount = require("../firebase-key.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        console.log("✅ Firebase Admin inicializado correctamente");
    } catch (error) {
        console.error("❌ Error inicializando Firebase:", error.message);
        // No lanzar error para que la app pueda funcionar sin Firebase
    }
}

/**
 * Enviar notificación push a un dispositivo
 * @param {string} token - Token FCM del dispositivo
 * @param {object} notification - Objeto con title y body
 * @returns {Promise<void>}
 */
async function enviarNotificacionPush(token, notification) {
    try {
        if (!token) {
            console.warn("⚠️ Token FCM no proporcionado");
            return;
        }

        await admin.messaging().send({
            token,
            notification: {
                title: notification.title || notification.titulo || "Notificación",
                body: notification.body || notification.cuerpo || ""
            }
        });
    } catch (err) {
        console.error("❌ Error enviando notificación FCM:", err.message);
        // No lanzar error para no interrumpir el flujo
    }
}

module.exports = enviarNotificacionPush;
module.exports.admin = admin; // Exportar admin para uso avanzado si es necesario
