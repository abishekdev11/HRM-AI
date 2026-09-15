import { useState } from "react";

const MESSAGE_PREVIEW_LENGTH = 500;

function Message({ sender, text }) {
  const isUser = sender === "user";
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldCollapse = !isUser && text.length > MESSAGE_PREVIEW_LENGTH;
  const visibleText = shouldCollapse && !isExpanded
    ? text.slice(0, MESSAGE_PREVIEW_LENGTH).trimEnd()
    : text;

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {visibleText}
          {shouldCollapse && !isExpanded && (
            <button
              type="button"
              className="ml-1 font-semibold underline decoration-dotted underline-offset-2"
              onClick={() => setIsExpanded(true)}
              aria-label="Show the rest of this message"
            >
              ...
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

export default Message;