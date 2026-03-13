// Youth Training Hub - Backend Server
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Route imports
import authRoutes from './routes/auth.js';
import teamsRoutes from './routes/teams.js';
import sessionsRoutes from './routes/sessions.js';
import activitiesRoutes from './routes/activities.js';
import youthsRoutes from './routes/youths.js';
import timelineRoutes from './routes/timeline.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for code attempts (prevent brute force)
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many code attempts, please try again later'
});

// Apply rate limiting to specific routes
app.use('/api/teams/link', codeLimiter);
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/youths', youthsRoutes);
app.use('/api/timeline', timelineRoutes); // Most critical endpoint

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong!'
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Youth Training Hub server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});