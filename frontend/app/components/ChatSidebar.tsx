"use client";

import type { Session } from "../chat/types";
import ThemeToggle from "./ThemeToggle";

interface ChatSidebarProps {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  open: boolean;
  collapsed: boolean;
}

export default function ChatSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  open,
  collapsed,
}: ChatSidebarProps) {
  return (
    <aside className={`sidebar${open ? " open" : ""}${collapsed ? " collapsed" : ""}`}>
      <div className="side-top">
        <div className="side-logo">
          Cancer<b>Atlas</b>
        </div>
        <button
          className="side-close"
          onClick={onClose}
          aria-label="Close chat history"
          title="Close"
        >
          ✕
        </button>
      </div>
      <button className="new-chat" onClick={onNew}>
        ＋ New chat
      </button>
      <div className="session-label">This session</div>
      <div className="session-list">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session${session.id === activeId ? " active" : ""}`}
            onClick={() => onSelect(session.id)}
          >
            <span className="txt">{session.title || "New chat"}</span>
            <button
              className="del"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="side-foot">
        <ThemeToggle />
      </div>
    </aside>
  );
}
