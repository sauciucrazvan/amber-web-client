// Context
export { ChatProvider, useChat } from "./context/ChatContext";
export type { ActiveChat } from "./context/ChatContext";

// Components
export { default as ChatBubble } from "./components/ChatBubble";
export { default as ConversationPanel } from "./components/ConversationPanel";

// Hooks
export { useConversationLogic } from "./hooks/useConversationLogic";
export { useConversationData } from "./hooks/useConversationData";
export { useConversationComposer } from "./hooks/useConversationComposer";
export { useConversationRealtime } from "./hooks/useConversationRealtime";

// Types
export type { MessageItem, AccountMe, MarkSeenResponse } from "./types";

// Utils
export { readErrorMessage } from "./errors";
