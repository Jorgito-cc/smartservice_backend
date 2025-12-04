'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('usuario', 'ci', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('usuario', 'foto_ci', {
      type: Sequelize.STRING(200),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuario', 'ci');
    await queryInterface.removeColumn('usuario', 'foto_ci');
  }
};
