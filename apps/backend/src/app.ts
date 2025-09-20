import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import categoryRoutes from './routes/category.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';
import currencyRoutes from './routes/currency.routes.js';
import gmailRoutes from './routes/gmail.routes.js';

const app = express();

// Security middleware
app.use(helmet());
// Configure CORS to accept multiple origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL!];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/gmail', gmailRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;