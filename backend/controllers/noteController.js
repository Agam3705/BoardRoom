const Note = require('../models/Note');

// Get personal note for a specific room
const getNote = async (req, res) => {
    try {
        const { roomId } = req.params;
        let note = await Note.findOne({ userId: req.user._id, roomId });

        if (!note) {
            note = await Note.create({ userId: req.user._id, roomId, content: '' });
        }

        res.json(note);
    } catch (error) {
        console.error("getNote error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// Update personal note for a specific room
const saveNote = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content } = req.body;

        let note = await Note.findOne({ userId: req.user._id, roomId });
        if (!note) {
            note = await Note.create({ userId: req.user._id, roomId, content });
        } else {
            note.content = content;
            await note.save();
        }

        res.json(note);
    } catch (error) {
        console.error("saveNote error:", error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// Get all notes for user (Vault)
const getAllNotes = async (req, res) => {
    try {
        const notes = await Note.find({
            userId: req.user._id,
            content: { $ne: '' }
        });
        res.json(notes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Delete personal note for a specific room
const deleteNote = async (req, res) => {
    try {
        const { roomId } = req.params;
        const note = await Note.findOneAndDelete({ userId: req.user._id, roomId });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getNote, saveNote, getAllNotes, deleteNote };
