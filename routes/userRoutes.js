const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Basic routes
router.get('/', userController.home);
router.get('/all', userController.getAllUsers);
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// CRUD operations for users
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/role', userController.updateUserRole);

// Get users by role
router.get('/role/:role', userController.getUsersByRole);

module.exports = router;
