

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

module.exports = Cliente;
