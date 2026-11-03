import { useState } from "react";
import "./ChatbotWidget.css";

interface ChatMessage {
  id: number;
  sender: "bot" | "user";
  text: string;
}

const defaultMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "bot",
    text: "Hi! I’m SNAPSMART Assistant. How can I help you today?",
  },
];

const quickQuestions = [
  "How do I book a session?",
  "What packages are available?",
  "How much is the down payment?",
  "How can I view my gallery?",
];

function getBotReply(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("book") ||
    lowerMessage.includes("booking") ||
    lowerMessage.includes("session")
  ) {
    return "To book a session, go to the Book Now page, choose your package, enter your event details, sign the agreement, and upload your payment proof for verification.";
  }

  if (
    lowerMessage.includes("package") ||
    lowerMessage.includes("packages") ||
    lowerMessage.includes("price") ||
    lowerMessage.includes("rate")
  ) {
    return "SNAPSMART offers photo coverage, photo and video coverage, and soft-copy packages. You can view the package details on the homepage or booking page.";
  }

  if (
    lowerMessage.includes("payment") ||
    lowerMessage.includes("down") ||
    lowerMessage.includes("proof") ||
    lowerMessage.includes("gcash") ||
    lowerMessage.includes("bank")
  ) {
    return "A down payment is required to secure your booking. After uploading your proof of payment, the admin will verify it before confirming your booking.";
  }

  if (
    lowerMessage.includes("gallery") ||
    lowerMessage.includes("photo") ||
    lowerMessage.includes("photos") ||
    lowerMessage.includes("download")
  ) {
    return "Once your event photos are ready, your secured gallery will appear in the My Galleries page of your client portal.";
  }

  if (
    lowerMessage.includes("status") ||
    lowerMessage.includes("confirmed") ||
    lowerMessage.includes("pending")
  ) {
    return "You can check your booking status in the My Bookings page. Statuses may include pending, awaiting payment verification, confirmed, completed, cancelled, or payment insufficient.";
  }

  if (
    lowerMessage.includes("walk") ||
    lowerMessage.includes("walk-in") ||
    lowerMessage.includes("walk in")
  ) {
    return "Walk-in bookings can be created by the admin. Clients can later access their booking records using the email associated with the booking.";
  }

  return "Thanks for your message! For now, this is a mock AI assistant. In the final system, I can answer booking, payment, package, schedule, and gallery questions automatically.";
}

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [inputValue, setInputValue] = useState("");

  const sendMessage = (messageText: string) => {
    const cleanedMessage = messageText.trim();

    if (!cleanedMessage) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanedMessage,
    };

    const botMessage: ChatMessage = {
      id: Date.now() + 1,
      sender: "bot",
      text: getBotReply(cleanedMessage),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      botMessage,
    ]);

    setInputValue("");
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <section className="chatbot-panel" aria-label="SNAPSMART AI Assistant">
          <div className="chatbot-header">
            <div>
              <span>AI Assistant</span>
              <h3>SNAPSMART Help</h3>
            </div>

            <button
              type="button"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.sender === "bot"
                    ? "chatbot-message bot"
                    : "chatbot-message user"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="chatbot-quick-questions">
            {quickQuestions.map((question) => (
              <button
                type="button"
                key={question}
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>

          <form className="chatbot-input-row" onSubmit={handleFormSubmit}>
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask about bookings, payments, or galleries..."
            />

            <button type="submit">Send</button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={isOpen ? "chatbot-toggle active" : "chatbot-toggle"}
        aria-label="Open SNAPSMART AI Assistant"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <span>AI</span>
      </button>
    </div>
  );
}

export default ChatbotWidget;