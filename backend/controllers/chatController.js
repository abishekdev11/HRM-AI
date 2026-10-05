const { createChatResponse } = require("../services/chatResponse");

async function chatController(req, res) {
    try {
        const question = req.body?.question;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Please provide a question.",
            });
        }

        const response = await createChatResponse(question, req.user);
        return res.json({ success: true, ...response });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

module.exports = chatController;
