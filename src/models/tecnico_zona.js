const { Model, DataTypes } = require("sequelize");

class TecnicoZona extends Model {
    static initModel(sequelize) {
        TecnicoZona.init({
            id_tecnico_zona: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_tecnico: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            id_zona: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }, {
            sequelize,
            modelName: "TecnicoZona",
            tableName: "tecnico_zona",
            timestamps: false
        });

        return TecnicoZona;
    }
}

module.exports = TecnicoZona;
