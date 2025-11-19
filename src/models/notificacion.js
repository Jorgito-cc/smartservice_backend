const { Model, DataTypes } = require("sequelize");

class Notificacion extends Model {
    static initModel(sequelize) {
        Notificacion.init({
            id_notificacion: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_usuario: { type: DataTypes.INTEGER },
            titulo: { type: DataTypes.STRING(200) },
            cuerpo: { type: DataTypes.TEXT },
            fecha_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            leido: { type: DataTypes.BOOLEAN, defaultValue: false }
        }, {
            sequelize,
            modelName: "Notificacion",
            tableName: "notificacion",
            timestamps: false
        });

        return Notificacion;
    }
}

module.exports = Notificacion;
