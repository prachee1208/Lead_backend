const Lead = require('../models/Lead');
const User = require('../models/userModel');

// Function to create sample leads
const createSampleLeads = async () => {
  // Get a sample employee to assign leads to
  const sampleEmployee = await User.findOne({ role: 'employee' });
  const sampleEmployeeId = sampleEmployee ? sampleEmployee._id : null;

  console.log('Sample employee for lead assignment:', sampleEmployeeId);

  const sampleLeads = [
    {
      name: 'John Smith',
      company: 'Acme Inc',
      email: 'john.smith@acme.com',
      assignedEmployee: sampleEmployeeId, // Assign to sample employee
      phone: '555-123-4567',
      status: 'New',
      value: '5000',
      source: 'Website',
      notes: 'Interested in our premium package'
    },
    {
      name: 'Sarah Johnson',
      company: 'XYZ Corp',
      email: 'sarah.j@xyzcorp.com',
      phone: '555-987-6543',
      status: 'Contacted',
      value: '10000',
      source: 'Referral',
      notes: 'Follow up next week'
    },
    {
      name: 'Michael Brown',
      company: 'Tech Solutions',
      email: 'michael@techsolutions.com',
      phone: '555-456-7890',
      status: 'Qualified',
      value: '15000',
      source: 'LinkedIn',
      notes: 'Needs a proposal by Friday'
    },
    {
      name: 'Emily Davis',
      company: 'Global Enterprises',
      email: 'emily@globalent.com',
      phone: '555-789-0123',
      status: 'Proposal',
      value: '25000',
      source: 'Trade Show',
      notes: 'Sent proposal, awaiting feedback'
    },
    {
      name: 'David Wilson',
      company: 'Innovative Systems',
      email: 'david@innovative.com',
      phone: '555-234-5678',
      status: 'Negotiation',
      value: '50000',
      source: 'Cold Call',
      notes: 'Negotiating contract terms'
    }
  ];

  try {
    await Lead.insertMany(sampleLeads);
    console.log('Sample leads created successfully');
  } catch (error) {
    console.error('Error creating sample leads:', error);
  }
};

// Get all leads with filtering, sorting, and pagination
exports.getLeads = async (req, res) => {
  try {
    console.log('GET /api/leads - Request received');

    // Create some sample leads if none exist
    const count = await Lead.countDocuments();
    if (count === 0) {
      console.log('No leads found, creating sample leads');
      await createSampleLeads();
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Pagination: page=${page}, limit=${limit}, skip=${skip}`);

    // Build filter object
    const filter = {};

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
      console.log(`Status filter: ${req.query.status}`);
    }

    // Search filter (search in name, company, email, notes)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { notes: searchRegex }
      ];
      console.log(`Search filter: ${req.query.search}`);
    }

    // Assignee filter
    if (req.query.assignedTo) {
      if (req.query.assignedTo === 'unassigned') {
        filter.$or = [
          { assignedManager: null },
          { assignedEmployee: null }
        ];
        console.log('Assignee filter: unassigned');
      } else {
        filter.$or = [
          { assignedManager: req.query.assignedTo },
          { assignedEmployee: req.query.assignedTo }
        ];
        console.log(`Assignee filter: ${req.query.assignedTo}`);
      }
    }

    console.log('Filter:', filter);

    // Build sort object
    let sort = {};
    if (req.query.sort) {
      // Handle sort direction (prefix with - for descending)
      const sortField = req.query.sort.startsWith('-')
        ? req.query.sort.substring(1)
        : req.query.sort;

      const sortDirection = req.query.sort.startsWith('-') ? -1 : 1;
      sort[sortField] = sortDirection;
      console.log(`Sort: ${sortField} ${sortDirection === 1 ? 'asc' : 'desc'}`);
    } else {
      // Default sort by createdAt descending
      sort = { createdAt: -1 };
      console.log('Sort: createdAt desc (default)');
    }

    // Count total leads matching the filter
    const total = await Lead.countDocuments(filter);
    console.log(`Total leads matching filter: ${total}`);

    // Get leads with pagination, sorting, and populate assignedTo
    const leads = await Lead.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedManager', 'name email')
      .populate('assignedEmployee', 'name email');

    console.log(`Retrieved ${leads.length} leads`);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      success: true,
      count: total,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      data: leads
    };

    console.log('Sending response');
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting leads',
      error: error.message
    });
  }
};

// Get a single lead by ID
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedManager', 'name email')
      .populate('assignedEmployee', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error getting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting lead',
      error: error.message
    });
  }
};

// Create a new lead
exports.createLead = async (req, res) => {
  try {
    const {
      name,
      company,
      email,
      phone,
      value,
      source,
      notes,
      assignedManager,
      assignedEmployee
    } = req.body;

    const lead = new Lead({
      name,
      company,
      email,
      phone,
      value,
      source,
      notes,
      assignedManager,
      assignedEmployee
    });

    const savedLead = await lead.save();
    res.status(201).json({
      success: true,
      data: savedLead
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update a lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('assignedManager', 'name email')
     .populate('assignedEmployee', 'name email');

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a lead
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Assign a lead to a user
exports.assignLead = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find lead by ID
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // If userId is null, unassign the lead
    if (!userId) {
      lead.assignedTo = null;
    } else {
      // Check if user exists
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      lead.assignedTo = userId;
    }

    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: lead
    });
  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning lead',
      error: error.message
    });
  }
};

// Create multiple leads
exports.createMultipleLeads = async (req, res) => {
    try {
        const { leads } = req.body;

        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an array of leads'
            });
        }

        // Validate each lead data
        const validatedLeads = leads.map(lead => ({
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone || '',
            value: lead.value || 0,
            source: lead.source || 'Other',
            notes: lead.notes || '',
            status: 'New',
            createdBy: req.user.id // Assuming you have user info in request
        }));

        // Insert all leads
        const createdLeads = await Lead.insertMany(validatedLeads);

        res.status(201).json({
            success: true,
            message: `${createdLeads.length} leads created successfully`,
            data: createdLeads
        });
    } catch (error) {
        console.error('Error creating multiple leads:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Assign lead to manager
exports.assignToManager = async (req, res) => {
    try {
        const { leadId, managerId } = req.body;

        // Verify manager exists
        const manager = await User.findOne({ _id: managerId });
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        const lead = await Lead.findByIdAndUpdate(
            leadId,
            {
                assignedManager: managerId,
                assignedEmployee: null // Reset employee assignment
            },
            { new: true }
        ).populate('assignedManager', 'name email')
         .populate('assignedEmployee', 'name email');

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lead assigned to manager successfully',
            data: lead
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning lead to manager',
            error: error.message
        });
    }
};

// Assign lead to employee (manager only)
exports.assignToEmployee = async (req, res) => {
    try {
        const { leadId, employeeId, managerId } = req.body;

        console.log('Assign to employee request:', req.body);

        // Skip authentication check if managerId is provided directly in the request
        // This is a temporary workaround until proper authentication is implemented

        // Verify employee exists and has correct role
        const employee = await User.findOne({ _id: employeeId, role: 'employee' });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        console.log('Employee found:', employee.name);

        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        console.log('Lead found:', lead.name);

        // If managerId is provided, assign it to the lead
        if (managerId) {
            lead.assignedManager = managerId;
        }

        lead.assignedEmployee = employeeId;
        await lead.save();

        console.log('Lead assigned successfully');

        res.status(200).json({
            success: true,
            message: 'Lead assigned to employee successfully',
            data: lead
        });
    } catch (error) {
        console.error('Error in assignToEmployee:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning lead to employee',
            error: error.message
        });
    }
};

// Update follow-up for a lead
exports.updateFollowUp = async (req, res) => {
    try {
        const { leadId } = req.params;
        const { notes, nextFollowUpDate, status } = req.body;

        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        // Verify user has permission to update follow-up
        const isAssigned =
            (req.user.role === 'admin') ||
            (req.user.role === 'manager' && lead.assignedManager.toString() === req.user._id.toString()) ||
            (req.user.role === 'employee' && lead.assignedEmployee.toString() === req.user._id.toString());

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update follow-ups for this lead'
            });
        }

        const followUpData = {
            notes,
            nextFollowUpDate,
            status: status || 'Scheduled',
            createdBy: req.user._id
        };

        await lead.updateFollowUp(followUpData);

        res.status(200).json({
            success: true,
            message: 'Follow-up updated successfully',
            data: lead
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating follow-up',
            error: error.message
        });
    }
};

// Get leads with their follow-ups
exports.getLeadsWithFollowUps = async (req, res) => {
    try {
        let query = {};

        // Filter leads based on user role
        if (req.user.role === 'manager') {
            query.assignedManager = req.user._id;
        } else if (req.user.role === 'employee') {
            query.assignedEmployee = req.user._id;
        }

        const leads = await Lead.find(query)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('followUp.createdBy', 'name')
            .sort({ 'followUp.nextFollowUpDate': 1 });

        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching leads',
            error: error.message
        });
    }
};

// Get upcoming follow-ups
exports.getUpcomingFollowUps = async (req, res) => {
    try {
        const today = new Date();
        let query = {
            'followUp.nextFollowUpDate': { $gte: today }
        };

        // Filter based on user role
        if (req.user.role === 'manager') {
            query.assignedManager = req.user._id;
        } else if (req.user.role === 'employee') {
            query.assignedEmployee = req.user._id;
        }

        const leads = await Lead.find(query)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email')
            .populate('followUp.createdBy', 'name')
            .sort({ 'followUp.nextFollowUpDate': 1 });

        res.status(200).json({
            success: true,
            data: leads
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching upcoming follow-ups',
            error: error.message
        });
    }
};

// Get leads assigned by a specific manager
exports.getLeadsAssignedByManager = async (req, res) => {
    try {
        const { managerId } = req.params;
        console.log(`GET /api/leads/assigned/${managerId} - Request received`);

        if (!managerId) {
            console.log('Manager ID is missing in request params');
            return res.status(400).json({
                success: false,
                message: 'Manager ID is required'
            });
        }

        console.log('Looking for manager with ID:', managerId);

        // Verify the manager exists
        const manager = await User.findOne({ _id: managerId });

        if (!manager) {
            console.log('Manager not found with ID:', managerId);
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        console.log('Found manager:', manager.name, 'with role:', manager.role);

        // Continue even if role is not 'manager' to help with debugging
        if (manager.role !== 'manager') {
            console.log('Warning: User found but role is not manager:', manager.role);
        }

        // Build query to find leads assigned by this manager that have an assigned employee
        const filter = {
            assignedManager: managerId,
            assignedEmployee: { $exists: true, $ne: null }
        };

        // Apply additional filters from query params
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { name: searchRegex },
                { company: searchRegex },
                { email: searchRegex },
                { notes: searchRegex }
            ];
        }

        // Set up pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Set up sorting
        let sort = {};
        if (req.query.sort) {
            const sortField = req.query.sort.startsWith('-')
                ? req.query.sort.substring(1)
                : req.query.sort;
            const sortDirection = req.query.sort.startsWith('-') ? -1 : 1;
            sort[sortField] = sortDirection;
        } else {
            sort = { updatedAt: -1 }; // Default sort by most recently updated
        }

        console.log('Filter:', JSON.stringify(filter));
        console.log('Sort:', JSON.stringify(sort));

        // Count total leads matching the filter
        const total = await Lead.countDocuments(filter);
        console.log(`Total leads assigned by manager ${managerId} with employees: ${total}`);

        // If no leads are found, create some test leads
        if (total === 0) {
            console.log('No assigned leads found for this manager. Creating test leads...');

            // Find an employee to assign leads to
            const employee = await User.findOne({ role: 'employee' });

            if (employee) {
                console.log('Found employee:', employee.name, 'with ID:', employee._id);

                // Create test leads
                const testLeads = [
                    {
                        name: 'Test Assigned Lead 1',
                        company: 'Test Company 1',
                        email: 'test1@example.com',
                        phone: '555-1234',
                        value: '1000',
                        source: 'Website',
                        status: 'New',
                        assignedManager: managerId,
                        assignedEmployee: employee._id,
                        notes: 'This is a test lead assigned to an employee'
                    },
                    {
                        name: 'Test Assigned Lead 2',
                        company: 'Test Company 2',
                        email: 'test2@example.com',
                        phone: '555-5678',
                        value: '2000',
                        source: 'Referral',
                        status: 'Contacted',
                        assignedManager: managerId,
                        assignedEmployee: employee._id,
                        notes: 'This is another test lead assigned to an employee'
                    }
                ];

                // Insert the test leads
                await Lead.insertMany(testLeads);
                console.log('Created test assigned leads');
            }
        }

        // Get leads with pagination, sorting, and populate references
        const leads = await Lead.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email');

        console.log(`Retrieved ${leads.length} assigned leads for manager ${managerId}`);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const response = {
            success: true,
            count: total,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            data: leads
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(`Error getting assigned leads for manager: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Error getting assigned leads for manager',
            error: error.message
        });
    }
};

// Get leads assigned to a specific employee
exports.getLeadsByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;
        console.log(`GET /api/leads/employee/${employeeId} - Request received`);

        if (!employeeId) {
            console.log('Employee ID is missing in request params');
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        console.log('Looking for employee with ID:', employeeId);

        // Verify the employee exists
        const employee = await User.findOne({ _id: employeeId });

        if (!employee) {
            console.log('Employee not found with ID:', employeeId);
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        console.log('Found employee:', employee.name, 'with role:', employee.role);

        // Continue even if role is not 'employee' to help with debugging
        if (employee.role !== 'employee') {
            console.log('Warning: User found but role is not employee:', employee.role);
        }

        // Check if there are any leads assigned to this employee
        const assignedLeadsCount = await Lead.countDocuments({ assignedEmployee: employeeId });
        console.log(`Found ${assignedLeadsCount} leads assigned to employee ${employeeId}`);

        // If no leads are assigned, create a test lead for this employee
        if (assignedLeadsCount === 0) {
            console.log('No leads found for this employee. Creating a test lead...');

            const testLead = new Lead({
                name: 'Test Lead for ' + employee.name,
                company: 'Test Company',
                email: 'test@example.com',
                phone: '555-TEST',
                value: '1000',
                source: 'Website',
                status: 'New',
                assignedEmployee: employeeId,
                notes: 'This is a test lead created automatically for the employee'
            });

            await testLead.save();
            console.log('Test lead created with ID:', testLead._id);
        }

        // Build query to find leads assigned to this employee
        const filter = { assignedEmployee: employeeId };

        // Apply additional filters from query params
        if (req.query.status) {
            filter.status = req.query.status;
        }

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { name: searchRegex },
                { company: searchRegex },
                { email: searchRegex },
                { notes: searchRegex }
            ];
        }

        // Set up pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Set up sorting
        let sort = {};
        if (req.query.sort) {
            const sortField = req.query.sort.startsWith('-')
                ? req.query.sort.substring(1)
                : req.query.sort;
            const sortDirection = req.query.sort.startsWith('-') ? -1 : 1;
            sort[sortField] = sortDirection;
        } else {
            sort = { updatedAt: -1 }; // Default sort by most recently updated
        }

        console.log('Filter:', JSON.stringify(filter));
        console.log('Sort:', JSON.stringify(sort));

        // Check if there are any leads with assignedEmployee field set
        const allLeads = await Lead.find({});
        const leadsWithAssignedEmployee = allLeads.filter(lead => lead.assignedEmployee);
        console.log(`Total leads in database: ${allLeads.length}`);
        console.log(`Leads with any assignedEmployee: ${leadsWithAssignedEmployee.length}`);

        if (leadsWithAssignedEmployee.length > 0) {
            console.log('Sample lead with assignedEmployee:',
                leadsWithAssignedEmployee[0]._id,
                'assigned to:', leadsWithAssignedEmployee[0].assignedEmployee);
        }

        // Count total leads matching the filter
        const total = await Lead.countDocuments(filter);
        console.log(`Total leads assigned to employee ${employeeId}: ${total}`);

        // Get leads with pagination, sorting, and populate references
        const leads = await Lead.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('assignedManager', 'name email')
            .populate('assignedEmployee', 'name email');

        console.log(`Retrieved ${leads.length} leads for employee ${employeeId}`);

        // Calculate pagination info
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const response = {
            success: true,
            count: total,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            },
            data: leads
        };

        res.status(200).json(response);
    } catch (error) {
        console.error(`Error getting leads for employee: ${error}`);
        res.status(500).json({
            success: false,
            message: 'Error getting leads for employee',
            error: error.message
        });
    }
};
