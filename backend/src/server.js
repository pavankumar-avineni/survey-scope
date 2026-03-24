require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const surveyRoutes = require('./routes/survey.routes');
const publicRoutes = require('./routes/public.routes'); // NEW
const responseRoutes = require('./routes/response.routes'); // NEW
const analyticsRoutes = require('./routes/analytics.routes'); // NEW
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:wid/surveys', surveyRoutes);
app.use('/api', publicRoutes); // NEW - public routes at /api/s/:slug
app.use('/api/workspaces/:wid/surveys/:sid/responses', responseRoutes); // NEW
app.use('/api/workspaces/:wid/surveys/:sid/analytics', analyticsRoutes); // NEW

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});