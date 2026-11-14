'use strict';

const tableNames = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => (typeof table === 'string' ? table : table.tableName));
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingTables = await tableNames(queryInterface);

    if (existingTables.includes('users')) {
      return;
    }

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      mfa_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('users', ['phone'], {
      name: 'users_phone_index'
    });
  },

  down: async (queryInterface) => {
    const existingTables = await tableNames(queryInterface);

    if (existingTables.includes('users')) {
      await queryInterface.dropTable('users');
    }
  }
};
