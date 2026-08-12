"use client";

import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  }, [value]);

  const canSend = value.trim() !== "" && !disabled;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSubmit();
    }
  }

  return (
    <div className="input-area">
      <div className="input-inner">
        <div className={`input-wrap${focused ? " focused" : ""}`}>
          <div className="input-box">
            <textarea
              ref={ref}
              rows={1}
              placeholder="Ask about cancer…"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <button
              className="send"
              onClick={() => canSend && onSubmit()}
              disabled={!canSend}
            >
              ↑
            </button>
          </div>
        </div>
        <div className="input-note">
          CancerAtlas provides educational information only. Not medical advice.
        </div>
      </div>
    </div>
  );
}
