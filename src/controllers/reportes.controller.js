const {
    ServicioAsignado,
    SolicitudServicio,
    PagoServicio,
    Usuario,
    Tecnico,
    Cliente,
    Calificacion,
    Categoria,
    sequelize
} = require("../models");
const { Op } = require("sequelize");

module.exports = {
    // ==========================================
    //        DASHBOARD - ESTADÍSTICAS GENERALES
    // ==========================================
    async dashboard(req, res) {
        try {
            const ahora = new Date();
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const inicioSemana = new Date(ahora);
            inicioSemana.setDate(ahora.getDate() - 7);

            // Total de servicios
            const totalServicios = await ServicioAsignado.count();
            const serviciosMes = await ServicioAsignado.count({
                where: {
                    fecha_asignacion: { [Op.gte]: inicioMes }
                }
            });
            const serviciosSemana = await ServicioAsignado.count({
                where: {
                    fecha_asignacion: { [Op.gte]: inicioSemana }
                }
            });

            // Total de técnicos
            const totalTecnicos = await Tecnico.count();
            const tecnicosActivos = await Tecnico.count({
                where: { disponibilidad: true }
            });

            // Total de clientes
            const totalClientes = await Cliente.count();

            // Ingresos
            const ingresosTotales = await PagoServicio.sum("monto_total", {
                where: { estado: "pagado" }
            }) || 0;

            const ingresosMes = await PagoServicio.sum("monto_total", {
                where: {
                    estado: "pagado",
                    fecha_pago: { [Op.gte]: inicioMes }
                }
            }) || 0;

            // Servicios por estado
            const serviciosPorEstado = await ServicioAsignado.findAll({
                attributes: [
                    "estado",
                    [sequelize.fn("COUNT", sequelize.col("id_servicio")), "cantidad"]
                ],
                group: ["estado"]
            });

            // Top técnicos
            const topTecnicos = await ServicioAsignado.findAll({
                attributes: [
                    "id_tecnico",
                    [sequelize.fn("COUNT", sequelize.col("id_servicio")), "total_servicios"]
                ],
                include: [{
                    model: Tecnico,
                    attributes: ["id_tecnico"],
                    include: [{
                        model: Usuario,
                        attributes: ["nombre", "apellido", "foto"]
                    }]
                }],
                group: ["id_tecnico", "Tecnico.id_tecnico", "Tecnico->Usuario.id_usuario", "Tecnico->Usuario.nombre", "Tecnico->Usuario.apellido", "Tecnico->Usuario.foto"],
                order: [[sequelize.literal("total_servicios"), "DESC"]],
                limit: 5
            });

            res.json({
                servicios: {
                    total: totalServicios,
                    mes: serviciosMes,
                    semana: serviciosSemana,
                    porEstado: serviciosPorEstado.map(s => ({
                        estado: s.estado,
                        cantidad: parseInt(s.dataValues.cantidad)
                    }))
                },
                tecnicos: {
                    total: totalTecnicos,
                    activos: tecnicosActivos
                },
                clientes: {
                    total: totalClientes
                },
                ingresos: {
                    total: parseFloat(ingresosTotales),
                    mes: parseFloat(ingresosMes)
                },
                topTecnicos: topTecnicos.map(t => ({
                    id_tecnico: t.id_tecnico,
                    nombre: t.Tecnico?.Usuario?.nombre || "",
                    apellido: t.Tecnico?.Usuario?.apellido || "",
                    foto: t.Tecnico?.Usuario?.foto || null,
                    total_servicios: parseInt(t.dataValues.total_servicios)
                }))
            });

        } catch (error) {
            console.error("Error en dashboard:", error);
            res.status(500).json({ msg: "Error obteniendo estadísticas" });
        }
    },

    // ==========================================
    //        REPORTES POR ZONA
    // ==========================================
    async ingresosPorZona(req, res) {
        try {
            const { periodo = "mes" } = req.query;
            let fechaInicio;

            if (periodo === "semana") {
                fechaInicio = new Date();
                fechaInicio.setDate(fechaInicio.getDate() - 7);
            } else if (periodo === "mes") {
                fechaInicio = new Date();
                fechaInicio.setMonth(fechaInicio.getMonth() - 1);
            } else {
                fechaInicio = new Date(2020, 0, 1); // Todo el tiempo
            }

            // Obtener ingresos por zona (necesitas tener zona en SolicitudServicio o ServicioAsignado)
            const ingresos = await PagoServicio.findAll({
                attributes: [
                    [sequelize.fn("SUM", sequelize.col("monto")), "ingresos"]
                ],
                include: [{
                    model: ServicioAsignado,
                    include: [{
                        model: SolicitudServicio,
                        attributes: ["ubicacion_texto"]
                    }]
                }],
                where: {
                    estado: "pagado",
                    fecha_pago: { [Op.gte]: fechaInicio }
                },
                group: ["ServicioAsignado.SolicitudServicio.ubicacion_texto"]
            });

            res.json({
                periodo,
                datos: ingresos.map(i => ({
                    zona: i.ServicioAsignado?.SolicitudServicio?.ubicacion_texto || "Sin zona",
                    ingresos: parseFloat(i.dataValues.ingresos || 0)
                }))
            });

        } catch (error) {
            console.error("Error en ingresosPorZona:", error);
            res.status(500).json({ msg: "Error obteniendo reporte" });
        }
    },

    // ==========================================
    //        CLIENTES RECURRENTES
    // ==========================================
    async clientesRecurrentes(req, res) {
        try {
            const clientes = await ServicioAsignado.findAll({
                attributes: [
                    "id_cliente",
                    [sequelize.fn("COUNT", sequelize.col("id_servicio")), "cantidad"]
                ],
                include: [{
                    model: SolicitudServicio,
                    include: [{
                        model: Cliente,
                        include: [{
                            model: Usuario,
                            attributes: ["nombre", "apellido", "foto"]
                        }]
                    }]
                }],
                group: ["id_cliente", "SolicitudServicio.id_solicitud", "SolicitudServicio.Cliente.id_cliente"],
                order: [[sequelize.literal("cantidad"), "DESC"]],
                limit: 10
            });

            res.json({
                clientes: clientes.map(c => ({
                    id_cliente: c.id_cliente,
                    nombre: c.SolicitudServicio?.Cliente?.Usuario?.nombre || "",
                    apellido: c.SolicitudServicio?.Cliente?.Usuario?.apellido || "",
                    cantidad: parseInt(c.dataValues.cantidad)
                }))
            });

        } catch (error) {
            console.error("Error en clientesRecurrentes:", error);
            res.status(500).json({ msg: "Error obteniendo reporte" });
        }
    },

    // ==========================================
    //        TÉCNICOS DESTACADOS
    // ==========================================
    async tecnicosDestacados(req, res) {
        try {
            const tecnicos = await Tecnico.findAll({
                attributes: [
                    "id_tecnico",
                    "calificacion_promedio",
                    [sequelize.fn("COUNT", sequelize.col("ServicioAsignados.id_servicio")), "total_servicios"]
                ],
                include: [{
                    model: Usuario,
                    attributes: ["nombre", "apellido", "foto"]
                }, {
                    model: ServicioAsignado,
                    attributes: [],
                    required: false
                }],
                group: ["Tecnico.id_tecnico", "Usuario.id_usuario"],
                order: [[sequelize.literal("calificacion_promedio"), "DESC"]],
                limit: 10
            });

            res.json({
                tecnicos: tecnicos.map(t => ({
                    id_tecnico: t.id_tecnico,
                    nombre: t.Usuario?.nombre || "",
                    apellido: t.Usuario?.apellido || "",
                    foto: t.Usuario?.foto || null,
                    calificacion: parseFloat(t.calificacion_promedio || 0),
                    total_servicios: parseInt(t.dataValues.total_servicios || 0)
                }))
            });

        } catch (error) {
            console.error("Error en tecnicosDestacados:", error);
            res.status(500).json({ msg: "Error obteniendo reporte" });
        }
    },

    // ==========================================
    //   SERVICIOS POR CATEGORÍA (BI)
    // ==========================================
    async serviciosPorCategoria(req, res) {
        try {
            const result = await SolicitudServicio.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('SolicitudServicio.id_solicitud')), 'total']
                ],
                include: [{
                    model: Categoria,
                    attributes: ['nombre']
                }],
                group: ['Categorium.id_categoria', 'Categorium.nombre']
            });

            const formatted = result.map(r => ({
                categoria: r.Categorium?.nombre || 'Sin categoría',
                total: parseInt(r.dataValues.total)
            }));

            res.json(formatted);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo servicios por categoría" });
        }
    },

    // ==========================================
    //   INGRESOS POR PERÍODO (BI)
    // ==========================================
    async ingresosPorPeriodo(req, res) {
        try {
            const { desde, hasta } = req.query;

            const where = { estado: "pagado" };
            if (desde && hasta) {
                where.fecha_pago = {
                    [Op.between]: [new Date(desde), new Date(hasta)]
                };
            }

            const pagos = await PagoServicio.findAll({
                where,
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('fecha_pago')), 'fecha'],
                    [sequelize.fn('SUM', sequelize.col('monto_total')), 'total'],
                    [sequelize.fn('SUM', sequelize.col('comision_empresa')), 'comision'],
                    [sequelize.fn('SUM', sequelize.col('monto_tecnico')), 'monto_tecnico']
                ],
                group: [sequelize.fn('DATE', sequelize.col('fecha_pago'))],
                order: [[sequelize.fn('DATE', sequelize.col('fecha_pago')), 'ASC']]
            });

            const formatted = pagos.map(p => ({
                fecha: p.dataValues.fecha,
                total: parseFloat(p.dataValues.total || 0),
                comision: parseFloat(p.dataValues.comision || 0),
                monto_tecnico: parseFloat(p.dataValues.monto_tecnico || 0)
            }));

            res.json(formatted);
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo ingresos" });
        }
    },

    // ==========================================
    //   TÉCNICOS TOP (BI)
    // ==========================================
    async tecnicosTop(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            const result = await ServicioAsignado.findAll({
                attributes: [
                    'id_tecnico',
                    [sequelize.fn('COUNT', sequelize.col('ServicioAsignado.id_servicio')), 'total_servicios']
                ],
                include: [{
                    model: Tecnico,
                    attributes: ['id_tecnico', 'calificacion_promedio'],
                    include: [{
                        model: Usuario,
                        attributes: ['nombre', 'apellido', 'foto']
                    }]
                }],
                group: ['ServicioAsignado.id_tecnico', 'Tecnico.id_tecnico', 'Tecnico.calificacion_promedio', 'Tecnico->Usuario.id_usuario', 'Tecnico->Usuario.nombre', 'Tecnico->Usuario.apellido', 'Tecnico->Usuario.foto'],
                order: [[sequelize.fn('COUNT', sequelize.col('ServicioAsignado.id_servicio')), 'DESC']],
                limit
            });

            const formatted = result.map(r => ({
                id_tecnico: r.id_tecnico,
                nombre: r.Tecnico?.Usuario?.nombre || '',
                apellido: r.Tecnico?.Usuario?.apellido || '',
                foto: r.Tecnico?.Usuario?.foto,
                total_servicios: parseInt(r.dataValues.total_servicios),
                calificacion: parseFloat(r.Tecnico?.calificacion_promedio || 0)
            }));

            res.json(formatted);
        } catch (error) {
            console.error("❌ ERROR en tecnicosTop:", error.message);
            console.error("Stack:", error.stack);
            res.status(500).json({ msg: "Error obteniendo técnicos top", detalle: error.message });
        }
    },

    // ==========================================
    //   RESUMEN GENERAL (KPIs)
    // ==========================================
    async resumenGeneral(req, res) {
        try {
            const [totalServicios, serviciosCompletados, totalIngresos, totalClientes, totalTecnicos] = await Promise.all([
                ServicioAsignado.count(),
                ServicioAsignado.count({ where: { estado: 'completado' } }),
                PagoServicio.sum('monto_total', { where: { estado: 'pagado' } }),
                Usuario.count({ where: { rol: 'cliente' } }),
                Usuario.count({ where: { rol: 'tecnico', estado: true } })
            ]);

            res.json({
                total_servicios: totalServicios || 0,
                servicios_completados: serviciosCompletados || 0,
                total_ingresos: parseFloat(totalIngresos || 0).toFixed(2),
                total_clientes: totalClientes || 0,
                total_tecnicos: totalTecnicos || 0,
                tasa_completacion: totalServicios > 0 ? ((serviciosCompletados / totalServicios) * 100).toFixed(2) : 0
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error obteniendo resumen general" });
        }
    }
};

