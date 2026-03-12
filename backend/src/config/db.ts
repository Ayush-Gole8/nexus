import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host);
};

export default connectDB;
