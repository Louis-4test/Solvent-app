const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('solvent_fintech', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306, // Default MySQL port for XAMPP
  dialectOptions: {
    socketPath: '/opt/lampp/var/mysql/mysql.sock' // Standard XAMPP path on Linux
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Adds createdAt/updatedAt fields
    freezeTableName: true // Prevents pluralization
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established via XAMPP');
  } catch (error) {
    console.error('Unable to connect to MySQL:', error);
  }
})();

module.exports = sequelize;