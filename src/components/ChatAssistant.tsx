import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { supabase } from "../lib/supabase";
import "./ChatAssistant.css";

type Message = { role: "user" | "assistant"; content: string };
const destinations = [
  ["Packages", "/#packages"], ["How it works", "/#how-it-works"], ["Portfolio", "/portfolio"],
  ["Book now", "/book"], ["My bookings", "/client/bookings"], ["My galleries", "/client/galleries"],
  ["Log in", "/login"], ["Contact", "/#contact"],
];

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, busy, error, open]);

  useEffect(() => {
    const field = inputRef.current;
    if (field) {
      field.style.height = "auto";
      field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
    }
  }, [input, open]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || text.length > 1000) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setBusy(true); setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("chat-assistant", { body: { messages: next.slice(-10) } });
      if (invokeError || typeof data?.message !== "string") throw new Error("unavailable");
      setMessages((current) => [...current, { role: "assistant", content: data.message }]);
    } catch { setError("Sorry, chat is unavailable or busy. Please try again later."); }
    finally { setBusy(false); }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return <div className="chat-widget">
    {open && <section className="chat-panel" aria-label="SNAPSMART assistant">
      <header><div><strong>SNAPSMART Assistant</strong><small>AI-powered · General inquiries</small></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></header>
      <div className="chat-messages" ref={messagesRef} aria-live="polite">
        <p className="chat-bubble assistant">Hi! Ask me about our packages, booking process, or how to use SNAPSMART. Please don't share passwords or verification codes.</p>
        {messages.map((message, index) => <p className={`chat-bubble ${message.role}`} key={index}>{message.role === "assistant" ? message.content.replace(/\*\*/g, "") : message.content}</p>)}
        {busy && <p className="chat-bubble assistant">Thinking…</p>}
        {error && <p className="chat-error" role="alert">{error}</p>}
      </div>
      <nav className="chat-links" aria-label="Quick navigation">{destinations.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav>
      <form onSubmit={send}><textarea ref={inputRef} rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} maxLength={1000} placeholder="Ask a question..." aria-label="Your message" disabled={busy} /><button type="submit" disabled={busy || !input.trim()}>Send</button></form>
      <small className="chat-disclaimer">AI can make mistakes. Confirm important details with the studio.</small>
    </section>}
    <button type="button" className="chat-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close chat" : "Open chat assistant"}>{open ? "×" : "✦"}</button>
  </div>;
}
