const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['meeting', 'call', 'email', 'calendar'],
        default: 'meeting'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true
    },
    client: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
reminderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Reminder', reminderSchema);
