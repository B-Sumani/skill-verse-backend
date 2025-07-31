const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const config = require('./config');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const algorandRoutes = require('./routes/algorand');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const videoRoutes = require('./routes/videoRoutes');
const videoRequestRoutes = require('./routes/videoRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const credentialRoutes = require('./routes/credentialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const livekitRoutes = require('./routes/livekitRoutes');

// Connect to MongoDB
mongoose.connect(config.database.uri)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

// API Routes
app.use('/api/algorand', algorandRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/video-sessions', videoRoutes);
app.use('/api/video-requests', videoRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/livekit', livekitRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Skill Verse API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      algorand: '/api/algorand',
      auth: '/api/auth',
      users: '/api/users',
      sessions: '/api/sessions',
      messages: '/api/messages',
      feedback: '/api/feedback',
      credentials: '/api/credentials'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Handle video session events
  socket.on('join-video-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`📹 User joined video session: ${sessionId}`);
  });

  socket.on('leave-video-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`📹 User left video session: ${sessionId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Algorand API: http://localhost:${PORT}/api/algorand`);
  console.log(`🌐 Algorand Network: ${config.algorand.network}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`📅 Sessions API: http://localhost:${PORT}/api/sessions`);
  console.log(`💬 Messages API: http://localhost:${PORT}/api/messages`);
  console.log(`📹 Video Sessions API: http://localhost:${PORT}/api/video-sessions`);
  console.log(`📹 Video Requests API: http://localhost:${PORT}/api/video-requests`);
  console.log(`📝 Feedback API: http://localhost:${PORT}/api/feedback`);
  console.log(`🎖️ Credentials API: http://localhost:${PORT}/api/credentials`);
  console.log(`🔌 WebSocket server ready on port ${PORT}`);
});

module.exports = app;
