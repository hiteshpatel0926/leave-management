require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const profileRoutes = require("./routes/profileRoutes");
const employeeProfileRoutes = require("./routes/employeeProfileRoutes");
const app = express();

// backend/src/server.js (or index.js)

const http = require('http');
const { Server } = require('socket.io');



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/balances", leaveBalanceRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/employees", employeeProfileRoutes);
// Make io accessible in routes/controllers
app.set('io', io);

app.get("/", (req, res) => {
  res.json({
    message: "Leave Management API Running",
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a room based on user ID (authenticate via token later)
  socket.on('authenticate', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


