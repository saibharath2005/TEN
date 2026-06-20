import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Content from './models/Content.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the_epoch_nova';

await mongoose.connect(mongoUri);

await Promise.all([
  User.deleteMany({ email: { $in: ['admin@theepochnova.com'] } }),
  Content.deleteMany({}),
]);

await User.create({
  name: 'Admin',
  email: 'admin@theepochnova.com',
  password: 'admin123',
  role: 'admin',
  savedItems: [],
});

await mongoose.disconnect();

console.log('Seed complete.');
console.log('Admin login: admin@theepochnova.com / admin123');
