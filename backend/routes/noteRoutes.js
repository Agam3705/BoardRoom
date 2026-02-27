const express = require('express');
const router = express.Router();
const { getNote, saveNote, getAllNotes, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.get('/vault/all', protect, getAllNotes);

router.route('/:roomId')
    .get(protect, getNote)
    .put(protect, saveNote)
    .delete(protect, deleteNote);

module.exports = router;
