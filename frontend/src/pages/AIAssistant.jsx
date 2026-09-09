import { useState, useRef } from "react";
import ChatContainer from "../components/ChatContainer";
import ChatInput from "../components/ChatInput";
import { askAI, askAIAudio } from "../api/chatbot";

function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);

  const audioRef = useRef(null);

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
      const result = await askAI(currentQuestion);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: result.answer,
        },
      ]);

      // Stop previous audio

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (!muted && result.audio) {
        const audio = new Audio(result.audio);

        audioRef.current = audio;

        setSpeaking(true);

        audio.onended = () => {
          setSpeaking(false);
        };

        audio.play();
      }

    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // Voice Chat
  // -----------------------------------

  const handleVoice = async (audioBlob) => {
    setRecording(false);

    setLoading(true);

    try {
      const result = await askAIAudio(audioBlob);

      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: result.transcript,
        },
        {
          sender: "bot",
          text: result.answer,
        },
      ]);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (!muted && result.audio) {
        const audio = new Audio(result.audio);

        audioRef.current = audio;

        setSpeaking(true);

        audio.onended = () => {
          setSpeaking(false);
        };

        audio.play();
      }

    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "❌ Voice recognition failed.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setSpeaking(false);
    setMessages([]);
    setQuestion("");
  };

  // -----------------------------------
  // Toggle Mute
  // -----------------------------------

  const toggleMute = () => {
    const nextMuted = !muted;

    setMuted(nextMuted);

    if (nextMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setSpeaking(false);
    }
  };

  // -----------------------------------
  // Status Text
  // -----------------------------------

  const status = recording
    ? "🎙 Listening..."
    : loading
    ? "🤖 Thinking..."
    : speaking
    ? "🔊 Speaking..."
    : "";

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
          handleVoice={handleVoice}
          loading={loading}
          recording={recording}
          setRecording={setRecording}
        />

      </div>

    </div>
  );
}

export default AIAssistant;