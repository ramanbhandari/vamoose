import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ATLAS_MONGO_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER}.vzhwu.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.MONGO_ATLAS_CLUSTER}`;

//const MONGO_URI = `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@localhost:27017/${process.env.MONGO_DB_NAME}?authSource=admin&directConnection=true`;

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ATLAS_MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
