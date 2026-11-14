'use strict';

const KYC_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];
const DOCUMENT_TYPES = ['national_id', 'passport', 'drivers_license', 'voters_card'];

const tableNames = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => (typeof table === 'string' ? table : table.tableName));
};

const safeAddIndex = async (queryInterface, table, fields, options = {}) => {
  try {
    await queryInterface.addIndex(table, fields, options);
  } catch (error) {
    // MySQL reports duplicate key name when the index already exists.
    if (!/duplicate|already exists/i.test(error.message)) {
      throw error;
    }
  }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingTables = await tableNames(queryInterface);

    if (!existingTables.includes('merchants')) {
      await queryInterface.createTable('merchants', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        code: {
          type: Sequelize.STRING(40),
          allowNull: false,
          unique: true
        },
        name: {
          type: Sequelize.STRING(120),
          allowNull: false
        },
        category: {
          type: Sequelize.STRING(60),
          allowNull: false,
          defaultValue: 'General'
        },
        city: {
          type: Sequelize.STRING(80),
          allowNull: true
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
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

      await safeAddIndex(queryInterface, 'merchants', ['code'], {
        name: 'merchants_code_unique',
        unique: true
      });
      await safeAddIndex(queryInterface, 'merchants', ['is_active'], {
        name: 'merchants_is_active_index'
      });
    }

    const userColumns = await queryInterface.describeTable('users');
    if (!userColumns.kyc_verified_at) {
      await queryInterface.addColumn('users', 'kyc_verified_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!existingTables.includes('kyc_verifications')) {
      await queryInterface.createTable('kyc_verifications', {
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
        document_type: {
          type: Sequelize.ENUM(...DOCUMENT_TYPES),
          allowNull: false
        },
        document_number: {
          type: Sequelize.STRING(80),
          allowNull: false
        },
        document_front_url: {
          type: Sequelize.STRING(500),
          allowNull: false
        },
        document_back_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        selfie_url: {
          type: Sequelize.STRING(500),
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM(...KYC_STATUSES),
          allowNull: false,
          defaultValue: 'pending'
        },
        reviewed_by: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        rejection_reason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        verified_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        submitted_at: {
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

      await safeAddIndex(queryInterface, 'kyc_verifications', ['user_id', 'document_number'], {
        name: 'kyc_user_document_index'
      });
      await safeAddIndex(queryInterface, 'kyc_verifications', ['user_id'], {
        name: 'kyc_user_id_index'
      });
      await safeAddIndex(queryInterface, 'kyc_verifications', ['status'], {
        name: 'kyc_status_index'
      });

      await queryInterface.addConstraint('kyc_verifications', {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'fk_kyc_user',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
      await queryInterface.addConstraint('kyc_verifications', {
        fields: ['reviewed_by'],
        type: 'foreign key',
        name: 'fk_kyc_reviewer',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      return;
    }

    // The table may have been created by an older KYC draft that used camelCase
    // columns. Normalize it in place so the model and API share one schema.
    let columns = await queryInterface.describeTable('kyc_verifications');
    const renames = [
      ['userId', 'user_id'],
      ['documentType', 'document_type'],
      ['documentPath', 'document_front_url'],
      ['createdAt', 'submitted_at'],
      ['updatedAt', 'updated_at']
    ];

    for (const [from, to] of renames) {
      columns = await queryInterface.describeTable('kyc_verifications');
      if (columns[from] && !columns[to]) {
        await queryInterface.renameColumn('kyc_verifications', from, to);
      }
    }

    columns = await queryInterface.describeTable('kyc_verifications');

    const additions = {
      document_number: { type: Sequelize.STRING(80), allowNull: true },
      document_front_url: { type: Sequelize.STRING(500), allowNull: true },
      document_back_url: { type: Sequelize.STRING(500), allowNull: true },
      selfie_url: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'pending' },
      reviewed_by: { type: Sequelize.INTEGER, allowNull: true },
      rejection_reason: { type: Sequelize.TEXT, allowNull: true },
      verified_at: { type: Sequelize.DATE, allowNull: true },
      submitted_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true }
    };

    for (const [name, definition] of Object.entries(additions)) {
      if (!columns[name]) {
        await queryInterface.addColumn('kyc_verifications', name, definition);
      }
    }

    // Convert legacy status values before enforcing the current ENUM.
    await queryInterface.sequelize.query(
      "UPDATE kyc_verifications SET status = 'pending' WHERE status IS NULL OR status = ''"
    );
    await queryInterface.sequelize.query(
      "UPDATE kyc_verifications SET status = 'approved' WHERE status IN ('verified', 'approved')"
    );
    await queryInterface.sequelize.query(
      "UPDATE kyc_verifications SET status = 'rejected' WHERE status IN ('failed', 'declined', 'rejected')"
    );
    await queryInterface.sequelize.query(
      "UPDATE kyc_verifications SET status = 'under_review' WHERE status = 'review'"
    );
    await queryInterface.sequelize.query(
      "UPDATE kyc_verifications SET status = 'pending' WHERE status NOT IN ('pending', 'under_review', 'approved', 'rejected')"
    );

    await queryInterface.changeColumn('kyc_verifications', 'status', {
      type: Sequelize.ENUM(...KYC_STATUSES),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.changeColumn('kyc_verifications', 'selfie_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await safeAddIndex(queryInterface, 'kyc_verifications', ['user_id', 'document_number'], {
      name: 'kyc_user_document_index'
    });
    await safeAddIndex(queryInterface, 'kyc_verifications', ['user_id'], {
      name: 'kyc_user_id_index'
    });
    await safeAddIndex(queryInterface, 'kyc_verifications', ['status'], {
      name: 'kyc_status_index'
    });
  },

  down: async (queryInterface, _Sequelize) => {
    const existingTables = await tableNames(queryInterface);

    if (existingTables.includes('kyc_verifications')) {
      await queryInterface.dropTable('kyc_verifications');
    }

    if (existingTables.includes('merchants')) {
      await queryInterface.dropTable('merchants');
    }

    const userColumns = await queryInterface.describeTable('users');
    if (userColumns.kyc_verified_at) {
      await queryInterface.removeColumn('users', 'kyc_verified_at');
    }
  }
};
