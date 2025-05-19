const Task = require('../models/Task');

// Get all tasks
exports.getTasks = async (req, res) => {
    try {
        console.log('Get tasks request received');

        // Get tasks for the current user
        const tasks = await Task.find({ employeeId: req.user._id })
            .sort({ dueDate: 1, priority: -1 });

        console.log(`Found ${tasks.length} tasks for user ${req.user._id}`);

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message
        });
    }
};

// Get a single task by ID
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if the task belongs to the current user
        if (task.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this task'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message
        });
    }
};

// Create a new task
exports.createTask = async (req, res) => {
    try {
        console.log('Create task request received');
        console.log('Request body:', req.body);
        console.log('User in request:', req.user);

        const { description, priority, dueDate, leadId, leadName, company } = req.body;

        // Validate required fields
        if (!description || !dueDate) {
            console.log('Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Please provide description and due date'
            });
        }

        if (!req.user || !req.user._id) {
            console.log('User not found in request');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        console.log('Creating task with employeeId:', req.user._id);

        // Create task
        const task = await Task.create({
            description,
            priority: priority || 'medium',
            dueDate,
            completed: false,
            employeeId: req.user._id,
            leadId: leadId || null,
            leadName: leadName || null,
            company: company || null
        });

        console.log('Task created successfully:', task);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: task
        });
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message
        });
    }
};

// Update a task
exports.updateTask = async (req, res) => {
    try {
        const { description, priority, dueDate, completed, leadId, leadName, company } = req.body;

        // Find task
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if the task belongs to the current user
        if (task.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this task'
            });
        }

        // Update task
        task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                description,
                priority,
                dueDate,
                completed,
                leadId,
                leadName,
                company,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: task
        });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task',
            error: error.message
        });
    }
};

// Toggle task completion status
exports.toggleComplete = async (req, res) => {
    try {
        // Find task
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if the task belongs to the current user
        if (task.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this task'
            });
        }

        // Toggle completion status
        task.completed = !task.completed;
        task.updatedAt = Date.now();

        await task.save();

        res.status(200).json({
            success: true,
            message: 'Task completion status toggled',
            data: task
        });
    } catch (error) {
        console.error('Error toggling task completion:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling task completion',
            error: error.message
        });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        // Find task
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if the task belongs to the current user
        if (task.employeeId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this task'
            });
        }

        // Delete task
        await Task.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message
        });
    }
};
