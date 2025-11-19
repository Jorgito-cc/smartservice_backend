const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const PagoServiciodadade = sequelize.define("PagoServicio", {
        id_pago: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        id_servicio: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false
        },

        stripe_payment_id: {
            type: DataTypes.STRING(200)
        },

        monto_total: {
            type: DataTypes.DECIMAL(10,2)
        },

        comision_empresa: {
            type: DataTypes.DECIMAL(10,2)
        },

        monto_tecnico: {
            type: DataTypes.DECIMAL(10,2)
        },

        estado: {
            type: DataTypes.STRING(20),
            validate: {
                isIn: [["pendiente", "pagado", "fallido"]]
            }
        },

        fecha_pago: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }

    }, {
        tableName: "pago_servicio",
        timestamps: false
    });

    return PagoServicio;
};
