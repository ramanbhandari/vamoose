import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ATLAS_MONGO_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER}.vzhwu.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.MONGO_ATLAS_CLUSTER}`;

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ATLAS_MONGO_URI);
    console.log('MongoDB Atlas Connected');
  } catch (error) {
    console.error('MongoDB AtlasConnection Error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
