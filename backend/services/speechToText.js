const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function speechToText(audioPath) {
    try {
        const form = new FormData();

        form.append(
            "audio",
            fs.createReadStream(audioPath)
        );

        const response = await axios.post(
            "http://127.0.0.1:8000/transcribe",
            form,
            {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            }
        );

        return response.data;

    } catch (error) {

        console.error("Python STT Error:");

        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }

        throw error;
    }
}

module.exports = speechToText;