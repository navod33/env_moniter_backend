const { publishThresholds } = require('../services/mqtt.service.js');
const express = require('express');
const router = express.Router();
const db = require('../models');
const {  Threshold } = require('../models')


// Route to fetch the latest threshold
router.get('/', async (req, res) => {
  try {
    const threshold = await Threshold.findOne();

    if (!threshold) {
      return res.status(404).json({ message: 'No threshold data found.' });
    }

    res.status(200).json({
      message: 'Threshold data retrieved successfully',
      data: threshold,
    });
  } catch (error) {
    console.error('[Threshold GET Error]:', error);
    res.status(500).json({ message: 'Error retrieving threshold data.' });
  }
});

// Route to update the threshold
router.post('/create', async (req, res) => {
    const { temperature, humidity } = req.body;
  
    try {
      // Check if a record already exists
      let threshold = await Threshold.findOne();
  
      if (threshold) {
        // Update the existing record
        threshold.temperature = temperature;
        threshold.humidity = humidity;
        await threshold.save();
  
        return res.status(200).json({
          message: 'Threshold updated successfully.',
          data: threshold,
        });
      }
  
      // If no record exists, create a new one
      threshold = await Threshold.create({ temperature, humidity });
      publishThresholds()

      res.status(201).json({
        message: 'Threshold created successfully.',
        data: threshold,
      });
    } catch (error) {
      console.error('[Threshold Create/Update Error]:', error);
      res.status(500).json({ message: 'Error creating or updating threshold data.' });
    }
  });
  

module.exports = router;
