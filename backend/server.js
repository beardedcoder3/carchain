// backend/server.js - Updated with Authentication
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
const fs = require('fs');
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

// Use routes
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', protectReportRoutes, reportRoutes); // Protected routes
} else {
  app.use('/api/reports', reportRoutes); // Unprotected routes for now
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/car2chain_inspections')
  .then(() => console.log('✅ Connected to Car2Chain DB'))
  .catch(err => console.error('❌ DB connection error:', err));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Car2Chain API is running!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    authEnabled: authRoutes !== null
  });
});

const path = require('path');

// Serve static files from React build (ADD THIS)
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API routes (your existing routes stay here)
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Catch all handler: send back React's index.html file (ADD THIS)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
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
});