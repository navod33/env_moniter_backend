// services/mqtt.service.js
const mqtt = require('mqtt');
const { SensorReading } = require('../models'); 
const { sendSmsIfExceed } = require('./sms.service');
const {  Threshold } = require('../models')


// Example HiveMQ Cloud config
// Example HiveMQ Cloud config
const MQTT_BROKER_URL = 'mqtts://c76bd7703a15440e9ddaf8bdcc451fa6.s1.eu.hivemq.cloud';
const MQTT_USERNAME     = 'hivemq.webclient.1737018172270';
const MQTT_PASSWORD     = 'S2kCHb0dlaFjZY47,*.!';

const TOPIC_DATA     = 'dht11/data';
const TOPIC_COMMANDS = 'backend/commands';

// Connect options
const options = {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  // rejectUnauthorized: false, // if using self-signed cert
};



let latestData = null;

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

// client.on('message', async (topic, message) => {
//   if (topic === TOPIC_DATA) {
//     try {
//       const payload = JSON.parse(message.toString());
//       // payload => { temperature: 28, humidity: 60, status?: "NORMAL" or "EXCEED" }

//       // Insert into DB
//       const reading = await SensorReading.create({
//         temperature: payload.temperature,
//         humidity: payload.humidity,
//         status: payload.status || 'NORMAL'
//       });

//       latestData = reading.get({ plain: true });

//       // Check thresholds => Possibly send SMS
//       await sendSmsIfExceed(latestData);
//     } catch (err) {
//       console.error('[MQTT] Error processing message:', err.message);
//     }
//   }
// });


client.on('message', async (topic, message) => {
  if (topic === TOPIC_DATA) {
    try {
      const payload = JSON.parse(message.toString());

      // Fetch threshold values from the database
      const thresholdRecord = await Threshold.findOne();
      const thresholdTemp = thresholdRecord.temperature || 0;
      const thresholdHumidity = thresholdRecord.humidity || 0;

      console.log("thresholdRecord", thresholdRecord)

      // Determine status based on thresholds
      const status = (payload.temperature > thresholdTemp || payload.humidity > thresholdHumidity)
        ? 'EXCEED'
        : 'NORMAL';

      // Insert into DB with determined status
      const reading = await SensorReading.create({
        temperature: payload.temperature,
        humidity: payload.humidity,
        status
      });

      latestData = reading.get({ plain: true });

      // Check thresholds and possibly send SMS
      if (status === 'EXCEED') {
        await sendSmsIfExceed(latestData);
      }
    } catch (err) {
      console.error('[MQTT] Error processing message:', err.message);
    }
  }
});



// Publish to commands topic
function publishCommand(commandObj) {
  client.publish(TOPIC_COMMANDS, JSON.stringify(commandObj), (err) => {
    if (err) console.error('[MQTT] Publish error:', err);
    else console.log('[MQTT] Command published:', commandObj);
  });
}

module.exports = {
  client,
  publishCommand,
  getLatestData: () => latestData
};
