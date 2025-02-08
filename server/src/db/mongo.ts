import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || '';

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export default connectMongoDB;
