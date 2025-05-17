const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/leadmanagement', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Function to create test assigned leads
async function createTestAssignedLeads() {
    try {
        // Find a manager
        const manager = await User.findOne({ role: 'manager' });
        if (!manager) {
            console.error('No manager found in the database');
            return;
        }
        console.log('Found manager:', manager.name, 'with ID:', manager._id);

        // Find an employee
        const employee = await User.findOne({ role: 'employee' });
        if (!employee) {
            console.error('No employee found in the database');
            return;
        }
        console.log('Found employee:', employee.name, 'with ID:', employee._id);

        // Create test leads assigned to the employee by the manager
        const testLeads = [
            {
                name: 'Test Assigned Lead 1',
                company: 'Test Company 1',
                email: 'test1@example.com',
                phone: '555-1234',
                value: '1000',
                source: 'Website',
                status: 'New',
                assignedManager: manager._id,
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
                assignedManager: manager._id,
                assignedEmployee: employee._id,
                notes: 'This is another test lead assigned to an employee'
            },
            {
                name: 'Test Assigned Lead 3',
                company: 'Test Company 3',
                email: 'test3@example.com',
                phone: '555-9012',
                value: '3000',
                source: 'Social Media',
                status: 'Qualified',
                assignedManager: manager._id,
                assignedEmployee: employee._id,
                notes: 'This is a third test lead assigned to an employee'
            }
        ];

        // Insert the test leads
        const result = await Lead.insertMany(testLeads);
        console.log(`Created ${result.length} test assigned leads`);
        
        // Print the IDs of the created leads
        result.forEach(lead => {
            console.log(`Lead ID: ${lead._id}, Name: ${lead.name}, Assigned to: ${employee.name}`);
        });

        // Check if the leads were created successfully
        const count = await Lead.countDocuments({ 
            assignedManager: manager._id,
            assignedEmployee: employee._id
        });
        console.log(`Total leads assigned by manager ${manager.name} to employee ${employee.name}: ${count}`);

    } catch (error) {
        console.error('Error creating test assigned leads:', error);
    } finally {
        // Close the MongoDB connection
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the function
createTestAssignedLeads();
