const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    roomName: {
        type: String,
        default: ''
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    whiteboardData: {
        type: [mongoose.Schema.Types.Mixed], // Mixed type bypasses strict casting allowing nested arrays (like Table cells)
        default: []
    },
    privacyState: {
        type: String,
        enum: ['Public', 'Private', 'Hidden'],
        default: 'Public'
    },
    roomType: {
        type: String,
        enum: ['Permanent', 'Temporary'],
        default: 'Permanent'
    },
    expiresAt: {
        type: Date,
        default: null
    },
    authorizedEditors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    authorizedViewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
