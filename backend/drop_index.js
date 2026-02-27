const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/boardroom')
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            await mongoose.connection.collection('rooms').dropIndex('uuid_1');
            console.log('Successfully dropped old uuid_1 index');
        } catch (err) {
            console.log('Index might not exist or error:', err.message);
        }
        process.exit(0);
    })
    .catch((err) => {
        console.error('Connection error:', err);
        process.exit(1);
    });
