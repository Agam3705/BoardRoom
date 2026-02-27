const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('./models/Note');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    try {
        const notes = await Note.find({});
        console.log("All Notes:", notes);
    } catch (err) {
        console.error("DB Error:", err);
    }
    mongoose.disconnect();
}).catch(err => console.error("Mongo Connect Error:", err));
