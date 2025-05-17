const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Define a consistent JWT secret key
const JWT_SECRET = 'your-secret-key-for-lead-management-app';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Signup failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user already exists
    console.log('Checking if user already exists with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Signup failed: Email already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user with role
    console.log('Creating new user with role:', role || 'employee');
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'employee' // Default to employee if no role provided
    });

    // Save user to database
    console.log('Saving user to database...', newUser);
    try {
      const savedUser = await newUser.save();
      console.log('User saved successfully with ID:', savedUser._id);

      // Double-check that the user was saved by querying the database
      const checkUser = await User.findById(savedUser._id);
      if (checkUser) {
        console.log('Verified user was saved to database:', checkUser._id);
      } else {
        console.error('ERROR: User was not found in database after save!');
        throw new Error('User was not found in database after save');
      }

      // Generate token
      const token = generateToken(savedUser._id);
      console.log('Token generated for new user');

      // Return success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          role: savedUser.role
        }
      });
    } catch (saveError) {
      console.error('Error saving user to database:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Signup error:', error);

    // Check for MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      console.log('Duplicate key error - user already exists');
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.log('Validation error:', messages);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Generic server error
    console.error('Server error during signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user. Please try again.',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for:', email);
    console.log('Request body:', req.body);

    // Find user by email - try both with and without case sensitivity
    let user = await User.findOne({ email: email });

    // If user not found, try case-insensitive search
    if (!user) {
      console.log('Trying case-insensitive search...');
      user = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
    }

    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('User details:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }

    // Check if user exists
    if (!user) {
      console.log('Authentication failed: User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if password matches using bcrypt
    console.log('Comparing password...');
    // For backward compatibility, check both direct comparison and bcrypt
    let isMatch = false;

    // First try direct comparison for old passwords
    if (user.password === password) {
      console.log('Password matched using direct comparison');
      isMatch = true;
    } else if (user.comparePassword) {
      // Then try bcrypt comparison for new passwords
      try {
        isMatch = await user.comparePassword(password);
        console.log('Password comparison result using bcrypt:', isMatch ? 'Match' : 'No match');
      } catch (error) {
        console.error('Error comparing passwords with bcrypt:', error);
      }
    }

    if (!isMatch) {
      console.log('Authentication failed: Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Authentication successful, token generated');

    // Login successful
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

exports.home = (req, res) => {
  res.send('Welcome to the User API');
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users',
      error: error.message
    });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const users = await User.find({ role }).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Error getting users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting users by role',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user',
      error: error.message
    });
  }
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'employee',
      phone
    });

    // Save user to database
    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        phone: savedUser.phone
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, status, currentPassword, password } = req.body;
    const userId = req.params.id;

    // Find user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Handle password update
    if (currentPassword && password) {
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = password;
    }

    // Handle profile image upload
    if (req.file) {
      // If using multer for file uploads, the file would be available in req.file
      // For simplicity, we'll just store the file path
      // In a production app, you would upload to a cloud storage service
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;

    // Update timestamp
    user.updatedAt = Date.now();

    // Save updated user
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        status: updatedUser.status,
        profileImage: updatedUser.profileImage
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Update a user's role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Validate role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};
