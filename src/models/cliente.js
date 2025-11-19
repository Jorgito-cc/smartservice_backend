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

/* 
const { Model, DataTypes } = require("sequelize");
const Usuario = require("./usuario"); // Importamos el padre

class Cliente extends Usuario {
    static initModel(sequelize) {
        super.initModel(sequelize);

        Cliente.init({
            preferencia: { 
                 type: DataTypes.STRING(200),
                allowNull: true
            },
        }, {
            sequelize,
            modelName: "Cliente",
            tableName: "usuario",  // 👈 MISMA TABLA
            timestamps: false
        });

        return Cliente;
    }
}

module.exports = Cliente; */
