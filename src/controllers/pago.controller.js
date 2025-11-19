const stripe = require("../config/stripe");
const {
    ServicioAsignado,
    OfertaTecnico,
    PagoServicio,
    SolicitudServicio,
    Usuario,
    Notificacion
} = require("../models");

const admin = require("firebase-admin");

module.exports = {

    // ==========================================
    //         CREAR CHECKOUT (INICIAR PAGO)
    // ==========================================
    async crearCheckout(req, res) {
        try {
            const { id_servicio } = req.body;
            const id_cliente = req.user.id_usuario;

            // 1. Obtener servicio
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio) return res.status(404).json({ msg: "Servicio no encontrado" });

            // 2. Validar que la solicitud sea del cliente
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);
            if (solicitud.id_cliente !== id_cliente)
                return res.status(403).json({ msg: "No puedes pagar este servicio" });

            // 3. Obtener precio desde la oferta ganadora
            const oferta = await OfertaTecnico.findByPk(servicio.id_oferta);

            const precio = Number(oferta.precio);
            const comision = precio * 0.10;
            const neto = precio - comision;

            // 4. Crear registro inicial del pago
            await PagoServicio.create({
                id_servicio,
                monto_total: precio,
                comision_empresa: comision,
                monto_tecnico: neto,
                estado: "pendiente"
            });

            // 5. Crear sesión de Stripe Checkout
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [{
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Pago por servicio #${id_servicio}`
                        },
                        unit_amount: precio * 100 // convertir a centavos
                    },
                    quantity: 1
                }],
                mode: "payment",
                success_url: `${process.env.FRONTEND_URL}/pago-exitoso?id=${id_servicio}`,
                cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado?id=${id_servicio}`,
                metadata: {
                    id_servicio
                }
            });

            res.json({
                url: session.url
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ msg: "Error creando checkout" });
        }
    },
    // ==========================================
    //         WEBHOOK (PAGO CONFIRMADO)
    // ==========================================
    async webhook(req, res) {
        let event;

        try {
            const signature = req.headers['stripe-signature'];

            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

        } catch (err) {
            console.error("⚠ Error en webhook:", err.message);
            return res.status(400).send(`Webhook error: ${err.message}`);
        }

        // Evento: pago exitoso
        if (event.type === "checkout.session.completed") {

            const session = event.data.object;
            const id_servicio = session.metadata.id_servicio;

            // Actualizar pago en BD
            const pago = await PagoServicio.findOne({ where: { id_servicio } });

            if (pago) {
                await pago.update({
                    stripe_payment_id: session.payment_intent,
                    estado: "pagado"
                });
            }

            // Notificar al técnico y cliente
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);
            const tecnico = await Usuario.findByPk(servicio.id_tecnico);
            const cliente = await Usuario.findByPk(solicitud.id_cliente);

            // Técnico
            if (tecnico.token_real) {
                await admin.messaging().sendToDevice(tecnico.token_real, {
                    notification: {
                        title: "Pago recibido",
                        body: "El cliente pagó tu servicio."
                    }
                });
            }

            // Cliente
            if (cliente.token_real) {
                await admin.messaging().sendToDevice(cliente.token_real, {
                    notification: {
                        title: "Pago completado",
                        body: "Tu pago fue procesado exitosamente."
                    }
                });
            }

            return res.json({ received: true });
        }

        res.json({ received: true });
    }
};
