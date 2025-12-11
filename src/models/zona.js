const { Model, DataTypes } = require("sequelize");

class Zona extends Model {
    static initModel(sequelize) {
        Zona.init({
            id_zona: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: { type: DataTypes.STRING(100), allowNull: false },
            ciudad: { type: DataTypes.STRING(100) },
            coordenadas: { type: DataTypes.TEXT }
        }, {
            sequelize,
            modelName: "Zona",
            tableName: "zona",
            timestamps: false
        });

        return Zona;
    }
}

module.exports = Zona;
