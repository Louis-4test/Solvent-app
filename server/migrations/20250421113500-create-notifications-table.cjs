'use strict';

const tableNames = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => (typeof table === 'string' ? table : table.tableName));
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingTables = await tableNames(queryInterface);

    if (existingTables.includes('notifications')) {
      return;
    }

    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'notifications_user_id_index'
    });

    await queryInterface.addConstraint('notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_notifications_user',
      references: { table: 'users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface) => {
    const existingTables = await tableNames(queryInterface);

    if (existingTables.includes('notifications')) {
      await queryInterface.dropTable('notifications');
    }
  }
};
