require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cron = require("node-cron");




const app = express();
const server = http.createServer(app);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// ------------------------------
// Socket.IO configuration
// ------------------------------
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Make io accessible in routes/controllers
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join a room based on user ID
  socket.on("authenticate", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ------------------------------
// Middleware
// ------------------------------
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ------------------------------
// Routes
// ------------------------------
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/leave-types", require("./routes/leaveTypeRoutes"));
app.use("/api/balances", require("./routes/leaveBalanceRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/employees", require("./routes/employeeProfileRoutes")); // note: same base path as above – order matters
app.use("/api/admin", require("./routes/carryForwardRoutes"));
app.use("/api/manager", require("./routes/managerRoutes"));
app.use("/api/calendar", require("./routes/calendarRoutes"));

// ------------------------------
// Root endpoint
// ------------------------------
app.get("/", (req, res) => {
  res.json({ message: "Leave Management API Running" });
});

// ------------------------------
// Scheduled Jobs
// ------------------------------
// Run on 1st April at 00:05 AM every year (carry forward leaves)
cron.schedule("5 0 1 4 *", async () => {
  const { carryForwardLeaves } = require("./utils/carryForwardLeaves");
  const currentYear = new Date().getFullYear() - 1; // previous financial year start year
  const nextYear = currentYear + 1;
  console.log(`Running scheduled carry-forward for ${currentYear} -> ${nextYear}`);
  await carryForwardLeaves(currentYear, nextYear);
});

// Run at 5 minutes past midnight on the 1st day of every month (PL accrual)
cron.schedule("5 0 1 * *", async () => {
  const { monthlyPLAccrual } = require("./utils/monthlyPLAccrual");
  console.log("Running monthly PL accrual...");
  await monthlyPLAccrual().catch(console.error);
});

// ------------------------------
// Start Server
// ------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

