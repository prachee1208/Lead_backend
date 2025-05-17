const Reminder = require('../models/Reminder');

// Get all reminders for the current user
exports.getReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({ userId: req.user._id })
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: reminders.length,
            data: reminders
        });
    } catch (error) {
        console.error('Error getting reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting reminders',
            error: error.message
        });
    }
};

// Get a single reminder by ID
exports.getReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Check if the reminder belongs to the current user
        if (reminder.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this reminder'
            });
        }

        res.status(200).json({
            success: true,
            data: reminder
        });
    } catch (error) {
        console.error('Error getting reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting reminder',
            error: error.message
        });
    }
};

// Create a new reminder
exports.createReminder = async (req, res) => {
    try {
        console.log('Create reminder request received');
        console.log('Request body:', req.body);
        console.log('User in request:', req.user);

        const { type, title, date, client, notes } = req.body;

        // Validate required fields
        if (!title || !date) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Please provide title and date'
            });
        }

        if (!req.user || !req.user._id) {
            console.log('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        console.log('Creating reminder with userId:', req.user._id);

        // Create reminder
        const reminder = await Reminder.create({
            type,
            title,
            date,
            client,
            notes,
            completed: false,
            userId: req.user._id
        });

        console.log('Reminder created successfully:', reminder);

        res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            data: reminder
        });
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating reminder',
            error: error.message
        });
    }
};

// Update a reminder
exports.updateReminder = async (req, res) => {
    try {
        const { type, title, date, client, notes, completed } = req.body;

        // Find reminder
        let reminder = await Reminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Check if the reminder belongs to the current user
        if (reminder.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this reminder'
            });
        }

        // Update reminder
        reminder = await Reminder.findByIdAndUpdate(
            req.params.id,
            {
                type,
                title,
                date,
                client,
                notes,
                completed,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Reminder updated successfully',
            data: reminder
        });
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reminder',
            error: error.message
        });
    }
};

// Toggle reminder completion status
exports.toggleComplete = async (req, res) => {
    try {
        // Find reminder
        let reminder = await Reminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Check if the reminder belongs to the current user
        if (reminder.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this reminder'
            });
        }

        // Toggle completed status
        reminder = await Reminder.findByIdAndUpdate(
            req.params.id,
            {
                completed: !reminder.completed,
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: `Reminder marked as ${reminder.completed ? 'completed' : 'incomplete'}`,
            data: reminder
        });
    } catch (error) {
        console.error('Error toggling reminder completion:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating reminder',
            error: error.message
        });
    }
};

// Delete a reminder
exports.deleteReminder = async (req, res) => {
    try {
        const reminder = await Reminder.findById(req.params.id);

        if (!reminder) {
            return res.status(404).json({
                success: false,
                message: 'Reminder not found'
            });
        }

        // Check if the reminder belongs to the current user
        if (reminder.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this reminder'
            });
        }

        await Reminder.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Reminder deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting reminder',
            error: error.message
        });
    }
};
