module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          'transfer',
          'deposit',
          'withdrawal',
          'bill_payment'
        ),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'completed',
          'failed'
        ),
        defaultValue: 'pending'
      },
      reference: {
        type: DataTypes.STRING,
        unique: true
      }
    }, {
      indexes: [
        {
          fields: ['userId']
        },
        {
          fields: ['createdAt']
        }
      ]
    });
  
    Transaction.associate = models => {
      Transaction.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Transaction;
  };