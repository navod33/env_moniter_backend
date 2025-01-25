// mqtt_backend_update.js

/**************************************************************
 * 1. Required Modules
 **************************************************************/
const mqtt = require('mqtt');
const express = require('express');
const bodyParser = require('body-parser');

/**************************************************************
 * 2. MQTT Broker Configuration (HiveMQ Cloud)
 **************************************************************/
const mqttOptions = {
  host: 'c76bd7703a15440e9ddaf8bdcc451fa6.s1.eu.hivemq.cloud', // HiveMQ host
  port: 8883,        // TLS port
  protocol: 'mqtts',
  username: 'hivemq.webclient.1737018172270', // Replace with your MQTT username
  password: 'S2kCHb0dlaFjZY47,*.!',           // Replace with your MQTT password

  // If you have specific CA certificates, you'd include them here:
  // ca: fs.readFileSync(path.join(__dirname, 'ca.crt')), 
  // For HiveMQ Cloud with default trust, you usually can rely on the system's root CAs.
  rejectUnauthorized: true 
};

/**************************************************************
 * 3. MQTT Topics
 **************************************************************/
const topicData     = 'dht11/data';        // Incoming sensor data
const topicCommands = 'backend/commands';  // Send threshold updates (or other commands)

/**************************************************************
 * 4. Initialize MQTT Client
 **************************************************************/
console.log('Initializing MQTT client...');
const mqttClient = mqtt.connect(mqttOptions);

// Data store for latest sensor data
let latestData = {
  date: null,
  time: null,
  temperature: null,
  humidity: null,
  temperatureStatus: null,
  humidityStatus: null
};

/**************************************************************
 * 5. MQTT Client Event Handlers
 **************************************************************/
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Subscribe to data topic
  mqttClient.subscribe(topicData, (err) => {
    if (!err) {
      console.log(`Subscribed to ${topicData}`);
    } else {
      console.error(`Subscription error:`, err);
    }
  });
});

mqttClient.on('error', (error) => {
  console.error('MQTT Connection Error:', error);
});

/**
 * Handle incoming MQTT messages
 * Expect JSON in this format (example):
 * {
 *   "date": "2025-01-16",
 *   "time": "14:05:30",
 *   "temperature": 25.0,
 *   "humidity": 50.0,
 *   "temperatureStatus": "Normal",
 *   "humidityStatus": "Exceed"
 * }
 */
mqttClient.on('message', (topic, message) => {
  console.log(`\nReceived message on topic ${topic}: ${message.toString()}`);

  if (topic === topicData) {
    try {
      const parsedData = JSON.parse(message.toString());
      handleIncomingData(parsedData);
    } catch (err) {
      console.error('Failed to parse incoming data:', err);
    }
  }
});

/**************************************************************
 * 6. Function to Handle Incoming Data
 **************************************************************/
function handleIncomingData(data) {
  console.log('Processing incoming data:', data);

  // Update the local store if these fields exist
  if (data.date !== undefined) {
    latestData.date = data.date;
  }
  if (data.time !== undefined) {
    latestData.time = data.time;
  }
  if (data.temperature !== undefined) {
    latestData.temperature = data.temperature;
  }
  if (data.humidity !== undefined) {
    latestData.humidity = data.humidity;
  }
  if (data.temperatureStatus !== undefined) {
    latestData.temperatureStatus = data.temperatureStatus;
  }
  if (data.humidityStatus !== undefined) {
    latestData.humidityStatus = data.humidityStatus;
  }

  console.log('Updated latest data:', latestData);
}

/**************************************************************
 * 7. Express Server for APIs
 **************************************************************/
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

/**************************************************************
 * 7.1 API: Get Latest Data
 **************************************************************/
app.get('/api/latest-data', (req, res) => {
  console.log('Received request for latest data');
  res.status(200).send({ success: true, data: latestData });
});

/**************************************************************
 * 7.2 API: Update Threshold Values (Send to ESP32)
 * 
 * The dashboard can POST JSON like:
 * {
 *   "tempThreshold": 35.0,
 *   "humThreshold": 70.0
 * }
 * This will be published to the `backend/commands` topic.
 **************************************************************/
app.post('/api/update-thresholds', (req, res) => {
  const { tempThreshold, humThreshold } = req.body;

  // Basic validation
  if (typeof tempThreshold !== 'number' || typeof humThreshold !== 'number') {
    return res.status(400).send({
      success: false,
      message: 'Invalid threshold values. Must be numeric.'
    });
  }

  console.log(`Received threshold updates: temp=${tempThreshold}, hum=${humThreshold}`);

  // Build JSON payload for ESP32
  const thresholdMessage = JSON.stringify({
    tempThreshold,
    humThreshold
  });

  // Publish to commands topic
  mqttClient.publish(topicCommands, thresholdMessage, (err) => {
    if (err) {
      console.error('Failed to publish threshold updates:', err);
      return res.status(500).send({ success: false, message: 'Failed to send threshold updates' });
    }
    console.log('Threshold updates published successfully');
    res.status(200).send({ success: true, message: 'Threshold updates sent' });
  });
});

/**************************************************************
 * 7.3 (Optional) API: Send Arbitrary Command
 **************************************************************/
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  console.log(`Received command: ${command}`);

  if (typeof command !== 'string' || command.trim() === '') {
    return res.status(400).send({ success: false, message: 'Invalid command' });
  }

  // Publish a plain text command
  mqttClient.publish(topicCommands, command.trim(), (err) => {
    if (err) {
      console.error('Failed to publish command:', err);
      return res.status(500).send({ success: false, message: 'Failed to send command' });
    }
    console.log('Command published successfully');
    res.status(200).send({ success: true, message: 'Command sent' });
  });
});

/**************************************************************
 * 8. Start Express Server
 **************************************************************/
app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
