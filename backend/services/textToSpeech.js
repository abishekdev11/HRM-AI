const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require("fs/promises");
const path = require("path");

const voices = {
    en: "en-US-AriaNeural",
    ta: "ta-IN-PallaviNeural",
    hi: "hi-IN-SwaraNeural",
    te: "te-IN-ShrutiNeural",
    ml: "ml-IN-SobhanaNeural",
    kn: "kn-IN-SapnaNeural"
};

async function textToSpeech(text, language = "en") {

    const outputFolder = path.join(__dirname, "../temp");

    try {
        await fs.mkdir(outputFolder, { recursive: true });
    } catch (err) {
        // non-fatal: proceed and let TTS write fail loudly if needed
        console.error('mkdir error (textToSpeech):', err?.message || err);
    }

    const voice = voices[language] || voices.en;

    const tts = new MsEdgeTTS();

    await tts.setMetadata(
        voice,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const { audioFilePath } = await tts.toFile(
        outputFolder,
        text
    );

    return audioFilePath;
}

module.exports = textToSpeech;