const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');

// Get employee performance metrics - temporarily removed authentication for testing
router.get('/employee-performance', performanceController.getEmployeePerformance);

// Get lead status distribution - temporarily removed authentication for testing
router.get('/lead-status', performanceController.getLeadStatusDistribution);

// Get conversion trend data - temporarily removed authentication for testing
router.get('/conversion-trend', performanceController.getConversionTrend);

module.exports = router;
