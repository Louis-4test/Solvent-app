'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('users');

    if (!columns.avatar_url) {
      await queryInterface.addColumn('users', 'avatar_url', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('users');

    if (columns.avatar_url) {
      await queryInterface.removeColumn('users', 'avatar_url');
    }
  }
};
