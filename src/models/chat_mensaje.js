const { Model, DataTypes } = require("sequelize");

class ChatMensaje extends Model {
    static initModel(sequelize) {
        ChatMensaje.init({
            id_mensaje: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_solicitud: { type: DataTypes.INTEGER, allowNull: true },
            id_servicio: { type: DataTypes.INTEGER, allowNull: true },
            emisor_id: { type: DataTypes.INTEGER },
            mensaje: { type: DataTypes.TEXT, allowNull: false },
            precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            es_oferta: { type: DataTypes.BOOLEAN, defaultValue: false },
            fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            leido: { type: DataTypes.BOOLEAN, defaultValue: false }
        }, {
            sequelize,
            modelName: "ChatMensaje",
            tableName: "chat_mensaje",
            timestamps: false
        });

        return ChatMensaje;
    }
}

module.exports = ChatMensaje;
