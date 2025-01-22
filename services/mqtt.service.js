// services/mqtt.service.js
const mqtt = require('mqtt');
const { SensorReading } = require('../models');
const { sendSmsIfExceed } = require('./sms.service');
const { Threshold } = require('../models');

// HiveMQ Cloud configuration
const MQTT_BROKER_URL = 'mqtts://c76bd7703a15440e9ddaf8bdcc451fa6.s1.eu.hivemq.cloud';
const MQTT_USERNAME = 'hivemq.webclient.1737018172270';
const MQTT_PASSWORD = 'S2kCHb0dlaFjZY47,*.!';

const TOPIC_DATA = 'dht11/data';
const TOPIC_COMMANDS = 'backend/commands';

const options = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
};

let latestData = null;
let lastSavedTimestamp = 0; 

// Connect client
const client = mqtt.connect(MQTT_BROKER_URL, options);

client.on('connect', () => {
  console.log('[MQTT] Connected to broker');
  client.subscribe(TOPIC_DATA, (err) => {
    if (err) {
      console.error('[MQTT] Subscribe error:', err);
    } else {
      console.log(`[MQTT] Subscribed to ${TOPIC_DATA}`);
    }
  });
});

// MQTT Message Handler
client.on('message', async (topic, message) => {
  if (topic === TOPIC_DATA) {
    console.log(`[MQTT] Message received. Topic: ${topic}, Message: ${message.toString()}`);

    try {
      // Parse the payload
      const payload = JSON.parse(message.toString());

      // Fetch threshold values from the database
      const thresholdRecord = await Threshold.findOne();
      if (!thresholdRecord) {
        console.warn('[MQTT] No threshold record found in the database.');
        return;
      }

      const thresholdTemp = thresholdRecord.temperature || 0;
      const thresholdHumidity = thresholdRecord.humidity || 0;

      // Determine the status based on thresholds
      const status = (payload.temperature > thresholdTemp || payload.humidity > thresholdHumidity)
        ? 'EXCEED'
        : 'NORMAL';

      console.log(`[MQTT] Processed Data: Temp: ${payload.temperature}, Humidity: ${payload.humidity}, Status: ${status}`);

      // Check the time interval
      const currentTimestamp = Date.now();
      if (currentTimestamp - lastSavedTimestamp >= 30 * 60 * 1000) {
        try {
          // Save the data to the database
          const reading = await SensorReading.create({
            temperature: payload.temperature,
            humidity: payload.humidity,
            status,
          });

          latestData = reading.get({ plain: true });
          lastSavedTimestamp = currentTimestamp;

          console.log('[MQTT] Data saved to SensorReading:', latestData);

          // If thresholds are exceeded, send an SMS
          if (status === 'EXCEED') {
            await sendSmsIfExceed(latestData);
            console.log('[MQTT] SMS sent for exceeding threshold.');
          }
        } catch (dbError) {
          console.error('[MQTT] Error saving data to SensorReading:', dbError.message, dbError.stack);
        }
      } else {
        console.log('[MQTT] Data received but not saved (within 2-minute interval).');
      }
    } catch (parseError) {
      console.error('[MQTT] Error parsing message:', parseError.message, parseError.stack);
    }
  }
});

// Publish commands to the MQTT broker
function publishCommand(commandObj) {
  client.publish(TOPIC_COMMANDS, JSON.stringify(commandObj), (err) => {
    if (err) console.error('[MQTT] Publish error:', err);
    else console.log('[MQTT] Command published:', commandObj);
  });
}

module.exports = {
  client,
  publishCommand,
  getLatestData: () => latestData,
};
