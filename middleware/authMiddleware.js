const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Define the same JWT secret key as in userController.js
const JWT_SECRET = 'your-secret-key-for-lead-management-app';

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  console.log('Headers received:', req.headers);

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received in middleware:', token);
      console.log('Using JWT_SECRET:', JWT_SECRET);

      // Verify token using the consistent JWT_SECRET
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully:', decoded);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        console.log('User not found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('User found:', req.user._id, req.user.name, req.user.role);
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    console.log('No authorization header found');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Admin only middleware
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
};

// Manager or admin middleware
exports.managerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized, requires manager or admin role'
    });
  }
};
