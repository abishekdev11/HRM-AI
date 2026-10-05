const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const http = require("http");
const express = require("express");
const connectDB = require("./config/db");
const attachLiveChat = require("./services/liveChat");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const projectRoutes = require("./routes/projectRoutes");
const queryRoutes = require("./routes/queryRoutes");

const app = express();
const server = http.createServer(app);
attachLiveChat(server);
app.use(express.json());

app.use(cors({ exposedHeaders: ["X-Transcript", "X-Answer"] }));

app.get('/', (req,res) => {
    res.send("HR Management Chatbot API is Running...")
});

app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/queries", queryRoutes);


const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });


})();