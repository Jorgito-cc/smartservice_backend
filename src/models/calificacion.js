const { Model, DataTypes } = require("sequelize");

class Calificacion extends Model {
    static initModel(sequelize) {
        Calificacion.init({
            id_calificacion: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_servicio: { type: DataTypes.INTEGER },
            id_cliente: { type: DataTypes.INTEGER },
            id_tecnico: { type: DataTypes.INTEGER },
            puntuacion: { type: DataTypes.INTEGER },
            comentario: { type: DataTypes.TEXT },
            fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "Calificacion",
            tableName: "calificacion",
            timestamps: false
        });

        return Calificacion;
    }
}

module.exports = Calificacion;
