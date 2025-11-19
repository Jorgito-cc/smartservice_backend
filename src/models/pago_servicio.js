const { Model, DataTypes } = require("sequelize");

class PagoServicio extends Model {
    static initModel(sequelize) {
        PagoServicio.init({
            id_pago: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            id_servicio: { type: DataTypes.INTEGER },
            stripe_payment_id: { type: DataTypes.STRING(200) },
            monto_total: { type: DataTypes.DECIMAL(10, 2) },
            comision_empresa: { type: DataTypes.DECIMAL(10, 2) },
            monto_tecnico: { type: DataTypes.DECIMAL(10, 2) },
            estado: {
                type: DataTypes.ENUM("pendiente", "pagado", "fallido")
            },
            fecha_pago: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
        }, {
            sequelize,
            modelName: "PagoServicio",
            tableName: "pago_servicio",
            timestamps: false
        });

        return PagoServicio;
    }
}

module.exports = PagoServicio;
