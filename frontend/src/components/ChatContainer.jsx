import { useEffect, useRef } from "react";
import Message from "./Message";

function ChatContainer({
  messages,
  status,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, status]);

  return (
    <div className="flex-1 min-h-[360px] md:min-h-[420px] bg-gray-50 rounded-xl border border-gray-600 p-6 overflow-y-auto">

      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">

          <div className="text-center">

            <div className="text-5xl mb-4">
              🤖
            </div>

            <h2 className="text-xl font-semibold text-gray-700">
              Welcome to AI Assistant
            </h2>

            <p className="text-gray-500 mt-2">
              Ask me anything about the company.
            </p>

          </div>

        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <Message
              key={index}
              sender={message.sender}
              text={message.text}
            />
          ))}

          {status && (
            <div className="flex items-center mt-3">
              <div className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full animate-pulse">
                {status}
              </div>
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />

    </div>
  );
}

export default ChatContainer;