const { Model, DataTypes } = require("sequelize");

class ServicioAsignado extends Model {
    static initModel(sequelize) {
        ServicioAsignado.init({
            id_servicio: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_solicitud: { type: DataTypes.INTEGER },
            id_oferta: { type: DataTypes.INTEGER },
            id_tecnico: { type: DataTypes.INTEGER },
            fecha_asignacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            estado: {
                type: DataTypes.ENUM("en_camino", "en_ejecucion", "completado"),
                allowNull: false
            }
        }, {
            sequelize,
            modelName: "ServicioAsignado",
            tableName: "servicio_asignado",
            timestamps: false
        });

        return ServicioAsignado;
    }
}

module.exports = ServicioAsignado;
