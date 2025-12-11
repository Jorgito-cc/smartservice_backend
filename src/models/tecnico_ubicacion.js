const { Model, DataTypes } = require("sequelize");

class TecnicoUbicacion extends Model {
    static initModel(sequelize) {
        TecnicoUbicacion.init({
            id_ubicacion: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            id_tecnico: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            lat: {
                type: DataTypes.DECIMAL(10, 6),
                allowNull: false
            },
            lon: {
                type: DataTypes.DECIMAL(10, 6),
                allowNull: false
            },
            direccion_texto: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            fecha_actualizacion: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        }, {
            sequelize,
            modelName: "TecnicoUbicacion",
            tableName: "tecnico_ubicacion",
            timestamps: false
        });

        return TecnicoUbicacion;
    }
}

module.exports = TecnicoUbicacion;
