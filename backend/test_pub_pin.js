const axios = require('axios');

async function testPin() {
    try {
        // Log in to existing test user
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testtest@example.com',
            password: 'password'
        });

        const token = res.data.token;
        console.log("Logged in");

        // get public rooms
        const pub = await axios.get('http://localhost:5000/api/rooms/public/all', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (pub.data.length > 0) {
            const r = pub.data[0].roomId;
            console.log("Pinning public room:", r);
            const pinRes = await axios.post(`http://localhost:5000/api/rooms/${r}/favorite`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Pin response:", pinRes.data);
        } else {
            console.log("No public rooms");
        }
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
