const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const Lead = require('../models/Lead');

// Get all follow-ups
router.get('/', protect, async (req, res) => {
    try {
        const { employeeId } = req.query;
        let query = {};

        // If employeeId is provided, filter by assigned employee
        if (employeeId) {
            query.assignedEmployee = employeeId;
        }

        // Get leads with follow-ups
        const leads = await Lead.find(query)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('followUp.createdBy', 'name')
            .sort({ 'followUp.nextFollowUpDate': 1 });

        // Extract follow-ups from leads
        const followUps = leads
            .filter(lead => lead.followUp && lead.followUp.nextFollowUpDate)
            .map(lead => ({
                _id: lead._id,
                leadName: lead.name,
                leadCompany: lead.company,
                followUp: lead.followUp,
                assignedEmployee: lead.assignedEmployee,
                assignedManager: lead.assignedManager
            }));

        res.status(200).json({
            success: true,
            data: followUps
        });
    } catch (error) {
        console.error('Error fetching follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching follow-ups',
            error: error.message
        });
    }
});

// Get follow-ups by employee ID
router.get('/employee/:employeeId', protect, async (req, res) => {
    try {
        const { employeeId } = req.params;
        console.log('Fetching follow-ups for employee:', employeeId);

        // Get leads with follow-ups for this employee
        const leads = await Lead.find({ assignedEmployee: employeeId })
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('followUp.createdBy', 'name')
            .sort({ 'followUp.nextFollowUpDate': 1 });

        // Extract follow-ups from leads
        const followUps = leads
            .filter(lead => lead.followUp && lead.followUp.nextFollowUpDate)
            .map(lead => ({
                _id: lead._id,
                leadName: lead.name,
                leadCompany: lead.company,
                followUp: lead.followUp,
                assignedEmployee: lead.assignedEmployee,
                assignedManager: lead.assignedManager,
                status: lead.status,
                priority: lead.priority,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt
            }));

        console.log(`Found ${followUps.length} follow-ups for employee ${employeeId}`);

        res.status(200).json({
            success: true,
            count: followUps.length,
            data: followUps
        });
    } catch (error) {
        console.error('Error fetching employee follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee follow-ups',
            error: error.message
        });
    }
});

// Get follow-ups for a specific lead
router.get('/lead/:leadId', protect, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.leadId)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('followUp.createdBy', 'name');

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead.followUp
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching follow-up',
            error: error.message
        });
    }
});

// Update follow-up for a lead
router.put('/:leadId', protect, leadController.updateFollowUp);

module.exports = router; 