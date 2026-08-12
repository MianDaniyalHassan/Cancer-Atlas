export type MessageVariant = "clarify" | "personal_advice" | "out_of_scope" | "error";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  variant?: MessageVariant;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}
