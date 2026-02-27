const axios = require('axios');

async function test() {
    try {
        // Assume user login 'admin@example.com' with 'password' or register
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test',
            email: 'testtest@example.com',
            password: 'password'
        }).catch(err => axios.post('http://localhost:5000/api/auth/login', {
            email: 'testtest@example.com',
            password: 'password'
        }));

        const token = res.data.token;
        console.log("Logged in, token:", token.substring(0, 10));

        const getRes = await axios.get('http://localhost:5000/api/notes/testroom123', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Get note OK:", getRes.data);

        const putRes = await axios.put('http://localhost:5000/api/notes/testroom123', {
            content: "Hello World"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Put note OK:", putRes.data);

    } catch (err) {
        console.error("API Error:");
        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }
    }
}
test();
