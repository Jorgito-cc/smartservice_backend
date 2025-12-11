const { Model, DataTypes } = require("sequelize");

class AuditoriaLog extends Model {
    static initModel(sequelize) {
        AuditoriaLog.init({
            id_log: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            usuario_id: { type: DataTypes.INTEGER },
            accion: { type: DataTypes.STRING(200) },
            fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            detalles: { type: DataTypes.TEXT }
        }, {
            sequelize,
            modelName: "AuditoriaLog",
            tableName: "auditoria_log",
            timestamps: false
        });

        return AuditoriaLog;
    }
}

module.exports = AuditoriaLog;
