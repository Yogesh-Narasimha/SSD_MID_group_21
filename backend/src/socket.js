let io;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, { cors: { origin: "*" } });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', ({ lectureId }) => {
      if (!lectureId) {
        socket.emit('join-error', { message: 'lectureId required' });
        return;
      }
      socket.join(lectureId);
      console.log(`Socket ${socket.id} joined lecture ${lectureId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
