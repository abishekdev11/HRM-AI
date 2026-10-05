const crypto = require("crypto");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");
const User = require("../models/User");
const speechToText = require("./speechToText");
const { createChatResponse } = require("./chatResponse");

function encodePcmAsWav(pcm) {
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(16000, 24);
    header.writeUInt32LE(32000, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
}

function attachLiveChat(server) {
    const webSockets = new WebSocketServer({ server, path: "/api/chat/live" });

    webSockets.on("connection", (socket) => {
        let actor = null;
        let audioChunks = [];
        let processing = false;

        const send = (event) => {
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
        };

        const processText = async (question, includeUserTranscript) => {
            if (processing) {
                send({ type: "error", message: "A message is already being processed." });
                return;
            }

            processing = true;
            try {
                const { answer } = await createChatResponse(question, actor);
                if (includeUserTranscript) send({ type: "transcript", sender: "user", text: question });
                send({ type: "transcript", sender: "bot", text: answer });
                send({ type: "turnComplete" });
            } catch (error) {
                console.error("Live chat error:", error);
                send({ type: "error", message: "Unable to process your message." });
            } finally {
                processing = false;
            }
        };

        socket.on("message", async (rawMessage) => {
            let message;
            try {
                message = JSON.parse(rawMessage.toString());
            } catch {
                send({ type: "error", message: "Invalid message format." });
                return;
            }

            if (message.type === "auth") {
                try {
                    const decoded = jwt.verify(message.token, process.env.JWT_SECRET);
                    actor = await User.findById(decoded.userId || decoded.id)
                        .populate("department", "name")
                        .select("-password");
                    if (!actor || !actor.isActive) throw new Error("Invalid account.");
                    send({ type: "ready" });
                } catch {
                    send({ type: "error", message: "Authentication failed." });
                    socket.close(1008, "Authentication failed");
                }
                return;
            }

            if (!actor) {
                send({ type: "error", message: "Authenticate before sending messages." });
                return;
            }

            if (message.type === "audio") {
                if (typeof message.data === "string") {
                    audioChunks.push(Buffer.from(message.data, "base64"));
                }
                return;
            }

            if (message.type === "text") {
                const question = message.text?.trim();
                if (question) await processText(question, false);
                return;
            }

            if (message.type === "audioEnd") {
                const pcm = Buffer.concat(audioChunks);
                audioChunks = [];
                if (!pcm.length) {
                    send({ type: "error", message: "No audio was recorded." });
                    return;
                }

                processing = true;
                const audioPath = path.join(os.tmpdir(), `hrm-live-${crypto.randomUUID()}.wav`);
                try {
                    await fs.writeFile(audioPath, encodePcmAsWav(pcm));
                    const { text } = await speechToText(audioPath);
                    const transcript = text?.trim();
                    if (!transcript) {
                        send({ type: "error", message: "No speech was detected." });
                        return;
                    }

                    send({ type: "transcript", sender: "user", text: transcript });
                    const { answer } = await createChatResponse(transcript, actor);
                    send({ type: "transcript", sender: "bot", text: answer });
                    send({ type: "turnComplete" });
                } catch (error) {
                    console.error("Live audio error:", error);
                    send({ type: "error", message: "Unable to transcribe or answer the audio message." });
                } finally {
                    processing = false;
                    await fs.unlink(audioPath).catch(() => {});
                }
            }
        });
    });

    return webSockets;
}

module.exports = attachLiveChat;