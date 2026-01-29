import { html, nothing } from "lit";
import type { GatewaySessionRow } from "../types";
import { renderConversationList, type ConversationListProps } from "./conversation-list";
import { renderChat, type ChatProps } from "./chat";

export type ChatWithConversationsProps = ChatProps & {
  // Conversation list specific props
  conversationSearchQuery: string;
  conversationChannelFilter: string | null;
  conversationsLoading: boolean;
  onConversationSearchChange: (query: string) => void;
  onConversationChannelFilterChange: (channel: string | null) => void;
  onConversationsRefresh: () => void;
  // Optional: hide conversations sidebar (for focus mode or mobile)
  hideConversations?: boolean;
  // Sidebar width (for resizing)
  conversationSidebarWidth?: number;
  onConversationSidebarWidthChange?: (width: number) => void;
};

// Default sidebar width
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 450;

function clampWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

function renderResizeHandle(
  onWidthChange?: (width: number) => void,
  currentWidth?: number,
) {
  if (!onWidthChange) return nothing;

  let isDragging = false;
  let startX = 0;
  let startWidth = currentWidth ?? DEFAULT_SIDEBAR_WIDTH;

  const handleMouseDown = (e: MouseEvent) => {
    isDragging = true;
    startX = e.clientX;
    startWidth = currentWidth ?? DEFAULT_SIDEBAR_WIDTH;

    const handle = e.target as HTMLElement;
    handle.classList.add("chat-whatsapp-layout__resize-handle--dragging");

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return;
      const delta = moveEvent.clientX - startX;
      const newWidth = clampWidth(startWidth + delta);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDragging = false;
      handle.classList.remove("chat-whatsapp-layout__resize-handle--dragging");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return html`
    <div
      class="chat-whatsapp-layout__resize-handle"
      @mousedown=${handleMouseDown}
      title="Drag to resize"
    ></div>
  `;
}

export function renderChatWithConversations(props: ChatWithConversationsProps) {
  const sessions: GatewaySessionRow[] = props.sessions?.sessions ?? [];

  // In focus mode or when explicitly hidden, render only the chat
  if (props.focusMode || props.hideConversations) {
    return renderChat(props);
  }

  const sidebarWidth = props.conversationSidebarWidth ?? DEFAULT_SIDEBAR_WIDTH;

  const conversationListProps: ConversationListProps = {
    sessions,
    activeSessionKey: props.sessionKey,
    searchQuery: props.conversationSearchQuery,
    channelFilter: props.conversationChannelFilter,
    loading: props.conversationsLoading,
    onSessionSelect: props.onSessionKeyChange,
    onSearchChange: props.onConversationSearchChange,
    onChannelFilterChange: props.onConversationChannelFilterChange,
    onRefresh: props.onConversationsRefresh,
  };

  return html`
    <div class="chat-whatsapp-layout">
      <div
        class="chat-whatsapp-layout__sidebar"
        style="width: ${sidebarWidth}px"
      >
        ${renderConversationList(conversationListProps)}
      </div>
      ${renderResizeHandle(props.onConversationSidebarWidthChange, sidebarWidth)}
      <div class="chat-whatsapp-layout__main">
        ${renderChat(props)}
      </div>
    </div>
  `;
}
