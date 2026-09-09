const fs = require("fs");
const speechToText = require("../services/speechToText");
const textToSpeech = require("../services/textToSpeech");
const {
    routeChatRequest,
    executeChatAction,
    getWorkflowHelpResponse,
} = require("../agents/chatAgent");

async function sendAudioResponse(res, answer, question, detectedLanguage) {
    const audioPath = await textToSpeech(answer, detectedLanguage);

    res.setHeader("X-Transcript", encodeURIComponent(question));
    res.setHeader("X-Answer", encodeURIComponent(answer));
    res.setHeader("X-Language", detectedLanguage);

    return res.download(audioPath, "response.mp3", (err) => {
        fs.unlink(audioPath, (unlinkError) => {
            if (unlinkError && unlinkError.code !== "ENOENT") {
                console.error("unlink generatedAudioPath error:", unlinkError);
            }
        });

        if (err) {
            console.error(err);
        }
    });
}

async function chatController(req, res) {
    let uploadedAudioPath = null;
    let detectedLanguage = "en";

    try {
        let question = req.body?.question;

        if (!question && req.file) {
            uploadedAudioPath = req.file.path;

            const result = await speechToText(uploadedAudioPath);
            question = result.text;
            detectedLanguage = result.language;

            console.log("Transcript:", question);
            console.log("Language:", detectedLanguage);
        }

        if (!question) {
            return res.status(400).json({
                success: false,
                message: "Please provide either text or audio.",
            });
        }

        const workflowAnswer = getWorkflowHelpResponse(question);
        const action = workflowAnswer
            ? null
            : await routeChatRequest({ question, actor: req.user });
        const answer = action
            ? await executeChatAction(action)
            : workflowAnswer;

        return sendAudioResponse(
            res,
            answer || "I can help with employee and leave actions. Ask me to view users, leave requests, or update an employee status.",
            question,
            detectedLanguage
        );
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    } finally {
        if (uploadedAudioPath) {
            fs.unlink(uploadedAudioPath, (error) => {
                if (error && error.code !== "ENOENT") {
                    console.error("unlink uploadedAudioPath error:", error);
                }
            });
        }
    }
}

module.exports = chatController;
