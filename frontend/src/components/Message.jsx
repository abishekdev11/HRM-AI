function Message({ sender, text }) {
  const isUser = sender === "user";

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

export default Message;