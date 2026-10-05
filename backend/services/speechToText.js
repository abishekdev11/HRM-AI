const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");

const STT_MODEL = "gemini-3.5-transcribe";
const AUDIO_MIME_TYPES = {
    ".aac": "audio/aac",
    ".aiff": "audio/aiff",
    ".flac": "audio/flac",
    ".m4a": "audio/m4a",
    ".mp3": "audio/mp3",
    ".mp4": "audio/mp4",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
};

async function speechToText(audioPath) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY is not configured.");
        }

        const mimeType = AUDIO_MIME_TYPES[path.extname(audioPath).toLowerCase()] || "audio/wav";
        const client = new GoogleGenAI({ apiKey });
        let uploadedAudio;

        try {
            uploadedAudio = await client.files.upload({
                file: audioPath,
                config: { mimeType },
            });

            const interaction = await client.interactions.create({
                model: STT_MODEL,
                input: [{
                    type: "audio",
                    uri: uploadedAudio.uri,
                    mime_type: mimeType,
                }],
                generation_config: {
                    transcription_config: { mode: "verbatim" },
                },
            });

            return {
                text: interaction.output_text?.trim() || "",
                language: null,
                language_probability: null,
            };
        } finally {
            if (uploadedAudio?.name) {
                await client.files.delete({ name: uploadedAudio.name }).catch((error) => {
                    console.error("Gemini STT file cleanup error:", error.message);
                });
            }
        }

    } catch (error) {
        console.error("Gemini STT Error:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        throw error;
    }
}

module.exports = speechToText;