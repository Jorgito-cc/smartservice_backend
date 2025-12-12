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
const GEMINI_API_KEY = "AIzaSyB78Du7timMnSZ_Ma8japB8C1md9NwPh2k";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Control global de rate limiting
let ultimaLlamadaGemini = 0;
const DELAY_MINIMO_MS = 2000; // Mínimo 2 segundos entre peticiones (aumentado)

// Función auxiliar para llamar a Gemini CON RETRY Y BACKOFF AGRESIVO
async function llamarGemini(prompt, reintentos = 8) {
  // Respetar delay mínimo entre peticiones
  const ahora = Date.now();
  const tiempoEspera = DELAY_MINIMO_MS - (ahora - ultimaLlamadaGemini);
  if (tiempoEspera > 0) {
    console.log(`⏳ Esperando ${tiempoEspera}ms antes de llamar Gemini...`);
    await new Promise((resolve) => setTimeout(resolve, tiempoEspera));
  }
  ultimaLlamadaGemini = Date.now();

  let ultimoError = null;

  for (let intento = 0; intento < reintentos; intento++) {
    try {
      console.log(`🔄 Gemini intento ${intento + 1}/${reintentos}`);
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
          timeout: 120000, // Aumentado a 120 segundos
        }
      );

      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0]
      ) {
        console.log("✅ Gemini OK en intento", intento + 1);
        return response.data.candidates[0].content.parts[0].text;
      }
      return "No se pudo generar la respuesta";
    } catch (error) {
      const statusCode = error.response?.status;
      const esRateLimit = statusCode === 429;
      const esTimeout = error.code === "ECONNABORTED" || statusCode === 503;
      const esError5xx = statusCode >= 500;

      ultimoError = error;

      console.log(
        `❌ Error ${statusCode} en intento ${intento + 1}: ${error.message}`
      );

      // Si hay más reintentos, esperar y continuar
      if (intento < reintentos - 1) {
        let esperarMs;

        if (esRateLimit) {
          // Para 429: espera exponencial más agresiva: 3s, 6s, 12s, 24s, 48s, 96s, 192s, 384s
          esperarMs = Math.pow(2, intento) * 3000;
          console.log(`⚠️ Rate limit (429) detectado - esperando mucho...`);
        } else if (esTimeout || esError5xx) {
          // Para timeouts/5xx: espera exponencial moderada
          esperarMs = Math.pow(1.5, intento) * 2000;
        } else {
          // Para otros errores: espera rápida
          esperarMs = 1000;
        }

        const esperarSeg = Math.round(esperarMs / 1000);
        console.log(
          `⏳ Reintentando en ${esperarSeg}s (intento ${intento + 1}/${
            reintentos - 1
          })...`
        );
        await new Promise((resolve) => setTimeout(resolve, esperarMs));
        continue;
      }
    }
  }

  // Si llegamos aquí, agotamos todos los reintentos
  console.error("❌ Agotados todos los reintentos de Gemini");
  throw ultimoError || new Error("Error desconocido al llamar Gemini API");
}

// Obtener datos del período para análisis - OPTIMIZADO CON QUERIES PARALELAS
async function obtenerDatosAnalisis(desde, hasta) {
  const where = {};

  if (desde && hasta) {
    where.fecha_pago = {
      [Op.between]: [new Date(desde), new Date(hasta)],
    };
  }

  try {
    // EJECUTAR TODAS LAS QUERIES EN PARALELO con Promise.all()
    const [
      totalServicios,
      serviciosCompletados,
      ingresosTotales,
      comisionTotales,
      montoPendiente,
      serviciosPorCategoria,
      topTecnicos,
      totalClientes,
      totalTecnicos,
      tecnicosActivos,
      ingresosPorDia,
      pagosPendientes,
    ] = await Promise.all([
      // 1. Total servicios
      ServicioAsignado.count(),
      // 2. Servicios completados
      ServicioAsignado.count({ where: { estado: "completado" } }),
      // 3. Ingresos totales
      PagoServicio.sum("monto_total", {
        where: { estado: "pagado", ...where },
      }),
      // 4. Comisión totales
      PagoServicio.sum("comision_empresa", {
        where: { estado: "pagado", ...where },
      }),
      // 5. Monto pendiente
      PagoServicio.sum("monto_total", {
        where: { estado: "pendiente", ...where },
      }),
      // 6. Servicios por categoría - Query SQL SIMPLIFICADA
      sequelize.query(
        `SELECT COUNT(ss.id_solicitud) as total, c.nombre
         FROM solicitud_servicio ss
         LEFT JOIN categoria c ON ss.id_categoria = c.id_categoria
         GROUP BY c.id_categoria, c.nombre
         ORDER BY total DESC LIMIT 5`,
        { type: sequelize.QueryTypes.SELECT }
      ),
      // 7. Top técnicos - Query SQL SIMPLIFICADA
      sequelize.query(
        `SELECT sa.id_tecnico, COUNT(sa.id_servicio) as total_servicios,
                t.calificacion_promedio, u.nombre, u.apellido
         FROM servicio_asignado sa
         INNER JOIN tecnico t ON sa.id_tecnico = t.id_tecnico
         INNER JOIN usuario u ON t.id_tecnico = u.id_usuario
         GROUP BY sa.id_tecnico, t.id_tecnico, u.id_usuario
         ORDER BY total_servicios DESC LIMIT 3`,
        { type: sequelize.QueryTypes.SELECT }
      ),
      // 8. Total clientes
      Cliente.count(),
      // 9. Total técnicos
      Tecnico.count(),
      // 10. Técnicos activos
      Tecnico.count({ where: { disponibilidad: true } }),
      // 11. Ingresos por día (últimos 7 días)
      PagoServicio.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("fecha_pago")), "fecha"],
          [sequelize.fn("SUM", sequelize.col("monto_total")), "total"],
        ],
        where: {
          estado: "pagado",
          fecha_pago: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("fecha_pago"))],
        order: [[sequelize.fn("DATE", sequelize.col("fecha_pago")), "ASC"]],
        raw: true,
      }),
      // 12. Pagos pendientes
      PagoServicio.count({ where: { estado: "pendiente", ...where } }),
    ]);

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
        total: parseFloat(ingresosTotales) || 0,
        comision: parseFloat(comisionTotales) || 0,
        pendiente: parseFloat(montoPendiente) || 0,
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
      categorias: (serviciosPorCategoria || []).map((c) => ({
        nombre: c.nombre || "Sin categoría",
        total: parseInt(c.total) || 0,
      })),
      tecnicos: (topTecnicos || []).map((t) => ({
        nombre: t.nombre,
        apellido: t.apellido,
        servicios: parseInt(t.total_servicios) || 0,
        calificacion: parseFloat(t.calificacion_promedio) || 0,
      })),
      pagos: {
        pendientes: pagosPendientes,
        pendienteMonto: montoPendiente,
      },
      tendencia: ingresosPorDia || [],
    };
  } catch (error) {
    console.error("Error en obtenerDatosAnalisis:", error);
    throw error;
  }
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

  // ==========================================
  //   EXPLICAR GRÁFICO DE INGRESOS
  // ==========================================
  async explicarGraficoIngresos(req, res) {
    try {
      console.log("Iniciando explicación de gráfico de ingresos...");
      const { desde, hasta } = req.query;

      // Obtener datos de ingresos por día
      const ingresosPorDia = await PagoServicio.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("fecha_pago")), "fecha"],
          [sequelize.fn("SUM", sequelize.col("monto_total")), "total"],
          [sequelize.fn("SUM", sequelize.col("comision_empresa")), "comision"],
        ],
        where: {
          estado: "pagado",
          ...(desde &&
            hasta && {
              fecha_pago: {
                [Op.between]: [new Date(desde), new Date(hasta)],
              },
            }),
        },
        group: [sequelize.fn("DATE", sequelize.col("fecha_pago"))],
        order: [[sequelize.fn("DATE", sequelize.col("fecha_pago")), "ASC"]],
        raw: true,
      });

      // Calcular estadísticas
      const totales = ingresosPorDia.map((d) => parseFloat(d.total) || 0);
      const maxIngreso = Math.max(...totales);
      const minIngreso = Math.min(...totales);
      const promedio = totales.reduce((a, b) => a + b, 0) / totales.length || 0;

      // Detectar tendencia
      const primeros3 = totales.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const ultimos3 = totales.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const tendencia = ultimos3 > primeros3 ? "creciente" : "decreciente";

      // Construir prompt para Gemini
      const prompt = `
Analiza los datos de ingresos diarios y genera una EXPLICACIÓN CLARA Y PROFESIONAL del gráfico (máximo 150 palabras).

DATOS DEL GRÁFICO:
- Período: ${desde} al ${hasta}
- Total de días con datos: ${ingresosPorDia.length}
- Ingreso máximo en un día: Bs. ${maxIngreso.toFixed(2)}
- Ingreso mínimo en un día: Bs. ${minIngreso.toFixed(2)}
- Ingreso promedio por día: Bs. ${promedio.toFixed(2)}
- Tendencia general: ${tendencia}
- Variación: ${((maxIngreso - minIngreso) / promedio * 100).toFixed(2)}% de cambio respecto al promedio

Datos diarios:
${ingresosPorDia
  .map(
    (d) =>
      `${d.fecha}: Bs. ${parseFloat(d.total).toFixed(2)} (comisión: Bs. ${
        parseFloat(d.comision) || 0
      })`
  )
  .join("\n")}

Proporciona:
1. Una descripción de la tendencia observada
2. Días con mejor y peor desempeño
3. Conclusiones sobre la salud financiera

Sé conciso y directo.
`;

      console.log("Llamando a Gemini API para explicación de gráfico...");
      const explicacion = await llamarGemini(prompt);
      console.log("Explicación generada");

      res.json({
        explicacion,
        estadisticas: {
          maxIngreso: maxIngreso.toFixed(2),
          minIngreso: minIngreso.toFixed(2),
          promedio: promedio.toFixed(2),
          tendencia,
          variacion: ((maxIngreso - minIngreso) / promedio * 100).toFixed(2),
        },
      });
    } catch (error) {
      console.error("Error en explicarGraficoIngresos:", error);
      res.status(500).json({
        msg: "Error generando explicación del gráfico",
        error: error.message,
      });
    }
  },
