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

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.json({
    message: "Leave Management API Running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
