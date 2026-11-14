// migrations/20261114120000-add-is-active-to-users.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('users');

    if (!columns.is_active) {
      await queryInterface.addColumn('users', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('users');

    if (columns.is_active) {
      await queryInterface.removeColumn('users', 'is_active');
    }
  }
};
