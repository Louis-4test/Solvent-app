// migrations/20260518120000-add-password-reset-and-admin-fields.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('users');
    const additions = {
      is_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      reset_password_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      reset_password_expires: {
        type: Sequelize.DATE,
        allowNull: true
      }
    };

    for (const [name, definition] of Object.entries(additions)) {
      if (!columns[name]) {
        await queryInterface.addColumn('users', name, definition);
      }
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('users');
    for (const name of ['is_admin', 'reset_password_token', 'reset_password_expires']) {
      if (columns[name]) {
        await queryInterface.removeColumn('users', name);
      }
    }
  }
};