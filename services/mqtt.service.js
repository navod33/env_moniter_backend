// services/mqtt.service.js
const mqtt = require('mqtt');
const { SensorReading, Threshold } = require('../models');
const { sendSmsIfExceed } = require('./sms.service');

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
      let status = 'NORMAL';
      const tempExceed = payload.temperature > thresholdTemp;
      const humExceed = payload.humidity > thresholdHumidity;

      if (tempExceed && humExceed) {
        status = 'BOTH_EXCEED';
      } else if (tempExceed) {
        status = 'TEM_EXCEED';
      } else if (humExceed) {
        status = 'HUM_EXCEED';
      }

      console.log(`[MQTT] Processed Data: Temp: ${payload.temperature}, Humidity: ${payload.humidity}, Status: ${status}`);

      // Check the time interval (1 minute)
      const currentTimestamp = Date.now();
      if (currentTimestamp - lastSavedTimestamp >= 1 * 60 * 1000) {
        try {
          // Save the data to the database
          const reading = await SensorReading.create({
            temperature: payload.temperature,
            humidity: payload.humidity,
            status,
          });

          latestData = payload;
          lastSavedTimestamp = currentTimestamp;

          // If thresholds are exceeded, send an SMS
          if (status !== 'NORMAL') {
            await sendSmsIfExceed(latestData);
            console.log('[MQTT] SMS sent for exceeding threshold.');
          }
        } catch (dbError) {
          console.error('[MQTT] Error saving data to SensorReading:', dbError.message, dbError.stack);
        }
      } else {
        console.log('[MQTT] Data received but not saved (within 1-minute interval).');
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

// Publish threshold data to the MQTT broker
// Publish threshold data to the MQTT broker
 async function publishThresholds() {
  try {
    const thresholdRecord = await Threshold.findOne();
    if (!thresholdRecord) {
      console.warn('[MQTT] No threshold record found in the database.');
      return;
    }

    const thresholdData = {
      tempThreshold: thresholdRecord.temperature || 0,
      humThreshold: thresholdRecord.humidity || 0,
    };

    // Convert the object to a JSON string before publishing
    client.publish(TOPIC_COMMANDS, JSON.stringify(thresholdData), (err) => {
      if (err) console.error('[MQTT] Publish error:', err);
      else console.log('[MQTT] Thresholds published:', thresholdData);
    });
  } catch (error) {
    console.error('[MQTT] Error fetching and publishing thresholds:', error.message, error.stack);
  }
}

// Call the publishThresholds function on application start
client.on('connect', () => {
  publishThresholds();
});


module.exports = {
  client,
  publishCommand,
  publishThresholds,
  getLatestData: () => latestData,
};
