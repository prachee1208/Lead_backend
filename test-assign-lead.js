const axios = require('axios');
const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leadmanagement')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const API_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

async function createAndAssignLead() {
  try {
    console.log('Starting test script to create and assign a lead');
    
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
    
    // Create a test lead
    const leadData = {
      name: 'Test Lead ' + Date.now(),
      company: 'Test Company',
      email: `test${Date.now()}@example.com`,
      phone: '555-1234',
      source: 'Website',
      status: 'New',
      notes: 'This is a test lead created by the test script'
    };
    
    console.log('Creating lead with data:', leadData);
    
    // Create the lead
    const lead = new Lead({
      ...leadData,
      assignedManager: manager._id,
      assignedEmployee: employee._id
    });
    
    await lead.save();
    console.log('Lead created with ID:', lead._id);
    
    // Check if the lead was assigned correctly
    const assignedLead = await Lead.findById(lead._id)
      .populate('assignedManager', 'name email')
      .populate('assignedEmployee', 'name email');
    
    console.log('Assigned lead:', assignedLead);
    
    // Check if the lead appears in the manager's assigned leads
    const managerLeads = await Lead.find({ 
      assignedManager: manager._id,
      assignedEmployee: { $exists: true, $ne: null }
    });
    
    console.log(`Found ${managerLeads.length} leads assigned by manager ${manager._id}`);
    
    // Check if the lead appears in the employee's leads
    const employeeLeads = await Lead.find({ assignedEmployee: employee._id });
    console.log(`Found ${employeeLeads.length} leads assigned to employee ${employee._id}`);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error in test script:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

createAndAssignLead();
