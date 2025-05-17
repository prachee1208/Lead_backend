const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// Public routes
router.post('/', leadController.createLead);
router.post('/bulk', leadController.createMultipleLeads);

// Lead assignment routes
router.post('/assign/manager', leadController.assignToManager);
router.post('/assign/employee', leadController.assignToEmployee);

// Employee-specific routes
router.get('/employee/:employeeId', leadController.getLeadsByEmployeeId);

// Manager-specific routes
router.get('/assigned/:managerId', leadController.getLeadsAssignedByManager);

// General lead routes
router.get('/', leadController.getLeads);
router.get('/:id', leadController.getLead);
router.put('/:id', leadController.updateLead);
router.delete('/:id', leadController.deleteLead);

// Follow-up routes
router.put('/:leadId/follow-up', leadController.updateFollowUp);
router.get('/follow-ups', leadController.getLeadsWithFollowUps);
router.get('/upcoming-follow-ups', leadController.getUpcomingFollowUps);

module.exports = router;
