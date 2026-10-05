const fs = require("fs/promises");
const speechToText = require("../services/speechToText");
const { createChatResponse } = require("../services/chatResponse");

async function audioFileController(req, res) {
    const audioPath = req.file?.path;
    if (!audioPath) {
        return res.status(400).json({ success: false, message: "Please provide an audio file." });
    }

    try {
        const { text } = await speechToText(audioPath);
        const transcript = text?.trim();
        if (!transcript) {
            return res.status(422).json({ success: false, message: "No speech was detected." });
        }

        const response = await createChatResponse(transcript, req.user);
        return res.json({ success: true, ...response });
    } catch (error) {
        console.error("Audio chat error:", error);
        return res.status(500).json({ success: false, message: "Unable to process the audio message." });
    } finally {
        await fs.unlink(audioPath).catch((error) => {
            if (error.code !== "ENOENT") console.error("Audio cleanup error:", error.message);
        });
    }
}

module.exports = audioFileController;