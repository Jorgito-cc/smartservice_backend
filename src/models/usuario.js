const { Model, DataTypes } = require("sequelize");

class Usuario extends Model {
    static initModel(sequelize) {
        Usuario.init({
            id_usuario: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: { type: DataTypes.STRING(100), allowNull: false },
            ci: { type: DataTypes.STRING(20) },
            apellido: { type: DataTypes.STRING(100), allowNull: false },
            email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
            password: { type: DataTypes.STRING(200), allowNull: false },
            telefono: { type: DataTypes.STRING(20) },
            foto: { type: DataTypes.STRING(200), allowNull: true },
            foto_ci: { type: DataTypes.STRING(200), allowNull: true },
            estado: { type: DataTypes.BOOLEAN, defaultValue: true },
            token_real: { type: DataTypes.STRING(200), allowNull: true },
            rol: {
                type: DataTypes.ENUM("cliente", "tecnico", "admin"),
                allowNull: false
            }
        }, {
            sequelize,
            modelName: "Usuario",
            tableName: "usuario",
            timestamps: false
        });

        return Usuario;
    }
}

module.exports = Usuario;




