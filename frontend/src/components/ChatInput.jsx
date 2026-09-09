import { useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaMicrophone,
  FaStop,
} from "react-icons/fa";

function ChatInput({
  question,
  setQuestion,
  handleSend,
  handleVoice,
  loading,
  stopAudio,
  setRecording,
}) {
  const inputRef = useRef(null);
  const hasStartedChat = useRef(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const streamRef = useRef(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const silenceStartRef = useRef(null);

  const recordingRef = useRef(false);

  // -----------------------------
  // Focus Input
  // -----------------------------

  useEffect(() => {
    if (loading && !hasStartedChat.current) {
      hasStartedChat.current = true;
    }

    if (
      hasStartedChat.current &&
      !loading &&
      !recordingRef.current
    ) {
      inputRef.current?.focus();
    }
  }, [loading]);

  // -----------------------------
  // Cleanup
  // -----------------------------

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !loading &&
      !recordingRef.current
    ) {
      handleSend();
    }
  };

  // -----------------------------
  // Detect Silence
  // -----------------------------

  const detectSilence = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;

    const data = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(data);

    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      const value = data[i] - 128;
      sum += value * value;
    }

    const rms = Math.sqrt(sum / data.length);

    const speaking = rms > 5;

    if (speaking) {
      silenceStartRef.current = null;
    } else {
      if (!silenceStartRef.current) {
        silenceStartRef.current = Date.now();
      }

      // Auto stop after 3 seconds

      if (
        Date.now() - silenceStartRef.current >
        3000
      ) {
        stopRecording();
        return;
      }
    }

    animationFrameRef.current =
      requestAnimationFrame(detectSilence);
  };

  // -----------------------------
  // Start Recording
  // -----------------------------

  const startRecording = async () => {
    try {
      // Stop any bot audio first

      if (stopAudio) {
        stopAudio();
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const recorder =
        new MediaRecorder(stream);

      recorderRef.current = recorder;

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        if (audioContextRef.current) {
          await audioContextRef.current.close();
        }

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());
        }

        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        recordingRef.current = false;
        setRecording(false);

        await handleVoice(audioBlob);
      };

      recorder.start();

      recordingRef.current = true;
      setRecording(true);

      const audioContext =
        new AudioContext();

      audioContextRef.current =
        audioContext;

      const source =
        audioContext.createMediaStreamSource(
          stream
        );

      const analyser =
        audioContext.createAnalyser();

      analyser.fftSize = 2048;

      source.connect(analyser);

      analyserRef.current = analyser;

      silenceStartRef.current = null;

      detectSilence();
    } catch (err) {
      console.error(err);

      recordingRef.current = false;
      setRecording(false);
    }
  };

  // -----------------------------
  // Stop Recording
  // -----------------------------

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state ===
        "recording"
    ) {
      recorderRef.current.stop();
    }
  };

  return (
    <div className="bg-white border border-gray-600 rounded-xl p-4 flex items-center gap-4 shadow-sm">

      <input
        ref={inputRef}
        type="text"
        placeholder="Ask anything about your company..."
        value={question}
        onChange={(e) =>
          setQuestion(e.target.value)
        }
        onKeyDown={handleKeyDown}
        disabled={
          loading ||
          recordingRef.current
        }
        className="flex-1 outline-none text-gray-700 disabled:bg-white"
      />

      <button
        onClick={() => {
          if (recordingRef.current) {
            stopRecording();
          } else {
            startRecording();
          }
        }}
        disabled={loading}
        className={`px-4 py-3 rounded-lg text-white transition ${
          recordingRef.current
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {recordingRef.current ? (
          <FaStop />
        ) : (
          <FaMicrophone />
        )}
      </button>

      <button
        onClick={handleSend}
        disabled={
          loading ||
          recordingRef.current
        }
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-lg transition"
      >
        <FaPaperPlane />
      </button>

    </div>
  );
}

export default ChatInput;