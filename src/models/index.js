const { Sequelize } = require("sequelize");

// Importar modelos
const Usuario = require("./usuario");
const Cliente = require("./cliente");
const Tecnico = require("./tecnico");
const Admin = require("./admin");

const Categoria = require("./categoria");
const Zona = require("./zona");
const Especialidad = require("./especialidad");

const TecnicoZona = require("./tecnico_zona");
const TecnicoEspecialidad = require("./tecnico_especialidad");
const TecnicoUbicacion = require("./tecnico_ubicacion");

const SolicitudServicio = require("./solicitud_servicio");
const OfertaTecnico = require("./oferta_tecnico");
const ServicioAsignado = require("./servicio_asignado");

const PagoServicio = require("./pago_servicio");
const Calificacion = require("./calificacion");
const Incidencia = require("./incidencia");

const ChatMensaje = require("./chat_mensaje");
const Notificacion = require("./notificacion");
const AuditoriaLog = require("./auditoria_log");

// ==============================
//   INICIALIZAR CONEXIÓN
// ==============================
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: "postgres",
        logging: false
    }
);

// Inicializar todos los modelos
Usuario.initModel(sequelize);
Cliente.initModel(sequelize);
Tecnico.initModel(sequelize);
Admin.initModel(sequelize);

Categoria.initModel(sequelize);
Zona.initModel(sequelize);
Especialidad.initModel(sequelize);

TecnicoZona.initModel(sequelize);
TecnicoEspecialidad.initModel(sequelize);
TecnicoUbicacion.initModel(sequelize);

SolicitudServicio.initModel(sequelize);
OfertaTecnico.initModel(sequelize);
ServicioAsignado.initModel(sequelize);

PagoServicio.initModel(sequelize);
Calificacion.initModel(sequelize);
Incidencia.initModel(sequelize);

ChatMensaje.initModel(sequelize);
Notificacion.initModel(sequelize);
AuditoriaLog.initModel(sequelize);

// ==============================
//   DEFINIR ASOCIACIONES
// ==============================
function setupAssociations() {

    // ========================================
    //          HERENCIA / ROLES
    // ========================================

    Usuario.hasOne(Cliente, { foreignKey: "id_cliente" });
    Cliente.belongsTo(Usuario, { foreignKey: "id_cliente" });

    Usuario.hasOne(Tecnico, { foreignKey: "id_tecnico" });
    Tecnico.belongsTo(Usuario, { foreignKey: "id_tecnico" });

    Usuario.hasOne(Admin, { foreignKey: "id_admin" });
    Admin.belongsTo(Usuario, { foreignKey: "id_admin" });


    // ========================================
    //             CATEGORÍAS
    // ========================================
    Categoria.hasMany(SolicitudServicio, { foreignKey: "id_categoria" });
    SolicitudServicio.belongsTo(Categoria, { foreignKey: "id_categoria" });

    
    // ========================================
    //               TÉCNICO – ZONA (N:M)
    // ========================================
    Tecnico.belongsToMany(Zona, {
        through: TecnicoZona,
        foreignKey: "id_tecnico"
    });

    Zona.belongsToMany(Tecnico, {
        through: TecnicoZona,
        foreignKey: "id_zona"
    });


    

// ========================================
//         TÉCNICO – ESPECIALIDAD (N:M)
// ========================================
Tecnico.belongsToMany(Especialidad, {
    through: TecnicoEspecialidad,
    foreignKey: "id_tecnico"
});

Especialidad.belongsToMany(Tecnico, {
    through: TecnicoEspecialidad,
    foreignKey: "id_especialidad"
});

// UBICACION DEL TÉCNICO
Tecnico.hasMany(TecnicoUbicacion, { foreignKey: "id_tecnico" });
TecnicoUbicacion.belongsTo(Tecnico, { foreignKey: "id_tecnico" });


    // ========================================
    //         SOLICITUD DE SERVICIO
    // ========================================
    Cliente.hasMany(SolicitudServicio, { foreignKey: "id_cliente" });
    SolicitudServicio.belongsTo(Cliente, { foreignKey: "id_cliente" });


    // ========================================
    //              OFERTAS DEL TÉCNICO
    // ========================================
    SolicitudServicio.hasMany(OfertaTecnico, { foreignKey: "id_solicitud" });
    OfertaTecnico.belongsTo(SolicitudServicio, { foreignKey: "id_solicitud" });

    Tecnico.hasMany(OfertaTecnico, { foreignKey: "id_tecnico" });
    OfertaTecnico.belongsTo(Tecnico, { foreignKey: "id_tecnico" });


    // ========================================
    //              SERVICIO ASIGNADO
    // ========================================
    SolicitudServicio.hasOne(ServicioAsignado, { foreignKey: "id_solicitud" });
    ServicioAsignado.belongsTo(SolicitudServicio, { foreignKey: "id_solicitud" });

    OfertaTecnico.hasOne(ServicioAsignado, { foreignKey: "id_oferta" });
    ServicioAsignado.belongsTo(OfertaTecnico, { foreignKey: "id_oferta" });

    Tecnico.hasMany(ServicioAsignado, { foreignKey: "id_tecnico" });
    ServicioAsignado.belongsTo(Tecnico, { foreignKey: "id_tecnico" });


    // ========================================
    //                 PAGOS
    // ========================================
    ServicioAsignado.hasOne(PagoServicio, { foreignKey: "id_servicio" });
    PagoServicio.belongsTo(ServicioAsignado, { foreignKey: "id_servicio" });


    // ========================================
    //                CALIFICACIONES
    // ========================================
    ServicioAsignado.hasMany(Calificacion, { foreignKey: "id_servicio" });
    Calificacion.belongsTo(ServicioAsignado, { foreignKey: "id_servicio" });

    Cliente.hasMany(Calificacion, { foreignKey: "id_cliente" });
    Calificacion.belongsTo(Cliente, { foreignKey: "id_cliente" });

    Tecnico.hasMany(Calificacion, { foreignKey: "id_tecnico" });
    Calificacion.belongsTo(Tecnico, { foreignKey: "id_tecnico" });


    // ========================================
    //                 INCIDENCIAS
    // ========================================
    ServicioAsignado.hasMany(Incidencia, { foreignKey: "id_servicio" });
    Incidencia.belongsTo(ServicioAsignado, { foreignKey: "id_servicio" });

    Usuario.hasMany(Incidencia, { foreignKey: "id_usuario_reporta" });
    Incidencia.belongsTo(Usuario, { foreignKey: "id_usuario_reporta" });


    // ========================================
    //                 CHAT
    // ========================================
    ServicioAsignado.hasMany(ChatMensaje, { foreignKey: "id_servicio" });
    ChatMensaje.belongsTo(ServicioAsignado, { foreignKey: "id_servicio" });

    SolicitudServicio.hasMany(ChatMensaje, { foreignKey: "id_solicitud", as: "mensajesGrupales" });
    ChatMensaje.belongsTo(SolicitudServicio, { foreignKey: "id_solicitud", as: "solicitud" });

    Usuario.hasMany(ChatMensaje, { foreignKey: "emisor_id" });
    ChatMensaje.belongsTo(Usuario, { foreignKey: "emisor_id" });


    // ========================================
    //                NOTIFICACIONES
    // ========================================
    Usuario.hasMany(Notificacion, { foreignKey: "id_usuario" });
    Notificacion.belongsTo(Usuario, { foreignKey: "id_usuario" });


    // ========================================
    //                AUDITORÍA
    // ========================================
    Usuario.hasMany(AuditoriaLog, { foreignKey: "usuario_id" });
    AuditoriaLog.belongsTo(Usuario, { foreignKey: "usuario_id" });
}

setupAssociations();

module.exports = {
    sequelize,
    Usuario,
    Cliente,
    Tecnico,
    Admin,
    Categoria,
    Zona,
    Especialidad,
    TecnicoZona,
    TecnicoEspecialidad,
    TecnicoUbicacion,
    SolicitudServicio,
    OfertaTecnico,
    ServicioAsignado,
    PagoServicio,
    Calificacion,
    Incidencia,
    ChatMensaje,
    Notificacion,
    AuditoriaLog
};
