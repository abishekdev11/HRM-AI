const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadAudio");
const protect = require("../middleware/authMiddleware");

const chatController = require("../controllers/chatController");

router.post("/chat", protect, upload.single("audio"), chatController);

module.exports = router;