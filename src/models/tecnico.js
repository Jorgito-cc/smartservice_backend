
const { Model, DataTypes } = require("sequelize");

class Tecnico extends Model {
    static initModel(sequelize) {
        Tecnico.init({
            id_tecnico: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },
            descripcion: { type: DataTypes.TEXT },
            calificacion_promedio: { type: DataTypes.DECIMAL(10, 2) },
            disponibilidad: { type: DataTypes.BOOLEAN, defaultValue: true }
        }, {
            sequelize,
            modelName: "Tecnico",
            tableName: "tecnico",
            timestamps: false
        });

        return Tecnico;
    }
}

module.exports = Tecnico;
