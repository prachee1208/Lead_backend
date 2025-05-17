const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { protect } = require('../middleware/authMiddleware');

// Test route without authentication
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reminder test route works!'
  });
});

// All routes below are protected - require authentication
router.use(protect);

// Get all reminders for the current user
router.get('/', reminderController.getReminders);

// Get a single reminder by ID
router.get('/:id', reminderController.getReminder);

// Create a new reminder
router.post('/', reminderController.createReminder);

// Update a reminder
router.put('/:id', reminderController.updateReminder);

// Toggle reminder completion status
router.patch('/:id/toggle', reminderController.toggleComplete);

// Delete a reminder
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
