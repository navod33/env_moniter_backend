const router = require('express').Router();
const { publishCommand } = require('../services/mqtt.service');
const { SensorReading } = require('../models');

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

module.exports = router;
