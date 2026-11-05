// migrations/20250421113400-add-mfa-fields-to-user.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('users');
    const additions = {
      mfa_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mfa_code_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      kyc_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    for (const name of ['mfa_code', 'mfa_code_expires', 'kyc_verified']) {
      if (columns[name]) {
        await queryInterface.removeColumn('users', name);
      }
    }
  }
};