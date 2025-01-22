const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
const bodyParser = require('body-parser');

const sensorRoutes = require('./routes/sensor.routes.js');
const thresholdRoutes = require('./routes/threshold.routes.js'); 
const phoneRoutes = require('./routes/phone.routes.js'); 
const { setupWebSocket } = require('./websocket/websocket.js');
const schema = require('./graphql/schema.js');
const resolvers = require('./graphql/resolvers.js');

const app = express();

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// REST routes
app.use('/api/sensor', sensorRoutes);
app.use('/api/threshold', thresholdRoutes); 
app.use('/api/phone', phoneRoutes); 

// GraphQL
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: resolvers,
  graphiql: true,
}));

module.exports = { app, setupWebSocket };
