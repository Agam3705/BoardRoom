const Room = require('../models/Room');
const rooms = {};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('join_room', async ({ roomId, user }) => {
            try {
                const dbRoom = await Room.findOne({ roomId });
                if (!dbRoom) return socket.emit('room_error', 'Room not found');

                const isHost = dbRoom.hostId.toString() === user._id.toString();

                if (!rooms[roomId]) {
                    rooms[roomId] = { users: [] };
                }

                if (dbRoom.privacyState === 'Private' && !isHost) {
                    const hostUser = rooms[roomId].users.find(u => u._id === dbRoom.hostId.toString());
                    if (hostUser) {
                        socket.join(`waiting_${roomId}`);
                        io.to(hostUser.socketId).emit('request_join', { socketId: socket.id, user });
                        socket.emit('join_pending');
                        return; // Halt normal join
                    } else {
                        return socket.emit('room_error', 'Host is not currently in the room to approve entry.');
                    }
                }

                socket.join(roomId);

                // Add user to room tracking
                const exists = rooms[roomId].users.find(u => u._id === user._id);
                if (!exists) {
                    rooms[roomId].users.push({ ...user, socketId: socket.id });
                }

                // Store roomId on socket for disconnect handling
                socket.roomId = roomId;
                socket.user = user;

                // Broadcast updated user list
                io.to(roomId).emit('users_updated', rooms[roomId].users);
            } catch (err) {
                console.error('Socket join_room error:', err);
            }
        });

        socket.on('approve_join', ({ socketId, roomId, user }) => {
            const pendingSocket = io.sockets.sockets.get(socketId);
            if (pendingSocket) {
                pendingSocket.leave(`waiting_${roomId}`);
                pendingSocket.join(roomId);

                if (!rooms[roomId]) rooms[roomId] = { users: [] };

                const exists = rooms[roomId].users.find(u => u._id === user._id);
                if (!exists) {
                    rooms[roomId].users.push({ ...user, socketId });
                }

                pendingSocket.roomId = roomId;
                pendingSocket.user = user;

                pendingSocket.emit('join_approved');
                io.to(roomId).emit('users_updated', rooms[roomId].users);
            }
        });

        socket.on('deny_join', ({ socketId }) => {
            const pendingSocket = io.sockets.sockets.get(socketId);
            if (pendingSocket) {
                pendingSocket.emit('join_denied');
            }
        });

        socket.on('draw', ({ roomId, drawData }) => {
            socket.to(roomId).emit('draw', drawData);
        });

        socket.on('sync_board', ({ roomId, elements }) => {
            socket.to(roomId).emit('sync_board', elements);
        });

        socket.on('cursor_move', ({ roomId, cursorData }) => {
            socket.to(roomId).emit('cursor_move', { ...cursorData, socketId: socket.id });
        });

        socket.on('clear_board', (roomId) => {
            socket.to(roomId).emit('clear_board');
        });

        socket.on('chat_message', ({ roomId, message }) => {
            socket.to(roomId).emit('chat_message', message);
        });

        socket.on('reaction', (payload) => {
            socket.to(payload.roomId).emit('reaction', payload);
        });

        socket.on('poll_vote', ({ roomId, messageId, optionIndex, voter }) => {
            socket.to(roomId).emit('poll_vote', { messageId, optionIndex, voter });
        });

        // WebRTC Signaling
        socket.on('join_video', (roomId) => {
            const usersInRoom = rooms[roomId]?.users || [];
            const otherUsers = usersInRoom.filter(u => u.socketId !== socket.id).map(u => u.socketId);
            socket.emit('all_video_users', otherUsers);
        });

        socket.on('sending_signal', payload => {
            io.to(payload.userToSignal).emit('user_joined_video', { signal: payload.signal, callerID: payload.callerID });
        });

        socket.on('returning_signal', payload => {
            io.to(payload.callerID).emit('receiving_returned_signal', { signal: payload.signal, id: socket.id });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            const roomId = socket.roomId;
            if (roomId && rooms[roomId]) {
                rooms[roomId].users = rooms[roomId].users.filter(u => u.socketId !== socket.id);
                io.to(roomId).emit('users_updated', rooms[roomId].users);

                // Clean up empty rooms
                if (rooms[roomId].users.length === 0) {
                    delete rooms[roomId];
                }

                // Notify others in room for WebRTC teardown
                socket.to(roomId).emit('user_left_video', socket.id);
            }
        });
    });
};
