import type { Message } from "../chat/types";
import SourcePill from "./SourcePill";

export default function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return <div className="msg-user">{message.content}</div>;
  }

  const variantClass =
    message.variant === "personal_advice"
      ? " msg-warning"
      : message.variant === "out_of_scope"
        ? " msg-decline"
        : message.variant === "clarify"
          ? " msg-clarify"
          : message.variant === "error"
            ? " msg-error"
            : "";

  return (
    <div className={`msg-bot${variantClass}`}>
      <div className="glyph">C</div>
      <div className="msg-bot-body">
        <div className="msg-bot-content">{message.content}</div>
        {!message.variant && message.sources && message.sources.length > 0 && (
          <div className="sources">
            {message.sources.map((source) => (
              <SourcePill key={source} filename={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
