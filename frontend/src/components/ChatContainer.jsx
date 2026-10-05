import { useEffect, useRef } from "react";
import { FaComments } from "react-icons/fa";
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
    <div className="flex-1 min-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/80 p-5 shadow-inner sm:p-6 md:min-h-[420px]">

      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
              <FaComments size={24} aria-hidden="true" />
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
        messages.map((message, index) => (
          <Message
            key={index}
            sender={message.sender}
            text={message.text}
            audioSrc={message.audioSrc}
          />
        ))
      )}

      {status && (
        <div className="flex items-center mt-3">
          <div className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-full animate-pulse">
            {status}
          </div>
        </div>
      )}

      <div ref={bottomRef} />

    </div>
  );
}

export default ChatContainer;