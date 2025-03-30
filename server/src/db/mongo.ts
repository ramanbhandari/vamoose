/**
 * @file mongo.ts
 * @description MongoDB connection configuration and initialization.
 * Supports different connection URIs for test, load test, and production environments.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ATLAS_MONGO_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER}.vzhwu.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.MONGO_ATLAS_CLUSTER}`;

// Use a different URI for testing
const MONGO_TEST_URI = process.env.MONGO_TEST_URI || '';

// Use the test URI if the NODE_ENV is test or LOADTEST is true
const URI =
  process.env.NODE_ENV === 'test' || process.env.LOADTEST === 'true'
    ? MONGO_TEST_URI
    : ATLAS_MONGO_URI;

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(URI);
    console.log('MongoDB Atlas Connected', URI);
  } catch (error) {
    console.error('MongoDB AtlasConnection Error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
