import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import infrastructureRoutes from './routes/infrastructure';
import analysisRoutes from './routes/analysis';
import simulationRoutes from './routes/simulation';
import simulateRoutes from './routes/simulate';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';
import authRoutes from './routes/auth';
import emergencyRoutes from './routes/emergency';
import weatherRoutes from './routes/weather';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', infrastructureRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/scenarios', simulationRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
