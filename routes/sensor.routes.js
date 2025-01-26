const router = require('express').Router();
const { publishCommand } = require('../services/mqtt.service');
const { SensorReading } = require('../models');
const { Op } = require('sequelize');

// Example REST endpoint to manually send a command
router.post('/commands', (req, res) => {
  const command = req.body;
  publishCommand(command);
  return res.json({ success: true, message: 'Command published' });
});

// Route to get all sensor readings, sorted by latest data first
router.get('/', async (req, res) => {
  try {
    const sensorReadings = await SensorReading.findAll({
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: sensorReadings,
    });
  } catch (error) {
    console.error('[SensorReadings GET Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching sensor readings.',
    });
  }
});

// Route to get sensor readings with at least a 30-minute gap between consecutive readings
router.get('/filtered', async (req, res) => {
  try {
    // Fetch all readings sorted by createdAt in ascending order
    const sensorReadings = await SensorReading.findAll({
      order: [['createdAt', 'ASC']],
    });

    if (!sensorReadings || sensorReadings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sensor readings found.',
      });
    }

    // Filter readings to include only those with a 30-minute gap
    const filteredReadings = [];
    let lastTimestamp = 0;

    for (const reading of sensorReadings) {
      const currentTimestamp = new Date(reading.createdAt).getTime();

      // Include the reading if it's the first one or if it has at least a 30-minute gap
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp >= 30 * 60 * 1000) {
        filteredReadings.push(reading);
        lastTimestamp = currentTimestamp;
      }
    }

    return res.status(200).json({
      success: true,
      data: filteredReadings,
    });
  } catch (error) {
    console.error('[SensorReadings Filtered GET Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching filtered sensor readings.',
    });
  }
});


module.exports = router;
