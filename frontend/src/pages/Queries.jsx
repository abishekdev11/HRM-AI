import { useEffect, useRef, useState } from "react";
import { FaEnvelope, FaPaperPlane, FaPlus } from "react-icons/fa";
import {
  createQuery,
  getQueries,
  getQueryMessages,
  getQueryRecipients,
  sendQueryMessage,
} from "../api/chatbot";

function formatMessageTime(value) {
  return value
    ? new Date(value).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
    : "";
}

function Queries() {
  const [userId] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}")._id || "";
    } catch (parseError) {
      console.error("Could not read signed-in user:", parseError);
      return "";
    }
  });
  const [queries, setQueries] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [activeQueryId, setActiveQueryId] = useState("");
  const [messages, setMessages] = useState([]);
  const [composing, setComposing] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const loadInbox = async () => {
      try {
        const [queryResponse, recipientResponse] = await Promise.all([
          getQueries(),
          getQueryRecipients(),
        ]);
        if (cancelled) return;
        setQueries(queryResponse.data || []);
        setRecipients(recipientResponse.data || []);
        setError("");
      } catch (loadError) {
        if (!cancelled) {
          console.error("Could not load queries:", loadError);
          setError(loadError.response?.data?.message || "Could not load your queries.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadInbox();
    const refreshId = window.setInterval(loadInbox, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (!activeQueryId || composing) return undefined;

    let cancelled = false;
    const loadMessages = async () => {
      try {
        const response = await getQueryMessages(activeQueryId);
        if (!cancelled) {
          setMessages(response.data || []);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error("Could not load query messages:", loadError);
          setError(loadError.response?.data?.message || "Could not load messages.");
        }
      }
    };

    loadMessages();
    const refreshId = window.setInterval(loadMessages, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshId);
    };
  }, [activeQueryId, composing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeQuery = queries.find((query) => query._id === activeQueryId);
  const otherParticipant = activeQuery?.participants?.find(
    (participant) => participant._id !== userId
  );

  const startNewQuery = () => {
    setActiveQueryId("");
    setMessages([]);
    setRecipientId("");
    setSubject("");
    setDraft("");
    setError("");
    setComposing(true);
  };

  const openQuery = (queryId) => {
    setComposing(false);
    setMessages([]);
    setActiveQueryId(queryId);
    setError("");
  };

  const handleCreateQuery = async (event) => {
    event.preventDefault();
    if (!recipientId || !subject.trim() || !draft.trim()) return;

    setSending(true);
    setError("");
    try {
      const response = await createQuery({
        recipientId,
        subject: subject.trim(),
        body: draft.trim(),
      });
      setQueries((current) => [response.data, ...current]);
      setActiveQueryId(response.data._id);
      setMessages(response.message ? [response.message] : []);
      setComposing(false);
      setDraft("");
    } catch (sendError) {
      console.error("Could not create query:", sendError);
      setError(sendError.response?.data?.message || "Could not send this query.");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!activeQueryId || !body) return;

    setSending(true);
    setError("");
    try {
      const response = await sendQueryMessage(activeQueryId, body);
      setMessages((current) => [...current, response.data]);
      setQueries((current) => current.map((query) => query._id === activeQueryId
        ? { ...query, lastMessage: body.slice(0, 160), lastMessageAt: response.data.createdAt }
        : query
      ).sort((first, second) => new Date(second.lastMessageAt) - new Date(first.lastMessageAt)));
      setDraft("");
    } catch (sendError) {
      console.error("Could not send query message:", sendError);
      setError(sendError.response?.data?.message || "Could not send this message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-enter mx-auto flex min-h-[calc(100vh-12rem)] max-w-[1600px] flex-col">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Communication</p>
          <h1 className="text-3xl font-bold text-slate-900">Queries</h1>
        </div>
        <button
          type="button"
          onClick={startNewQuery}
          className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <FaPlus size={12} /> New query
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid min-h-[520px] flex-1 grid-cols-1 overflow-hidden rounded border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <aside className="flex max-h-[32rem] flex-col border-b border-slate-200 lg:max-h-none lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-800">Your conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading && <p className="px-4 py-6 text-sm text-slate-500">Loading queries...</p>}
            {!loading && queries.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-500">No queries yet. Start a private conversation.</p>
            )}
            {queries.map((query) => {
              const participant = query.participants?.find((item) => item._id !== userId);
              return (
                <button
                  type="button"
                  key={query._id}
                  onClick={() => openQuery(query._id)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeQueryId === query._id && !composing ? "bg-teal-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="truncate font-medium text-slate-800">{participant?.name || "Conversation"}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatMessageTime(query.lastMessageAt)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-slate-600">{query.subject}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{query.lastMessage}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[420px] min-w-0 flex-col">
          {composing ? (
            <form onSubmit={handleCreateQuery} className="flex flex-1 flex-col gap-4 p-5 lg:p-7">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">New query</h2>
                <p className="mt-1 text-sm text-slate-500">Only you and the selected recipient can see this conversation.</p>
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Recipient
                <select
                  required
                  value={recipientId}
                  onChange={(event) => setRecipientId(event.target.value)}
                  className="rounded border border-slate-300 bg-white px-3 py-2.5 font-normal"
                >
                  <option value="">Select a recipient</option>
                  {recipients.map((recipient) => (
                    <option key={recipient._id} value={recipient._id}>
                      {recipient.name} · {recipient.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Subject
                <input
                  required
                  maxLength={120}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="rounded border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="grid flex-1 gap-1.5 text-sm font-medium text-slate-700">
                Message
                <textarea
                  required
                  maxLength={4000}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="min-h-36 flex-1 resize-y rounded border border-slate-300 px-3 py-2.5 font-normal"
                />
              </label>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !recipients.length}
                  className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <FaPaperPlane size={12} /> {sending ? "Sending..." : "Send query"}
                </button>
              </div>
            </form>
          ) : activeQuery ? (
            <>
              <header className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-900">{activeQuery.subject}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {otherParticipant?.name || "Participant"} · {otherParticipant?.role || ""}
                </p>
              </header>
              <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 lg:p-6">
                {messages.map((message) => {
                  const isOwnMessage = message.sender?._id === userId;
                  return (
                    <div key={message._id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                      <article className={`max-w-[85%] rounded px-4 py-3 shadow-sm sm:max-w-[70%] ${isOwnMessage ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                        <p className={`mb-1 text-xs font-semibold ${isOwnMessage ? "text-teal-100" : "text-slate-500"}`}>
                          {isOwnMessage ? "You" : message.sender?.name || "Participant"}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                        <p className={`mt-2 text-right text-[11px] ${isOwnMessage ? "text-teal-100" : "text-slate-400"}`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </article>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="flex items-end gap-3 border-t border-slate-200 p-4">
                <textarea
                  aria-label="Write a message"
                  maxLength={4000}
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  className="min-h-11 flex-1 resize-y rounded border border-slate-300 px-3 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={sending || !draft.trim()}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <FaEnvelope className="mb-4 text-3xl text-teal-700" />
              <h2 className="font-semibold text-slate-800">Select a conversation</h2>
              <p className="mt-1 text-sm text-slate-500">Messages are private to the people in each query.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Queries;