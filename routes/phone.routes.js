const express = require('express');
const router = express.Router();
const { PhoneNumber } = require('../models');

router.post('/create', async (req, res) => {
  const { phoneNumber } = req.body;

//   if (!phoneNumber || typeof phoneNumber !== 'string') {
//     return res.status(400).json({ message: 'Invalid input. PhoneNumber must be a valid string.' });
//   }

  try {
    console.log('Received phoneNumber:', phoneNumber);

    // Check if a record already exists
    let phoneModel = await PhoneNumber.findOne();

    if (phoneModel) {
      // Update the existing record
      phoneModel.phone = phoneNumber;
      await phoneModel.save();

      return res.status(200).json({
        message: 'PhoneNumber updated successfully.',
        data: phoneModel,
      });
    }

    // If no record exists, create a new one
    const newPhoneNumber = await PhoneNumber.create({ phone: phoneNumber });

    return res.status(201).json({
      message: 'PhoneNumber created successfully.',
      data: newPhoneNumber,
    });
  } catch (error) {
    console.error('[PhoneNumber Create/Update Error]:', error);
    return res.status(500).json({ message: 'Error creating or updating PhoneNumber data.' });
  }
});

module.exports = router;
