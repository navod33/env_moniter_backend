const twilio = require('twilio');
const { Threshold } = require('../models');
const { PhoneNumber } = require('../models');

// If using environment variables:
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACxxxxx';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'xxxxxxxxxx';
const fromNumber = process.env.TWILIO_PHONE_FROM || '+10000000000';


// Create Twilio client
const twilioClient = twilio(accountSid, authToken);

// Variables to hold thresholds and phone number
let thresholdTemp = null;
let thresholdHumidity = null;
let toNumber = null;

/**
 * Initialize thresholds and phone number from the database
 */
async function initializeConfig() {
  try {
    // Fetch the threshold record
    const thresholdRecord = await Threshold.findOne();
    if (thresholdRecord) {
      thresholdTemp = thresholdRecord.temperature;
      thresholdHumidity = thresholdRecord.humidity;
      console.log('[SMS] Thresholds initialized:', { thresholdTemp, thresholdHumidity });
    } else {
      console.warn('[SMS] No threshold record found. Please ensure thresholds are set.');
    }

    // Fetch the phone number record
    const phoneModel = await PhoneNumber.findOne();
    if (phoneModel) {
      toNumber = phoneModel.phone;
      console.log('[SMS] Alert phone number initialized:', toNumber);
    } else {
      console.warn('[SMS] No phone number record found. Please ensure a phone number is set.');
    }
  } catch (error) {
    console.error('[SMS] Error initializing configuration:', error.message);
  }
}

/**
 * Send SMS alert if data exceeds thresholds
 * @param {Object} data - Sensor data { temperature, humidity, ... }
 */
async function sendSmsIfExceed(data) {
  if (!thresholdTemp || !thresholdHumidity || !toNumber) {
    console.warn('[SMS] Configuration is incomplete. Cannot send alert.');
    return;
  }

  if (data.temperature >= thresholdTemp || data.humidity >= thresholdHumidity) {
    console.log('[SMS] Sending alert message...');
    try {
      await twilioClient.messages.create({
        body: `ALERT! Temperature: ${data.temperature}°C, Humidity: ${data.humidity}% - Exceeds threshold!`,
        from: fromNumber,
        to: toNumber,
      });
      console.log('[SMS] Alert sent successfully!');
    } catch (error) {
      console.error('[SMS] Failed to send SMS:', error.message);
    }
  } else {
    console.log('[SMS] Data is within thresholds. No alert sent.');
  }
}

/**
 * Update thresholds dynamically
 * @param {number} temp - New temperature threshold
 * @param {number} hum - New humidity threshold
 */
function setThresholds(temp, hum) {
  thresholdTemp = temp;
  thresholdHumidity = hum;
  console.log('[SMS] Updated thresholds:', { temp, hum });
}

/**
 * Update alert phone number dynamically
 * @param {string} phone - New phone number for alerts
 */
function setAlertPhoneNumber(phone) {
  toNumber = phone;
  console.log('[SMS] Updated phone number to:', phone);
}

module.exports = {
  initializeConfig,
  sendSmsIfExceed,
  setThresholds,
  setAlertPhoneNumber,
};
