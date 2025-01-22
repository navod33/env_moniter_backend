// graphql/schema.js
const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type SensorReading {
    id: ID!
    temperature: Float
    humidity: Float
    status: String
    createdAt: String
  }

  type Query {
    getLatestReadings(limit: Int = 10): [SensorReading]
  }

  type Mutation {
    updateThresholds(temperature: Float!, humidity: Float!): String
    updatePhoneNumber(phone: String!): String
  }
`);
