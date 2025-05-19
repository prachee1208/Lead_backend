const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Test route without authentication
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task API is working!'
  });
});

// All routes below are protected - require authentication
router.use(protect);

// Get all tasks for the current user
router.get('/', taskController.getTasks);

// Get a single task by ID
router.get('/:id', taskController.getTask);

// Create a new task
router.post('/', taskController.createTask);

// Update a task
router.put('/:id', taskController.updateTask);

// Toggle task completion status
router.patch('/:id/toggle', taskController.toggleComplete);

// Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
