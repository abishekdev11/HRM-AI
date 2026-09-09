const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const express = require("express");
const connectDB = require("./config/db");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();
app.use(express.json());

app.use(cors({
  exposedHeaders: ['X-Transcript', 'X-Answer', 'X-Language']
}));

app.get('/', (req,res) => {
    res.send("HR Management Chatbot API is Running...")
});

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);


const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();


    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });


})();