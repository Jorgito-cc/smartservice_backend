const { Model, DataTypes } = require("sequelize");

class Categoria extends Model {
    static initModel(sequelize) {
        Categoria.init({
            id_categoria: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: { type: DataTypes.STRING(100), allowNull: false },
            descripcion: { type: DataTypes.TEXT }
        }, {
            sequelize,
            modelName: "Categoria",
            tableName: "categoria",
            timestamps: false
        });

        return Categoria;
    }
}

module.exports = Categoria;
