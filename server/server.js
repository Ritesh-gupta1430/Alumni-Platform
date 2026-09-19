require('dotenv').config();
const http = require('http');
const { Server: SocketServer } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const socketHandler = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Store io globally for notification service
  global.__socketIO = io;

  // Initialize socket handlers
  socketHandler(io);

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║         AlumNetra API Server          ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║  Port:    ${PORT}                         ║`);
    console.log(`  ║  Env:     ${process.env.NODE_ENV}              ║`);
    console.log(`  ║  DB:      ${process.env.MONGO_URI?.slice(0, 30)}... ║`);
    console.log(`  ║  Email:   ${process.env.EMAIL_PROVIDER || 'console'}                ║`);
    console.log(`  ║  Storage: ${process.env.STORAGE_PROVIDER || 'local'}                ║`);
    console.log(`  ║  Payment: ${process.env.PAYMENT_PROVIDER || 'mock'}                 ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
  });
}

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
