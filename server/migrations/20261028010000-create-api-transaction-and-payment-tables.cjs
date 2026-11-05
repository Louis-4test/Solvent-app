'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) =>
      typeof table === 'string' ? table : table.tableName
    );

    if (!tableNames.includes('transactions')) {
      await queryInterface.createTable('transactions', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        sender_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        recipient_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false
        },
        narration: {
          type: Sequelize.STRING,
          defaultValue: 'Fund transfer'
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'failed', 'reversed'),
          defaultValue: 'pending'
        },
        type: {
          type: Sequelize.ENUM('transfer', 'deposit', 'withdrawal', 'payment'),
          allowNull: false
        },
        reference: {
          type: Sequelize.STRING,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });

      await queryInterface.addConstraint('transactions', {
        fields: ['sender_id'],
        type: 'foreign key',
        name: 'fk_api_transactions_sender_user',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      await queryInterface.addConstraint('transactions', {
        fields: ['recipient_id'],
        type: 'foreign key',
        name: 'fk_api_transactions_recipient_user',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }

    if (!tableNames.includes('payments')) {
      await queryInterface.createTable('payments', {
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
        transaction_id: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        amount: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        currency: {
          type: Sequelize.STRING(3),
          defaultValue: 'USD'
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
          defaultValue: 'pending'
        },
        payment_method: {
          type: Sequelize.ENUM('card', 'bank_transfer', 'mobile_money', 'crypto'),
          allowNull: false
        },
        payment_details: {
          type: Sequelize.JSON,
          allowNull: true
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

      await queryInterface.addConstraint('payments', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'fk_api_payments_user',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) =>
      typeof table === 'string' ? table : table.tableName
    );

    if (tableNames.includes('payments')) {
      await queryInterface.dropTable('payments');
    }
    if (tableNames.includes('transactions')) {
      await queryInterface.dropTable('transactions');
    }
  }
};
