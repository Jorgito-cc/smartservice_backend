const { Model, DataTypes } = require("sequelize");

class SolicitudServicio extends Model {
    static initModel(sequelize) {
        SolicitudServicio.init({
            id_solicitud: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_cliente: { type: DataTypes.INTEGER },
            id_categoria: { type: DataTypes.INTEGER },
            descripcion: { type: DataTypes.TEXT, allowNull: false },
            fecha_publicacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            ubicacion_texto: { type: DataTypes.TEXT },
            lat: { type: DataTypes.DECIMAL(10, 6) },
            lon: { type: DataTypes.DECIMAL(10, 6) },
            precio_ofrecido: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            fotos: { type: DataTypes.JSON, allowNull: true },
            estado: {
                type: DataTypes.ENUM(
                    "pendiente",
                    "con_ofertas",
                    "asignado",
                    "en_proceso",
                    "completado",
                    "cancelado"
                ),
                allowNull: false,
                defaultValue: "pendiente"
            }
        }, {
            sequelize,
            modelName: "SolicitudServicio",
            tableName: "solicitud_servicio",
            timestamps: false
        });

        return SolicitudServicio;
    }
}

module.exports = SolicitudServicio;
