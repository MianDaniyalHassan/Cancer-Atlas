"use client";

import { useEffect, useRef, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import HealthDot from "../components/HealthDot";
import ThemeToggle from "../components/ThemeToggle";
import type { Message, Session } from "./types";
import "./chat.css";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STORAGE_KEY = "cancer-atlas-sessions";

const SUGGESTIONS = [
  "What are common symptoms of lung cancer?",
  "How is stage III colon cancer treated?",
  "What are common side effects of chemotherapy?",
  "What is the global incidence of prostate cancer?",
];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createSession(): Session {
  return { id: uid(), title: "", messages: [], createdAt: Date.now() };
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let loaded: Session[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as Session[];
    } catch {
      loaded = [];
    }

    if (!Array.isArray(loaded) || loaded.length === 0) {
      const fresh = createSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(loaded);
      setActiveSessionId(loaded[0].id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      /* storage unavailable */
    }
  }, [sessions, hydrated]);

  useEffect(() => {
    try {
      if (localStorage.getItem("cancer-atlas-sidebar-collapsed") === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function updateMessage(
    sessionId: string,
    messageId: string,
    updater: (message: Message) => Message,
  ) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              messages: session.messages.map((message) =>
                message.id !== messageId ? message : updater(message),
              ),
            },
      ),
    );
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("cancer-atlas-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  function handleNew() {
    const fresh = createSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setInput("");
    setSidebarOpen(false);
  }

  function handleSelect(id: string) {
    setActiveSessionId(id);
    setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (id === activeSessionId) setActiveSessionId(remaining[0].id);
      return remaining;
    });
  }

  async function send(explicit?: string) {
    const text = (explicit ?? input).trim();
    if (!text || isStreaming || !activeSessionId) return;

    const sessionId = activeSessionId;
    const userMessage: Message = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setInput("");
    setIsStreaming(true);
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        const isFirstUserMessage = !session.messages.some(
          (m) => m.role === "user",
        );
        return {
          ...session,
          title: isFirstUserMessage ? text.slice(0, 40) : session.title,
          messages: [...session.messages, userMessage, assistantMessage],
        };
      }),
    );

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        let detail = `Request failed (${res.status})`;
        try {
          const err = await res.json();
          if (err?.detail) detail = err.detail;
        } catch {
          /* ignore */
        }
        updateMessage(sessionId, assistantId, (m) => ({
          ...m,
          variant: "error",
          content: `Error: ${detail}`,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const line = rawEvent.trim();
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;

          let data: {
            type?: string;
            value?: string;
            sources?: string[];
          };
          try {
            data = JSON.parse(payload);
          } catch {
            continue;
          }

          if (data.type === "source") {
            const v = data.value;
            if (
              v === "clarify" ||
              v === "personal_advice" ||
              v === "out_of_scope"
            ) {
              updateMessage(sessionId, assistantId, (m) => ({
                ...m,
                variant: v,
              }));
            } else if (
              v === "local" &&
              Array.isArray(data.sources) &&
              data.sources.length
            ) {
              const sources = data.sources.filter(Boolean);
              updateMessage(sessionId, assistantId, (m) => ({ ...m, sources }));
            }
          } else if (data.type === "token") {
            const chunk = data.value ?? "";
            updateMessage(sessionId, assistantId, (m) => ({
              ...m,
              content: m.content + chunk,
            }));
          } else if (data.type === "error") {
            const detail = data.value ?? "unknown error";
            updateMessage(sessionId, assistantId, (m) => ({
              ...m,
              variant: "error",
              content: `${m.content}${m.content ? "\n" : ""}[Stream error] ${detail}`,
            }));
          } else if (data.type === "done") {
            finished = true;
          }
        }
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      updateMessage(sessionId, assistantId, (m) => ({
        ...m,
        variant: "error",
        content: `${m.content}${m.content ? "\n" : ""}Connection error: ${detail}`,
      }));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <ChatSidebar
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main">
        <div className="chat-header">
          <div className="hh">
            <button
              className="collapse-btn"
              onClick={toggleSidebarCollapsed}
              aria-label={sidebarCollapsed ? "Show chat history" : "Hide chat history"}
              title={sidebarCollapsed ? "Show chat history" : "Hide chat history"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sessions"
            >
              ☰
            </button>
            <div className="wordmark">
              Cancer<b>Atlas</b>
            </div>
            <div className="status">Evidence-grounded cancer information</div>
          </div>
          <div className="header-right">
            <HealthDot />
            <ThemeToggle />
          </div>
        </div>

        <div className="messages" ref={messagesRef}>
          {messages.length === 0 ? (
            <div className="empty">
              <h2>Ask about cancer. Understand the evidence.</h2>
              <div className="chips">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="chip"
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => send()}
          disabled={isStreaming}
        />
      </div>
    </>
  );
}
