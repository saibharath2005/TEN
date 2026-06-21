import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import contentRoutes from './routes/content.routes.js';
import contactRoutes from './routes/contact.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the_epoch_nova';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/api', (_req, res) => {
  res.json({ status: 'ok', service: 'the-epoch-nova-api', version: '1.0.0' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'the-epoch-nova-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', contactRoutes);
app.use('/api', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function start() {
  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  await mongoose.connect(mongoUri);
  const server = app.listen(port, () => {
    console.log(`API running on http://127.0.0.1:${port}`);
  });

  server.on('error', (error) => {
    console.error('HTTP server error:', error);
  });
}

start().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
