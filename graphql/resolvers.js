// graphql/resolvers.js
const { SensorReading } = require('../models');
const { setThresholds, setAlertPhoneNumber } = require('../services/sms.service');

module.exports = {
  getLatestReadings: async ({ limit }) => {
    return await SensorReading.findAll({
      limit,
      order: [['createdAt', 'DESC']]
    });
  },

  updateThresholds: async ({ temperature, humidity }) => {
    setThresholds(temperature, humidity);
    return 'Thresholds updated successfully.';
  },

  updatePhoneNumber: async ({ phone }) => {
    setAlertPhoneNumber(phone);
    return `Phone number updated to ${phone}`;
  }
};
