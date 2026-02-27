const axios = require('axios');

async function testPin() {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testtest@example.com',
            password: 'password'
        });

        const token = res.data.token;
        console.log("Logged in");

        // First need to get/create a room
        const roomRes = await axios.post('http://localhost:5000/api/rooms', {
            privacyState: 'Public', roomType: 'Permanent'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const roomId = roomRes.data.roomId;
        console.log("Created room:", roomId);

        // Try pinning
        const pinRes = await axios.post(`http://localhost:5000/api/rooms/${roomId}/favorite`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Pin OK:", pinRes.data);
    } catch (err) {
        console.error("API Error:");
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}
testPin();
