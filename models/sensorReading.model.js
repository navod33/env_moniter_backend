// models/sensorReading.model.js
module.exports = (sequelize, DataTypes) => {
    const SensorReading = sequelize.define('SensorReading', {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      temperature: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      humidity: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NORMAL'
      }
    }, {
      tableName: 'sensor_readings'
    });
  
    return SensorReading;
  };
  