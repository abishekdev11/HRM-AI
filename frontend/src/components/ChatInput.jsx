import { useEffect, useRef } from "react";
import { FaMicrophone, FaPaperPlane, FaStop } from "react-icons/fa";

function ChatInput({ question, setQuestion, handleSend, toggleVoice, loading, recording }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!loading && !recording) inputRef.current?.focus();
  }, [loading, recording]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) handleSend();
  };

  return (
    <div className="bg-white border border-gray-600 rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <input
        ref={inputRef}
        type="text"
        placeholder="Ask anything about your company..."
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="flex-1 outline-none text-gray-700 disabled:bg-white"
      />
      <button
        type="button"
        onClick={toggleVoice}
        disabled={loading}
        aria-label={recording ? "Stop audio recording" : "Record an audio message"}
        title={recording ? "Stop recording" : "Record audio message"}
        className={`px-4 py-3 rounded-lg text-white transition ${recording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled:bg-gray-400`}
      >
        {recording ? <FaStop /> : <FaMicrophone />}
      </button>
      <button
        type="button"
        onClick={handleSend}
        disabled={loading || recording || !question.trim()}
        aria-label="Send message"
        title="Send message"
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg transition"
      >
        <FaPaperPlane />
      </button>
    </div>
  );
}

export default ChatInput;