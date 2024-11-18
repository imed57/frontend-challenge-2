import { useState, useEffect, useRef, useCallback } from "react";
import Core from "@landbot/core";
import type { Message } from "@landbot/core/dist/src/types";

interface ChatMessage {
  key: string;
  text?: string;
  author: "bot" | "user";
  timestamp: number;
  type: string;
}

const TerminalChat = () => {
  const [messages, setMessages] = useState<Record<string, ChatMessage>>({});
  const [input, setInput] = useState("");
  const [config, setConfig] = useState(null);
  const core = useRef<Core | null>(null);

  useEffect(() => {
    fetch("https://landbot.online/v3/H-2684100-OBIBIYP4D4991XSV/index.json")
      .then((res) => res.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (config) {
      core.current = new Core(config);
      core.current.pipelines.$readableSequence.subscribe((data: Message) => {
        setMessages((messages) => ({
          ...messages,
          [data.key]: parseMessage(data),
        }));
      });

      core.current.init().then((data) => {
        setMessages(parseMessages(data.messages));
      });
    }
  }, [config]);

  useEffect(() => {
    const container = document.getElementById("terminal-messages-container");
    scrollBottom(container);
  }, [messages]);

  const submit = useCallback(() => {
    if (input !== "" && core.current) {
      core.current.sendMessage({ message: input });
      setInput("");
    }
  }, [input]);

  return (
    <section id="terminal-chat">
      <div className="terminal-container">
        <div className="terminal-header">
          <span className="terminal-title">AWS Terminal</span>
        </div>

        <div
          className="terminal-messages-container"
          id="terminal-messages-container"
        >
          {Object.values(messages)
            .filter(messagesFilter)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((message) => (
              <div
                className="terminal-message"
                data-author={message.author}
                key={message.key}
              >
                <span className="terminal-prompt">
                  {message.author === "user" ? "$ " : "[bot] "}
                </span>
                <span className="terminal-text">{message.text}</span>
              </div>
            ))}
        </div>

        <div className="terminal-input-container">
          <span className="terminal-prompt">$ </span>
          <input
            className="terminal-input"
            onChange={(e) => setInput(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type your command..."
            type="text"
            value={input}
          />
        </div>
      </div>
    </section>
  );
};

function parseMessage(data: Message): ChatMessage {
  return {
    key: data.key,
    text: data.title || data.message || data.rich_text,
    author: data.samurai !== undefined ? "bot" : "user",
    timestamp: data.timestamp,
    type: data.type,
  };
}

function parseMessages(
  messages: Record<string, Message>
): Record<string, ChatMessage> {
  return Object.values(messages).reduce((obj, next) => {
    obj[next.key] = parseMessage(next);
    return obj;
  }, {} as Record<string, ChatMessage>);
}

function messagesFilter(data: ChatMessage) {
  return ["text", "dialog"].includes(data.type);
}

function scrollBottom(container: HTMLElement | null) {
  if (container) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }
}

export default TerminalChat;
