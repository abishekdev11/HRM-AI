import { useEffect, useState, useRef } from "react";
import ChatContainer from "../components/ChatContainer";
import ChatInput from "../components/ChatInput";
const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://hrm-ai-backend-ltot.onrender.com";
const LIVE_SOCKET_URL = API_BASE_URL.replace(/^http/, "ws") + "/api/chat/live";

function encodeBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toPcm16(samples) {
  const pcm = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return new Uint8Array(pcm.buffer);
}

function resample(samples, inputRate, outputRate) {
  if (inputRate === outputRate) return samples;
  const ratio = inputRate / outputRate;
  const output = new Float32Array(Math.floor(samples.length / ratio));
  for (let index = 0; index < output.length; index += 1) {
    const position = index * ratio;
    const start = Math.floor(position);
    const fraction = position - start;
    const next = Math.min(start + 1, samples.length - 1);
    output[index] = samples[start] * (1 - fraction) + samples[next] * fraction;
  }
  return output;
}

async function connectBackendLive({ onEvent, withMicrophone = false, isMuted }) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please sign in before starting chat.");

  const outputContext = new AudioContext({ sampleRate: 24000 });
  const outputReady = outputContext.resume();
  const socket = new WebSocket(LIVE_SOCKET_URL);
  let microphoneStream;
  let inputContext;
  let inputSource;
  let processor;
  let nextPlaybackTime = 0;
  let closed = false;
  let ready = false;
  let resolveReady;
  let rejectReady;

  const socketReady = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const readyTimeout = window.setTimeout(
    () => rejectReady(new Error("Live connection timed out.")),
    15000
  );

  const stopMicrophone = async () => {
    if (socket.readyState === WebSocket.OPEN && microphoneStream) {
      socket.send(JSON.stringify({ type: "audioEnd" }));
    }
    processor?.disconnect();
    inputSource?.disconnect();
    processor = null;
    inputSource = null;
    microphoneStream?.getTracks().forEach((track) => track.stop());
    microphoneStream = null;
    if (inputContext) {
      await inputContext.close().catch(() => {});
      inputContext = null;
    }
  };

  const startMicrophone = async () => {
    if (microphoneStream) return;
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    try {
      inputContext = new AudioContext({ sampleRate: 16000 });
      await inputContext.resume();
      const activeInputContext = inputContext;
      inputSource = activeInputContext.createMediaStreamSource(microphoneStream);
      processor = activeInputContext.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (audioEvent) => {
        audioEvent.outputBuffer.getChannelData(0).fill(0);
        if (socket.readyState !== WebSocket.OPEN) return;
        const samples = resample(
          audioEvent.inputBuffer.getChannelData(0),
          activeInputContext.sampleRate,
          16000
        );
        socket.send(JSON.stringify({
          type: "audio",
          data: encodeBase64(toPcm16(samples)),
        }));
      };
      inputSource.connect(processor);
      processor.connect(activeInputContext.destination);
    } catch (error) {
      await stopMicrophone();
      throw error;
    }
  };

  const playAudio = (base64Audio) => {
    if (isMuted()) return;
    const bytes = decodeBase64(base64Audio);
    const sampleCount = Math.floor(bytes.length / 2);
    if (!sampleCount) return;

    const audioBuffer = outputContext.createBuffer(1, sampleCount, 24000);
    const channel = audioBuffer.getChannelData(0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let index = 0; index < sampleCount; index += 1) {
      channel[index] = view.getInt16(index * 2, true) / 32768;
    }

    const source = outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputContext.destination);
    const startTime = Math.max(outputContext.currentTime, nextPlaybackTime);
    source.start(startTime);
    nextPlaybackTime = startTime + audioBuffer.duration;
  };

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "auth", token }));
  };

  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.type === "ready") {
      ready = true;
      window.clearTimeout(readyTimeout);
      resolveReady();
      return;
    }
    if (message.type === "error") {
      if (!ready) rejectReady(new Error(message.message || "Live connection failed."));
      else onEvent(message);
      return;
    }
    if (message.type === "audio") playAudio(message.data);
    else onEvent(message);
  };

  socket.onerror = () => {
    const error = new Error("Could not connect to the HR chat server.");
    if (!ready) rejectReady(error);
    else onEvent({ type: "error", message: error.message });
  };

  socket.onclose = () => {
    window.clearTimeout(readyTimeout);
    if (!ready) rejectReady(new Error("Live connection closed before authentication."));
    void stopMicrophone();
    if (!closed) onEvent({ type: "closed" });
  };

  try {
    await socketReady;
    await outputReady;
    if (withMicrophone) await startMicrophone();
  } catch (error) {
    window.clearTimeout(readyTimeout);
    await stopMicrophone();
    if (socket.readyState < WebSocket.CLOSING) socket.close();
    await outputContext.close().catch(() => {});
    throw error;
  }

  return {
    sendText(text) {
      if (socket.readyState !== WebSocket.OPEN) throw new Error("Live session is not connected.");
      socket.send(JSON.stringify({ type: "text", text }));
    },
    startMicrophone,
    stopMicrophone,
    async close() {
      closed = true;
      await stopMicrophone();
      if (socket.readyState < WebSocket.CLOSING) socket.close();
      await outputContext.close().catch(() => {});
    },
  };
}

function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const liveRef = useRef(null);
  const mutedRef = useRef(false);
  const liveMessageIdsRef = useRef({ user: null, bot: null });
  const pendingTypedInputRef = useRef(false);

  useEffect(() => () => {
    void liveRef.current?.close();
  }, []);

  const appendLiveTranscript = (sender, text) => {
    const messageIds = liveMessageIdsRef.current;
    const id = messageIds[sender] || crypto.randomUUID();
    messageIds[sender] = id;
    setMessages((previous) => {
      const index = previous.findIndex((message) => message.id === id);
      if (index < 0) return [...previous, { id, sender, text }];
      return previous.map((message, itemIndex) =>
        itemIndex === index ? { ...message, text: message.text + text } : message
      );
    });
  };

  const openLiveSession = async (withMicrophone) => {
    const session = await connectBackendLive({
      withMicrophone,
      isMuted: () => mutedRef.current,
      onEvent: (event) => {
        if (event.type === "transcript") {
          if (event.sender === "user" && pendingTypedInputRef.current) {
            pendingTypedInputRef.current = false;
          } else {
            appendLiveTranscript(event.sender, event.text);
          }
        }
        if (event.type === "turnComplete") {
          liveMessageIdsRef.current = { user: null, bot: null };
          pendingTypedInputRef.current = false;
          setLoading(false);
        }
        if (event.type === "error") {
          setMessages((prev) => [...prev, { sender: "bot", text: event.message }]);
          setLoading(false);
        }
        if (event.type === "closed") {
          liveRef.current = null;
          setLive(false);
        }
      },
    });
    liveRef.current = session;
    setLive(withMicrophone);
    return session;
  };

  // -----------------------------------
  // Send Text Message
  // -----------------------------------

  const sendMessage = async (text) => {
    const currentQuestion = text.trim();

    if (!currentQuestion) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: currentQuestion,
      },
    ]);
    setQuestion("");
    setLoading(true);
    try {
      const session = liveRef.current || await openLiveSession(false);
      pendingTypedInputRef.current = true;
      session.sendText(currentQuestion);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: error.response?.data?.message || error.message || "Unable to send your message.",
        },
      ]);
      pendingTypedInputRef.current = false;
      setLoading(false);
    }
  };

  const startVoice = async () => {
    setLoading(true);
    try {
      if (liveRef.current) await liveRef.current.startMicrophone();
      else await openLiveSession(true);
      setLive(true);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: error.response?.data?.message || error.message || "Unable to start live voice chat.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopVoice = async () => {
    const session = liveRef.current;
    setLive(false);
    if (session) await session.stopMicrophone();
  };

  const toggleVoice = () => {
    if (live) void stopVoice();
    else void startVoice();
  };

  // -----------------------------------
  // Send Button
  // -----------------------------------

  const handleSend = () => {
    sendMessage(question);
  };

  // -----------------------------------
  // Clear Chat
  // -----------------------------------

  const clearChat = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the conversation?"
    );

    if (!confirmClear) return;

    liveMessageIdsRef.current = { user: null, bot: null };
    pendingTypedInputRef.current = false;
    setMessages([]);
    setQuestion("");
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    mutedRef.current = nextMuted;
  };

  // -----------------------------------
  // Status Text
  // -----------------------------------

  const status = loading ? "Gemini is responding..." : live ? "Listening..." : "";

      return (
    <div className="h-full flex flex-col">

      {/* Header */}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              🤖 AI Assistant
            </h1>

            <p className="text-gray-500 mt-2">
              Ask anything about employees, leave policies,
              company details, working hours and more.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={toggleMute}
              className={`px-4 py-2 rounded-lg transition ${
                muted
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {muted ? "🔇 Unmute" : "🔊 Mute"}
            </button>

            {messages.length > 0 && (

              <button
                onClick={clearChat}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                🗑 Clear Chat
              </button>

            )}

          </div>

        </div>

      </div>

      {/* Chat */}

      <ChatContainer
        messages={messages}
        status={status}
      />

      {/* Input */}

      <div className="mt-6">

        <ChatInput
          question={question}
          setQuestion={setQuestion}
          handleSend={handleSend}
          toggleVoice={toggleVoice}
          loading={loading}
          recording={live}
        />

      </div>

    </div>
  );
}

export default AIAssistant;