// migrations/20250421113400-add-mfa-fields-to-user.cjs
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'mfaCode', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'mfaCodeExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'kycVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'mfaCode');
    await queryInterface.removeColumn('users', 'mfaCodeExpires');
    await queryInterface.removeColumn('users', 'kycVerified');
  }
};