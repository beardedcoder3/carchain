// backend/auth/auth.js - Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// In-memory user storage (you can replace this with a database later)
// For now, we'll use the credentials you specified
const adminUser = {
  id: 1,
  username: 'carchainadmin',
  // This will be the hashed version of 'carchain123'
  password: null, // We'll set this when the server starts
  role: 'admin',
  createdAt: new Date()
};

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'carchain_super_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

// Initialize admin password hash
const initializeAdminUser = async () => {
  try {
    const saltRounds = 10;
    adminUser.password = await bcrypt.hash('carchain123', saltRounds);
    console.log('✅ Admin user initialized');
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
};

// Call this when the server starts
initializeAdminUser();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth/login - Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt for username:', username);
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password are required' 
      });
    }

    // Check if username matches
    if (username !== adminUser.username) {
      console.log('❌ Invalid username:', username);
      return res.status(401).json({ 
        message: 'Invalid username or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for username:', username);
      return res.status(401).json({ 
        message: 'Invalid username or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        username: adminUser.username,
        role: adminUser.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('✅ Successful login for:', username);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// GET /api/auth/verify - Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  try {
    console.log('🔍 Token verification for user:', req.user.username);
    
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  try {
    console.log('👋 Logout for user:', req.user.username);
    
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success and let the frontend handle token removal
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// POST /api/auth/change-password - Change password endpoint
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔑 Password change request for user:', req.user.username);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters long' 
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password);
    
    if (!isCurrentPasswordValid) {
      console.log('❌ Invalid current password for user:', req.user.username);
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password (in a real app, this would update the database)
    adminUser.password = hashedNewPassword;
    
    console.log('✅ Password changed successfully for user:', req.user.username);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// GET /api/auth/profile - Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        createdAt: adminUser.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Middleware to protect report routes
const protectReportRoutes = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { router, protectReportRoutes, authenticateToken };