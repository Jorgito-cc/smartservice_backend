const { Model, DataTypes } = require("sequelize");

class Cliente extends Model {
    static initModel(sequelize) {
        Cliente.init({
            id_cliente: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },
            preferencia: { type: DataTypes.TEXT }
        }, {
            sequelize,
            modelName: "Cliente",
            tableName: "cliente",
            timestamps: false
        });

        return Cliente;
    }
}

module.exports = Cliente;
