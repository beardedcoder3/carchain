// backend/server.js - Fixed version with better MongoDB error handling
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import routes
const reportRoutes = require('./reports/reports');

// Check if auth routes exist, if not, use reports without protection temporarily
let authRoutes = null;
let protectReportRoutes = null;

try {
  const authModule = require('./auth/auth');
  authRoutes = authModule.router;
  protectReportRoutes = authModule.protectReportRoutes;
  console.log('✅ Auth module loaded successfully');
} catch (error) {
  console.log('⚠️ Auth module not found, running without authentication');
  console.log('📝 Create ./auth/auth.js to enable authentication');
}

// Connect to MongoDB with better error handling
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/car2chain_inspections';
console.log('🔍 Attempting to connect to MongoDB...');
console.log('🔍 MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  connectTimeoutMS: 10000,
  family: 4, // Use IPv4, skip trying IPv6
})
.then(() => {
  console.log('✅ Successfully connected to Car2Chain DB');
  console.log('✅ Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ DB connection failed:', err.message);
  console.log('⚠️ Continuing without database - app will use sample data');
  console.log('💡 To fix: Check your MongoDB Atlas Network Access settings');
  // Don't exit the process, just continue without DB
});

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// API routes
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', protectReportRoutes, reportRoutes); // Protected routes
} else {
  app.use('/api/reports', reportRoutes); // Unprotected routes for now
}

// Test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Car2Chain API is running!',
    timestamp: new Date().toISOString(),
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    authEnabled: authRoutes !== null,
    mongoConnected: mongoose.connection.readyState === 1,
    mongoStatus: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[mongoose.connection.readyState]
  });
});

// Debug route to test API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../carchain/build')));

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../carchain/build', 'index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  
  if (authRoutes) {
    console.log('🔐 Authentication enabled');
    console.log('🔐 Default admin credentials:');
    console.log('   Username: carchainadmin');
    console.log('   Password: carchain123');
    console.log('📡 Authentication endpoints:');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/auth/verify');
    console.log('   POST /api/auth/logout');
    console.log('   POST /api/auth/change-password');
  } else {
    console.log('⚠️ Running without authentication');
    console.log('📝 To enable auth: Create backend/auth/auth.js');
  }
  
  console.log('\n🔧 If you see MongoDB connection errors above:');
  console.log('   1. Check MongoDB Atlas Network Access');
  console.log('   2. Add 0.0.0.0/0 to IP whitelist');
  console.log('   3. Verify your .env file has correct MONGODB_URI');
  console.log('   4. App will continue working with sample data\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (err) {
    console.log('⚠️ Error closing MongoDB connection:', err.message);
  }
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Don't exit the process, just log it
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  // Don't exit the process, just log it
});