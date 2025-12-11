const { Model, DataTypes } = require("sequelize");

class Incidencia extends Model {
    static initModel(sequelize) {
        Incidencia.init({
            id_incidencia: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_servicio: { type: DataTypes.INTEGER },
            id_usuario_reporta: { type: DataTypes.INTEGER },
            descripcion: { type: DataTypes.TEXT },
            fecha_reporte: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            estado: {
                type: DataTypes.ENUM("pendiente", "en_revision", "resuelta")
            }
        }, {
            sequelize,
            modelName: "Incidencia",
            tableName: "incidencia",
            timestamps: false
        });

        return Incidencia;
    }
}

module.exports = Incidencia;
