const Room = require('../models/Room');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new whiteboard room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res) => {
    try {
        const { privacyState, roomType, durationHours, roomName } = req.body || {};

        // Generate a 6-digit uppercase alphanumeric code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let roomId;
        let isUnique = false;
        while (!isUnique) {
            roomId = '';
            for (let i = 0; i < 6; i++) {
                roomId += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existing = await Room.findOne({ roomId });
            if (!existing) isUnique = true;
        }

        let expiresAt = null;
        if (roomType === 'Temporary' && durationHours) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(durationHours, 10));
        }

        const room = await Room.create({
            roomId,
            roomName: roomName || '',
            hostId: req.user._id,
            privacyState: privacyState || 'Public',
            roomType: roomType || 'Permanent',
            expiresAt,
            whiteboardData: []
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoomById = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId }).populate('hostId', 'name email');

        if (room) {
            if (room.expiresAt && new Date(room.expiresAt) < new Date()) {
                await Room.deleteOne({ _id: room._id });
                return res.status(404).json({ message: 'Room has expired and is no longer available' });
            }

            // Check if user is already in the room's access lists
            const isHost = room.hostId._id.toString() === req.user._id.toString();
            const isEditor = room.authorizedEditors.some(id => id.toString() === req.user._id.toString());
            const isViewer = room.authorizedViewers.some(id => id.toString() === req.user._id.toString());

            // If it's a public room and user is not tracked, track them to show in their dashboard history
            if (room.privacyState === 'Public' && !isHost && !isEditor && !isViewer) {
                room.authorizedEditors.push(req.user._id);
                await room.save();
            }

            res.json(room);
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save whiteboard data
// @route   PUT /api/rooms/:roomId/save
// @access  Private
const saveWhiteboardData = async (req, res) => {
    try {
        const { whiteboardData } = req.body;

        const room = await Room.findOne({ roomId: req.params.roomId });

        if (room) {
            room.whiteboardData = whiteboardData;
            await room.save();
            res.json({ message: 'Whiteboard saved successfully' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user's rooms
// @route   GET /api/rooms
// @access  Private
const getUserRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            $and: [
                {
                    $or: [
                        { hostId: req.user._id },
                        { authorizedEditors: req.user._id },
                        { authorizedViewers: req.user._id }
                    ]
                },
                { privacyState: { $ne: 'Hidden' } },
                {
                    $or: [
                        { expiresAt: null },
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: new Date() } }
                    ]
                }
            ]
        }).sort({ updatedAt: -1 });

        const dbUser = await User.findById(req.user._id);

        res.json({ rooms, favoriteRooms: dbUser.favoriteRooms || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all public rooms
// @route   GET /api/rooms/public/all
// @access  Private
const getPublicRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            privacyState: 'Public',
            $or: [
                { expiresAt: null },
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        })
            .populate('hostId', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete or un-link room
// @route   DELETE /api/rooms/:roomId
// @access  Private
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.hostId.toString() === req.user._id.toString()) {
            await Room.deleteOne({ _id: room._id });
            res.json({ message: 'Room deleted globally' });
        } else {
            room.authorizedEditors = room.authorizedEditors.filter(id => id.toString() !== req.user._id.toString());
            room.authorizedViewers = room.authorizedViewers.filter(id => id.toString() !== req.user._id.toString());
            await room.save();
            res.json({ message: 'Removed from your room log' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle favorite room
// @route   POST /api/rooms/:roomId/favorite
// @access  Private
const toggleFavoriteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const dbUser = await User.findById(req.user._id);
        if (!dbUser.favoriteRooms) dbUser.favoriteRooms = [];
        const isFavorited = dbUser.favoriteRooms.some(id => id.toString() === room._id.toString());

        if (isFavorited) {
            dbUser.favoriteRooms = dbUser.favoriteRooms.filter(id => id.toString() !== room._id.toString());
        } else {
            dbUser.favoriteRooms.push(room._id);
        }
        await dbUser.save();
        res.json({ isFavorited: !isFavorited, favoriteRooms: dbUser.favoriteRooms });
    } catch (error) {
        console.error("toggleFavoriteRoom:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRoom,
    getRoomById,
    saveWhiteboardData,
    getUserRooms,
    getPublicRooms,
    deleteRoom,
    toggleFavoriteRoom
};
