const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const FormData = require("form-data");
const STT_URL = process.env.STT_URL
async function speechToText(audioPath) {
    try {
        const form = new FormData();

        form.append(
            "audio",
            fs.createReadStream(audioPath)
        );

        const response = await axios.post(
            STT_URL,
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