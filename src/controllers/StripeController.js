import Stripe from "stripe";
import { ServicioAsignado, PagoServicio, OfertaTecnico } from "../models/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const pagarServicio = async (req, res) => {
    try {
        const { id_servicio, token_stripe } = req.body;

        const servicio = await ServicioAsignado.findByPk(id_servicio, {
            include: [OfertaTecnico]
        });

        if (!servicio) {
            return res.status(404).json({ error: "Servicio no encontrado" });
        }

        const precio = servicio.oferta_tecnico.precio;
        const comisionEmpresa = precio * 0.10;
        const montoTecnico = precio * 0.90;

        const pagoStripe = await stripe.charges.create({
            amount: Math.round(precio * 100),
            currency: "BOB",
            description: "Pago servicio técnico",
            source: token_stripe
        });

        const pago = await PagoServicio.create({
            id_servicio,
            stripe_payment_id: pagoStripe.id,
            monto_total: precio,
            comision_empresa: comisionEmpresa,
            monto_tecnico: montoTecnico,
            estado: "pagado"
        });

        return res.json({
            message: "Pago realizado con éxito",
            pago
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Error en el pago" });
    }
};
