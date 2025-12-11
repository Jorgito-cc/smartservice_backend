const stripe = require("../config/stripe");
const {
    ServicioAsignado,
    OfertaTecnico,
    PagoServicio,
    SolicitudServicio,
    Usuario
} = require("../models");

const { enviarNotificacion } = require("../utils/notificacion.util");

module.exports = {

    // ==========================================
    //         CREAR CHECKOUT (INICIAR PAGO)
    // ==========================================
    async crearCheckout(req, res) {
        try {
            const { id_servicio, metodo_pago = "tarjeta" } = req.body;
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

            // 4. Validar método de pago
            const metodosValidos = ["tarjeta", "qr", "efectivo", "movil"];
            if (!metodosValidos.includes(metodo_pago)) {
                return res.status(400).json({ msg: "Método de pago no válido" });
            }

            // 5. Si es pago con tarjeta, usar Stripe
            if (metodo_pago === "tarjeta") {
                // Crear registro inicial del pago
                await PagoServicio.create({
                    id_servicio,
                    monto_total: precio,
                    comision_empresa: comision,
                    monto_tecnico: neto,
                    estado: "pendiente",
                    metodo_pago: "tarjeta"
                });

                // Crear sesión de Stripe Checkout
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
                    success_url: `${process.env.FRONTEND_URL}/cliente`,
                    cancel_url: `${process.env.FRONTEND_URL}/perfil`,
                    metadata: {
                        id_servicio
                    }
                });

                return res.json({
                    url: session.url
                });
            }

            // 6. Para otros métodos (efectivo, QR, móvil), crear pago pendiente
            const pago = await PagoServicio.create({
                id_servicio,
                monto_total: precio,
                comision_empresa: comision,
                monto_tecnico: neto,
                estado: "pendiente", // Requiere confirmación manual del admin
                metodo_pago
            });

            res.json({
                msg: "Pago registrado. Pendiente de confirmación.",
                pago,
                requiere_confirmacion: true
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

            // Notificar al técnico y cliente (usa el util que maneja push y BD)
            const servicio = await ServicioAsignado.findByPk(id_servicio);
            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);

            // Notificar técnico
            await enviarNotificacion(
                servicio.id_tecnico,
                "Pago recibido",
                "El cliente pagó tu servicio."
            );

            // Notificar cliente
            await enviarNotificacion(
                solicitud.id_cliente,
                "Pago completado",
                "Tu pago fue procesado exitosamente."
            );

            return res.json({ received: true });
        }

        res.json({ received: true });
    },

    // ==========================================
    //        OBTENER PAGO DE UN SERVICIO
    // ==========================================
    async obtenerPorServicio(req, res) {
        try {
            const { id_servicio } = req.params;
            const { id_usuario, rol } = req.user;

            const servicio = await ServicioAsignado.findByPk(id_servicio);
            if (!servicio)
                return res.status(404).json({ msg: "Servicio no encontrado" });

            const solicitud = await SolicitudServicio.findByPk(servicio.id_solicitud);

            const esCliente = rol === "cliente" && solicitud.id_cliente === id_usuario;
            const esTecnico = rol === "tecnico" && servicio.id_tecnico === id_usuario;
            const esAdmin = rol === "admin";

            if (!(esCliente || esTecnico || esAdmin)) {
                return res.status(403).json({ msg: "No puedes ver este pago" });
            }

            const pago = await PagoServicio.findOne({ where: { id_servicio } });
            if (!pago) {
                return res.json({ estado: "sin_registro" });
            }

            res.json(pago);

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo pago" });
        }
    },

    // ==========================================
    //  ADMIN: LISTAR TODOS LOS PAGOS
    // ==========================================
    async listarTodos(req, res) {
        try {
            const pagos = await PagoServicio.findAll({
                include: [
                    {
                        model: ServicioAsignado,
                        attributes: ['id_servicio', 'id_solicitud', 'id_tecnico'],
                        include: [
                            // Incluir SolicitudServicio con Cliente y su Usuario
                            {
                                model: SolicitudServicio,
                                attributes: ['id_solicitud', 'id_cliente'],
                                include: [
                                    {
                                        model: require("../models").Cliente,
                                        attributes: ['id_cliente'],
                                        include: [
                                            {
                                                model: Usuario,
                                                attributes: ['id_usuario', 'nombre', 'apellido', 'email']
                                            }
                                        ]
                                    }
                                ]
                            },
                            // Incluir Técnico (relación definida en ServicioAsignado)
                            {
                                model: require("../models").Tecnico,
                                attributes: ['id_tecnico'],
                                include: [
                                    {
                                        model: Usuario,
                                        attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'foto']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                attributes: [
                    'id_pago',
                    'id_servicio',
                    'monto_total',
                    'comision_empresa',
                    'monto_tecnico',
                    'estado',
                    'stripe_payment_id',
                    'fecha_pago'
                ],
                order: [['fecha_pago', 'DESC']]
            });

            res.json(pagos);

        } catch (error) {
            console.error("❌ ERROR en listarTodos:", error.message);
            console.error("Stack:", error.stack);
            res.status(500).json({ 
                msg: "Error interno del servidor",
                detalle: error.message
            });
        }
    }
};
