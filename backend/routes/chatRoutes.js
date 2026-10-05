const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const uploadAudio = require("../middleware/uploadAudio");

const chatController = require("../controllers/chatController");
const audioFileController = require("../controllers/audioFileController");

function handleAudioUpload(req, res, next) {
	uploadAudio.single("audio")(req, res, (error) => {
		if (!error) return next();
		const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
		return res.status(status).json({
			message: status === 413 ? "Audio file exceeds the 25 MB limit." : error.message,
		});
	});
}

router.post("/chat", protect, handleAudioUpload, (req, res, next) => {
	if (req.file) return audioFileController(req, res, next);
	return chatController(req, res, next);
});

module.exports = router;