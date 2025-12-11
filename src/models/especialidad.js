const { Model, DataTypes } = require("sequelize");

class Especialidad extends Model {
    static initModel(sequelize) {
        Especialidad.init({
            id_especialidad: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: { type: DataTypes.STRING(100), allowNull: false },
            referencias: { type: DataTypes.TEXT },
            anio_experiencia: { type: DataTypes.INTEGER }
        }, {
            sequelize,
            modelName: "Especialidad",
            tableName: "especialidad",
            timestamps: false
        });

        return Especialidad;
    }
}

module.exports = Especialidad;
