
const { Model, DataTypes } = require("sequelize");

class Admin extends Model {
    static initModel(sequelize) {
        Admin.init({
            id_admin: {
                type: DataTypes.INTEGER,
                primaryKey: true
            }
        }, {
            sequelize,
            modelName: "Admin",
            tableName: "admin",
            timestamps: false
        });

        return Admin;
    }
}

module.exports = Admin;


/* const { Model } = require("sequelize");
const Usuario = require("./usuario");

class Admin extends Usuario {
    static initModel(sequelize) {
        
        // Inicializamos la tabla usuario (del padre)
        super.initModel(sequelize);

        // Admin no añade campos extra, solo usa los de Usuario
        Admin.init({}, {
            sequelize,
            modelName: "Admin",
            tableName: "usuario",    // MISMA TABLA
            timestamps: false
        });

        return Admin;
    }
}

module.exports = Admin;
 */