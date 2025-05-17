const Lead = require('../models/Lead');
const User = require('../models/userModel');

// Get performance metrics for all employees
exports.getEmployeePerformance = async (req, res) => {
    try {
        // Get date range from query params (default to last 30 days)
        const dateRange = req.query.dateRange || 'last-30-days';

        // Calculate date based on range
        const today = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case 'last-7-days':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'last-90-days':
                startDate.setDate(today.getDate() - 90);
                break;
            case 'year-to-date':
                startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
                break;
            case 'last-30-days':
            default:
                startDate.setDate(today.getDate() - 30);
                break;
        }

        // Get all employees
        const employees = await User.find({ role: 'employee' }).select('-password');

        // Get all leads (temporarily removing date filter for testing)
        console.log('Date range:', { startDate, today });
        const leads = await Lead.find({}).populate('assignedEmployee', 'name email');
        console.log(`Found ${leads.length} leads in total`);

        // Log some sample leads to check their structure
        if (leads.length > 0) {
            console.log('Sample lead:', {
                id: leads[0]._id,
                name: leads[0].name,
                createdAt: leads[0].createdAt,
                status: leads[0].status,
                assignedEmployee: leads[0].assignedEmployee
            });
        }

        // Calculate performance metrics for each employee
        const performanceData = employees.map(employee => {
            // Filter leads assigned to this employee
            const employeeLeads = leads.filter(lead =>
                lead.assignedEmployee &&
                (typeof lead.assignedEmployee === 'object'
                    ? lead.assignedEmployee._id.toString() === employee._id.toString()
                    : lead.assignedEmployee.toString() === employee._id.toString())
            );

            // Count leads by status
            const leadsAssigned = employeeLeads.length;
            const leadsContacted = employeeLeads.filter(lead =>
                lead.status === 'Contacted' || lead.status === 'Qualified' ||
                lead.status === 'Converted' || lead.status === 'Closed'
            ).length;
            const leadsConverted = employeeLeads.filter(lead =>
                lead.status === 'Converted' || lead.status === 'Closed'
            ).length;

            // Calculate conversion rate
            const conversionRate = leadsAssigned > 0
                ? Math.round((leadsConverted / leadsAssigned) * 100)
                : 0;

            return {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                leadsAssigned,
                leadsContacted,
                leadsConverted,
                conversionRate
            };
        });

        // Calculate summary metrics
        const totalLeads = leads.length;
        const assignedLeads = leads.filter(lead => lead.assignedEmployee).length;
        const convertedLeads = leads.filter(lead =>
            lead.status === 'Converted' || lead.status === 'Closed'
        ).length;
        const conversionRate = assignedLeads > 0
            ? Math.round((convertedLeads / assignedLeads) * 100)
            : 0;

        // Return performance data
        res.status(200).json({
            success: true,
            dateRange,
            summaryMetrics: {
                totalLeads,
                assignedLeads,
                convertedLeads,
                conversionRate,
                avgResponseTime: 24 // Mock data in hours
            },
            data: performanceData
        });
    } catch (error) {
        console.error('Error getting employee performance:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting employee performance',
            error: error.message
        });
    }
};

// Get lead status distribution
exports.getLeadStatusDistribution = async (req, res) => {
    try {
        // Get date range from query params (default to last 30 days)
        const dateRange = req.query.dateRange || 'last-30-days';

        // Calculate date based on range
        const today = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case 'last-7-days':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'last-90-days':
                startDate.setDate(today.getDate() - 90);
                break;
            case 'year-to-date':
                startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
                break;
            case 'last-30-days':
            default:
                startDate.setDate(today.getDate() - 30);
                break;
        }

        // Get all leads (temporarily removing date filter for testing)
        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads for status distribution`);

        // Log and calculate lead status distribution
        const statusCounts = {};
        leads.forEach(lead => {
            const status = lead.status || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusDistribution = Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
        }));

        // Return status distribution
        res.status(200).json({
            success: true,
            dateRange,
            data: statusDistribution
        });
    } catch (error) {
        console.error('Error getting lead status distribution:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting lead status distribution',
            error: error.message
        });
    }
};

// Get conversion trend data
exports.getConversionTrend = async (req, res) => {
    try {
        // Get date range from query params (default to last 7 days)
        const days = parseInt(req.query.days) || 7;

        // Calculate date range
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - days);

        // Get all leads (temporarily removing date filter for testing)
        const leads = await Lead.find({});
        console.log(`Found ${leads.length} leads for conversion trend`);

        // Log date range
        console.log('Conversion trend date range:', {
            startDate: startDate.toISOString(),
            today: today.toISOString(),
            days
        });

        // Generate trend data by day
        const trendData = [];
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            // Get leads created on this day
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const dayLeads = leads.filter(lead =>
                lead.createdAt >= dayStart && lead.createdAt <= dayEnd
            );

            const conversions = dayLeads.filter(lead =>
                lead.status === 'Converted' || lead.status === 'Closed'
            ).length;

            trendData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                leads: dayLeads.length,
                conversions
            });
        }

        // Return trend data
        res.status(200).json({
            success: true,
            days,
            data: trendData
        });
    } catch (error) {
        console.error('Error getting conversion trend:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting conversion trend',
            error: error.message
        });
    }
};
