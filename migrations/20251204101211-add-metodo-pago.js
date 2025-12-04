'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('pago_servicio', 'metodo_pago', {
            type: Sequelize.ENUM('tarjeta', 'qr', 'efectivo', 'movil'),
            allowNull: false,
            defaultValue: 'tarjeta',
            after: 'estado'
        });

        // Actualizar registros existentes a 'tarjeta'
        await queryInterface.sequelize.query(
            "UPDATE pago_servicio SET metodo_pago = 'tarjeta' WHERE metodo_pago IS NULL"
        );
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('pago_servicio', 'metodo_pago');
    }
};
