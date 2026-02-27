const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Note = require('./models/Note');

dotenv.config({ path: __dirname + '/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        console.log("Dropping old indexes...");
        await Note.collection.dropIndexes();
        console.log("Indexes dropped. Recreating...");
        await Note.syncIndexes();
        console.log("Indexes synched!");
    } catch (err) {
        console.error("DB Error:", err);
    }
    mongoose.disconnect();
}).catch(err => console.error("Mongo Connect Error:", err));
