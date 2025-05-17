const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    value: {
        type: String,
        default: '0'
    },
    source: {
        type: String,
        required: true,
        enum: ['Website', 'Referral', 'Social Media', 'Cold Call', 'Other']
    },
    notes: {
        type: String,
        trim: true
    },
    assignedManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    followUp: {
        date: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['Scheduled', 'Completed', 'Missed', 'Rescheduled'],
            default: 'Scheduled'
        },
        nextFollowUpDate: {
            type: Date
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed', 'Lost'],
        default: 'New'
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
leadSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add method to update follow-up
leadSchema.methods.updateFollowUp = async function(followUpData) {
    this.followUp = {
        ...followUpData,
        date: new Date(),
        createdBy: followUpData.createdBy
    };
    return this.save();
};

module.exports = mongoose.model('Lead', leadSchema); 