const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('solvent_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false // Disable SQL logging in production
});

module.exports = sequelize;