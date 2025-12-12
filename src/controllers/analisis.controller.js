const {
  ServicioAsignado,
  SolicitudServicio,
  PagoServicio,
  Usuario,
  Tecnico,
  Cliente,
  Calificacion,
  Categoria,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const axios = require("axios");

// Clave de API de Google Gemini
const GEMINI_API_KEY = "AIzaSyBxE61y03VPiXldGlbqGid5LB3_GqguDxQ";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Función auxiliar para llamar a Gemini
async function llamarGemini(prompt) {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0]
    ) {
      return response.data.candidates[0].content.parts[0].text;
    }
    console.error("Respuesta de Gemini sin contenido:", response.data);
    return "No se pudo generar la respuesta";
  } catch (error) {
    console.error("Error llamando a Gemini API:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Error de API de Gemini: ${error.message}`);
  }
}

// Obtener datos del período para análisis
async function obtenerDatosAnalisis(desde, hasta) {
  const where = {};

  if (desde && hasta) {
    where.fecha_pago = {
      [Op.between]: [new Date(desde), new Date(hasta)],
    };
  }

  // Total de servicios
  const totalServicios = await ServicioAsignado.count();
  const serviciosCompletados = await ServicioAsignado.count({
    where: { estado: "completado" },
  });

  // Ingresos
  const ingresosTotales =
    (await PagoServicio.sum("monto_total", {
      where: { estado: "pagado", ...where },
    })) || 0;

  const comisionTotales =
    (await PagoServicio.sum("comision_empresa", {
      where: { estado: "pagado", ...where },
    })) || 0;

  const montoPendiente =
    (await PagoServicio.sum("monto_total", {
      where: { estado: "pendiente", ...where },
    })) || 0;

  // Servicios por categoría - Sin usar raw para que el include funcione correctamente
  const serviciosPorCategoria = await SolicitudServicio.findAll({
    attributes: [
      [
        sequelize.fn("COUNT", sequelize.col("SolicitudServicio.id_solicitud")),
        "total",
      ],
    ],
    include: [
      {
        model: Categoria,
        attributes: ["id_categoria", "nombre"],
        required: false,
      },
    ],
    group: ["Categoria.id_categoria"],
    order: [
      [sequelize.literal("COUNT(SolicitudServicio.id_solicitud)"), "DESC"],
    ],
    limit: 5,
    subQuery: false,
  });

  // Top técnicos - simplificado sin raw
  const topTecnicos = await ServicioAsignado.findAll({
    attributes: [
      "id_tecnico",
      [sequelize.fn("COUNT", sequelize.col("id_servicio")), "total_servicios"],
    ],
    include: [
      {
        model: Tecnico,
        attributes: ["calificacion_promedio"],
        required: true,
        include: [
          {
            model: Usuario,
            attributes: ["nombre", "apellido"],
            required: true,
          },
        ],
      },
    ],
    group: [
      "ServicioAsignado.id_tecnico",
      "Tecnico.id_tecnico",
      "Tecnico->Usuario.id_usuario",
    ],
    order: [[sequelize.literal("COUNT(ServicioAsignado.id_servicio)"), "DESC"]],
    limit: 3,
    subQuery: false,
  });

  // Usuarios
  const totalClientes = await Cliente.count();
  const totalTecnicos = await Tecnico.count();
  const tecnicosActivos = await Tecnico.count({
    where: { disponibilidad: true },
  });

  // Ingresos por día (últimos 7 días) para análisis de tendencias
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);

  const ingresosPorDia = await PagoServicio.findAll({
    attributes: [
      [sequelize.fn("DATE", sequelize.col("fecha_pago")), "fecha"],
      [sequelize.fn("SUM", sequelize.col("monto_total")), "total"],
    ],
    where: {
      estado: "pagado",
      fecha_pago: { [Op.gte]: hace7Dias },
    },
    group: [sequelize.fn("DATE", sequelize.col("fecha_pago"))],
    order: [[sequelize.fn("DATE", sequelize.col("fecha_pago")), "ASC"]],
    raw: true,
  });

  // Pagos pendientes
  const pagosPendientes = await PagoServicio.count({
    where: { estado: "pendiente", ...where },
  });

  return {
    servicios: {
      total: totalServicios,
      completados: serviciosCompletados,
      porcentajeCompletacion:
        totalServicios > 0
          ? ((serviciosCompletados / totalServicios) * 100).toFixed(2)
          : 0,
    },
    ingresos: {
      total: parseFloat(ingresosTotales),
      comision: parseFloat(comisionTotales),
      pendiente: parseFloat(montoPendiente),
      porcentajePendiente:
        ingresosTotales > 0
          ? (
              (montoPendiente / (ingresosTotales + montoPendiente)) *
              100
            ).toFixed(2)
          : 0,
    },
    usuarios: {
      clientes: totalClientes,
      tecnicos: totalTecnicos,
      tecnicosActivos,
    },
    categorias: serviciosPorCategoria.map((c) => ({
      nombre: c.Categoria?.nombre || "Sin categoría",
      total: parseInt(c.dataValues?.total || 0),
    })),
    tecnicos: topTecnicos.map((t) => ({
      nombre: t.Tecnico?.Usuario?.nombre,
      apellido: t.Tecnico?.Usuario?.apellido,
      servicios: parseInt(
        t.dataValues?.total_servicios || t.total_servicios || 0
      ),
      calificacion: parseFloat(t.Tecnico?.calificacion_promedio || 0),
    })),
    pagos: {
      pendientes: pagosPendientes,
      pendienteMonto: montoPendiente,
    },
    tendencia: ingresosPorDia,
  };
}

module.exports = {
  // ==========================================
  //   INTERPRETACIÓN INTELIGENTE
  // ==========================================
  async interpretacionInteligente(req, res) {
    try {
      console.log("Iniciando interpretación inteligente...");
      const { desde, hasta } = req.query;
      console.log("Parámetros:", { desde, hasta });

      const datos = await obtenerDatosAnalisis(desde, hasta);
      console.log("Datos obtenidos correctamente");

      // Construir prompt para Gemini
      const prompt = `
Eres un analista de negocios experto. Analiza los siguientes datos de una plataforma de servicios técnicos y proporciona un resumen ejecutivo CORTO pero profundo (máximo 200 palabras).

DATOS DEL PERÍODO:
- Total Servicios: ${datos.servicios.total}
- Servicios Completados: ${datos.servicios.completados} (${
        datos.servicios.porcentajeCompletacion
      }%)
- Ingresos Totales: Bs. ${datos.ingresos.total.toFixed(2)}
- Comisión Empresa: Bs. ${datos.ingresos.comision.toFixed(2)}
- Pagos Pendientes: Bs. ${datos.ingresos.pendiente.toFixed(2)} (${
        datos.ingresos.porcentajePendiente
      }%)
- Total Clientes: ${datos.usuarios.clientes}
- Total Técnicos: ${datos.usuarios.tecnicos} (${
        datos.usuarios.tecnicosActivos
      } activos)
- Categorías Principales: ${datos.categorias
        .map((c) => `${c.nombre} (${c.total})`)
        .join(", ")}
- Top Técnicos: ${datos.tecnicos
        .map(
          (t) =>
            `${t.nombre} ${t.apellido} (${t.servicios} servicios, ${t.calificacion}★)`
        )
        .join(", ")}
- Pagos Pendientes (cantidad): ${datos.pagos.pendientes}

Genera un análisis que responda estas preguntas:
1. ¿El negocio está creciendo o decayendo?
2. ¿Cuáles son las categorías más demandadas?
3. ¿Hay buena distribución de trabajo entre técnicos?
4. ¿Cuál es el estado de los pagos?
5. ¿Cuáles son las principales oportunidades de mejora?

Formato: Párrafos cortos, directo al punto, profesional.
`;

      console.log("Llamando a Gemini API...");
      const interpretacion = await llamarGemini(prompt);
      console.log("Respuesta de Gemini recibida");

      res.json({
        interpretacion,
        datos,
      });
    } catch (error) {
      console.error("Error en interpretacionInteligente:", error);
      res.status(500).json({
        msg: "Error generando interpretación",
        error: error.message,
      });
    }
  },

  // ==========================================
  //   ACONSEJADOR INTELIGENTE
  // ==========================================
  async aconsejadorInteligente(req, res) {
    try {
      console.log("Iniciando aconsejador inteligente...");
      const { desde, hasta } = req.query;
      console.log("Parámetros:", { desde, hasta });

      const datos = await obtenerDatosAnalisis(desde, hasta);
      console.log("Datos obtenidos correctamente");

      // Construir prompt para Gemini
      const prompt = `
Eres un consultor empresarial experto. Basándote en los datos siguientes, genera RECOMENDACIONES ESPECÍFICAS y ACCIONABLES para mejorar el negocio.

DATOS DEL PERÍODO:
- Total Servicios: ${datos.servicios.total}
- Servicios Completados: ${datos.servicios.completados} (${
        datos.servicios.porcentajeCompletacion
      }%)
- Ingresos Totales: Bs. ${datos.ingresos.total.toFixed(2)}
- Comisión Empresa: Bs. ${datos.ingresos.comision.toFixed(2)}
- Pagos Pendientes: Bs. ${datos.ingresos.pendiente.toFixed(2)} (${
        datos.ingresos.porcentajePendiente
      }%)
- Total Clientes: ${datos.usuarios.clientes}
- Total Técnicos: ${datos.usuarios.tecnicos} (${
        datos.usuarios.tecnicosActivos
      } activos)
- Categorías Principales: ${datos.categorias
        .map((c) => `${c.nombre} (${c.total})`)
        .join(", ")}
- Top Técnicos: ${datos.tecnicos
        .map(
          (t) =>
            `${t.nombre} ${t.apellido} (${t.servicios} servicios, ${t.calificacion}★)`
        )
        .join(", ")}
- Pagos Pendientes (cantidad): ${datos.pagos.pendientes}

Genera recomendaciones distribuidas en 5 categorías:

🎯 A) RECOMENDACIONES OPERATIVAS
- ${
        datos.pagos.pendientes > 5
          ? "Pagos pendientes elevados: Implementar sistema de seguimiento automático"
          : "Sistema de pagos está bajo control"
      }
- ${
        Math.max(...datos.tecnicos.map((t) => t.servicios)) >
        (datos.servicios.total / datos.usuarios.tecnicos) * 1.5
          ? "Hay técnicos sobrecargados: Redistribuir carga de trabajo"
          : "Distribución equitativa de trabajo"
      }

🎯 B) RECOMENDACIONES DE NEGOCIO/ESTRATEGIA
- Enfoque en categorías: ${datos.categorias[0]?.nombre || "principal"}
- Potencial de crecimiento: ${
        datos.usuarios.clientes < 50
          ? "Expansión agresiva de marketing"
          : "Retención y especialización"
      }

🎯 C) RECOMENDACIONES DE RECURSOS HUMANOS
- Estado de equipo técnico: ${datos.usuarios.tecnicosActivos}/${
        datos.usuarios.tecnicos
      } activos
- Acciones: ${
        datos.usuarios.tecnicosActivos < datos.usuarios.tecnicos * 0.8
          ? "Activar técnicos inactivos o contratar"
          : "Optimizar uso de capacidad"
      }

🎯 D) RECOMENDACIONES FINANCIERAS
- Margen de ganancia: ${(
        (datos.ingresos.comision / datos.ingresos.total) *
        100
      ).toFixed(2)}%
- Acción: ${
        datos.ingresos.comision < datos.ingresos.total * 0.3
          ? "Revisar estructura de comisiones"
          : "Mantener modelo actual"
      }

🎯 E) RECOMENDACIONES PREDICTIVAS
- Tendencia: ${
        datos.servicios.total > 20
          ? "Crecimiento esperado en próximas semanas"
          : "Necesita impulso de marketing"
      }
- Prioridad: ${
        datos.pagos.pendientes > 0
          ? "Crítica: Resolver pagos pendientes"
          : "Estable"
      }

Sé específico, profesional y enfocado en acciones concretas.
`;

      console.log("Llamando a Gemini API...");
      const recomendaciones = await llamarGemini(prompt);
      console.log("Respuesta de Gemini recibida");

      res.json({
        recomendaciones,
        datos,
      });
    } catch (error) {
      console.error("Error en aconsejadorInteligente:", error);
      res.status(500).json({
        msg: "Error generando recomendaciones",
        error: error.message,
      });
    }
  },
};
