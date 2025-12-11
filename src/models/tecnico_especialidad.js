const { Model, DataTypes } = require("sequelize");

class TecnicoEspecialidad extends Model {
    static initModel(sequelize) {
        TecnicoEspecialidad.init({
            id_tecnico_especialidad: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_tecnico: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            id_especialidad: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }, {
            sequelize,
            modelName: "TecnicoEspecialidad",
            tableName: "tecnico_especialidad",
            timestamps: false
        });

        return TecnicoEspecialidad;
    }
}

module.exports = TecnicoEspecialidad;
