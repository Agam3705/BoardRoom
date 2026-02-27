const express = require('express');
const router = express.Router();
const { createRoom, getRoomById, saveWhiteboardData, getUserRooms, getPublicRooms, deleteRoom, toggleFavoriteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createRoom)
    .get(protect, getUserRooms);

router.get('/public/all', protect, getPublicRooms);

router.route('/:roomId')
    .get(protect, getRoomById)
    .delete(protect, deleteRoom);

router.put('/:roomId/save', protect, saveWhiteboardData);
router.post('/:roomId/favorite', protect, toggleFavoriteRoom);

module.exports = router;
