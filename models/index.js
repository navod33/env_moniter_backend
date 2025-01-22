// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/db.config.js');

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
});

// Test connection
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL via Sequelize.'))
  .catch(err => console.error('Unable to connect:', err));

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.SensorReading = require('./sensorReading.model.js')(sequelize, DataTypes);
db.Threshold = require('./thresholds.model.js')(sequelize, DataTypes);
db.PhoneNumber = require('./phoneNumber.model.js')(sequelize, DataTypes);


// Synchronize models (in production, use migrations)
db.sequelize.sync({ alter: true }) // or { force: false }
  .then(() => {
    console.log('Database & tables synced!');
  })
  .catch(err => console.error('Sync error:', err));


module.exports = db;
 