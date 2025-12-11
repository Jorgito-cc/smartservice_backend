const { Model, DataTypes } = require("sequelize");

class OfertaTecnico extends Model {
    static initModel(sequelize) {
        OfertaTecnico.init({
            id_oferta: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_solicitud: { type: DataTypes.INTEGER },
            id_tecnico: { type: DataTypes.INTEGER },
            precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
            mensaje: { type: DataTypes.TEXT },
            fecha_oferta: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            estado: {
                type: DataTypes.ENUM("enviada", "seleccionada", "rechazada"),
                allowNull: false
            }
        }, {
            sequelize,
            modelName: "OfertaTecnico",
            tableName: "oferta_tecnico",
            timestamps: false
        });

        return OfertaTecnico;
    }
}

module.exports = OfertaTecnico;
