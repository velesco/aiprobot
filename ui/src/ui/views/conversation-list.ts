import { html, nothing, type TemplateResult } from "lit";
import type { GatewaySessionRow } from "../types";
import { icons } from "../icons";

export type ConversationListProps = {
  sessions: GatewaySessionRow[];
  activeSessionKey: string | null;
  searchQuery: string;
  channelFilter: string | null;
  loading: boolean;
  onSessionSelect: (key: string) => void;
  onSearchChange: (query: string) => void;
  onChannelFilterChange: (channel: string | null) => void;
  onRefresh: () => void;
};

// Map surface names to icons
const channelIcons: Record<string, TemplateResult> = {
  whatsapp: icons.whatsapp,
  telegram: icons.telegram,
  discord: icons.discord,
  slack: icons.slack,
  signal: icons.signal,
  imessage: icons.imessage,
  googlechat: icons.googlechat,
  matrix: icons.matrix,
  nostr: icons.nostr,
  web: icons.web,
};

// Channel display names
const channelNames: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
  signal: "Signal",
  imessage: "iMessage",
  googlechat: "Google Chat",
  matrix: "Matrix",
  nostr: "Nostr",
  web: "Web",
};

function getChannelIcon(surface?: string): TemplateResult {
  if (!surface) return icons.messageSquare;
  const normalized = surface.toLowerCase();
  return channelIcons[normalized] ?? icons.messageSquare;
}

function getChannelName(surface?: string): string {
  if (!surface) return "";
  const normalized = surface.toLowerCase();
  return channelNames[normalized] ?? surface;
}

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDisplayName(session: GatewaySessionRow): string {
  // Priority: label > displayName > subject > room > key
  if (session.label) return session.label;
  if (session.displayName) return session.displayName;
  if (session.subject) return session.subject;
  if (session.room) return session.room;
  // For key, try to extract a readable name
  const keyParts = session.key.split(":");
  return keyParts[keyParts.length - 1] || session.key;
}

function getSessionKindIcon(kind: string): TemplateResult {
  switch (kind) {
    case "group":
      return icons.users;
    case "direct":
      return icons.user;
    default:
      return icons.messageSquare;
  }
}

function truncateMessage(message: string | undefined, maxLength = 40): string {
  if (!message) return "";
  const cleaned = message.replace(/\n/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 1) + "…";
}

function getMessagePreview(session: GatewaySessionRow): string {
  if (session.isTyping) return "typing...";
  if (session.lastMessage) {
    const prefix = session.lastMessageRole === "assistant" ? "AI: " : "";
    return prefix + truncateMessage(session.lastMessage);
  }
  // Fallback: show useful context about the session
  if (session.surface) {
    const channelName = getChannelName(session.surface);
    if (session.kind === "group") {
      return `${channelName} · Group`;
    }
    return channelName;
  }
  // Show model if available
  if (session.model) {
    return session.model;
  }
  // Show token count if available
  if (session.totalTokens && session.totalTokens > 0) {
    return `${session.totalTokens.toLocaleString()} tokens`;
  }
  // Empty fallback - cleaner than showing "Direct"
  return "";
}

function filterSessions(
  sessions: GatewaySessionRow[],
  searchQuery: string,
  channelFilter: string | null,
): GatewaySessionRow[] {
  let filtered = sessions;

  // Filter by channel
  if (channelFilter) {
    filtered = filtered.filter(
      (s) => s.surface?.toLowerCase() === channelFilter.toLowerCase(),
    );
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((s) => {
      const name = getDisplayName(s).toLowerCase();
      const surface = (s.surface ?? "").toLowerCase();
      const lastMsg = (s.lastMessage ?? "").toLowerCase();
      return name.includes(query) || surface.includes(query) || lastMsg.includes(query);
    });
  }

  // Sort: unread first, then by updatedAt (most recent first)
  return filtered.sort((a, b) => {
    // Unread messages first
    const aUnread = a.unreadCount ?? 0;
    const bUnread = b.unreadCount ?? 0;
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;

    // Then by time
    const aTime = a.updatedAt ?? 0;
    const bTime = b.updatedAt ?? 0;
    return bTime - aTime;
  });
}

function getUniqueChannels(sessions: GatewaySessionRow[]): string[] {
  const channels = new Set<string>();
  for (const session of sessions) {
    if (session.surface) {
      channels.add(session.surface.toLowerCase());
    }
  }
  return Array.from(channels).sort();
}

function renderOnlineIndicator(session: GatewaySessionRow): TemplateResult {
  const isOnline = session.isOnline ?? false;
  const statusClass = isOnline ? "conversation-item__status--online" : "conversation-item__status--offline";
  const statusTitle = isOnline ? "Online" : "Offline";

  return html`
    <span
      class="conversation-item__status ${statusClass}"
      title="${statusTitle}"
    ></span>
  `;
}

function renderUnreadBadge(count: number | undefined): TemplateResult {
  if (!count || count <= 0) return nothing as unknown as TemplateResult;

  const displayCount = count > 99 ? "99+" : String(count);

  return html`
    <span class="conversation-item__unread">${displayCount}</span>
  `;
}

function renderConversationItem(
  session: GatewaySessionRow,
  isActive: boolean,
  onSelect: () => void,
): TemplateResult {
  const displayName = getDisplayName(session);
  const channelIcon = getChannelIcon(session.surface);
  const kindIcon = getSessionKindIcon(session.kind);
  const relativeTime = formatRelativeTime(session.updatedAt);
  const messagePreview = getMessagePreview(session);
  const hasUnread = (session.unreadCount ?? 0) > 0;

  return html`
    <button
      class="conversation-item ${isActive ? "conversation-item--active" : ""} ${hasUnread ? "conversation-item--unread" : ""}"
      @click=${onSelect}
      type="button"
      title="${displayName}"
    >
      <div class="conversation-item__avatar">
        <span class="conversation-item__avatar-icon">${kindIcon}</span>
        <span class="conversation-item__channel-badge">${channelIcon}</span>
        ${renderOnlineIndicator(session)}
      </div>
      <div class="conversation-item__content">
        <div class="conversation-item__header">
          <span class="conversation-item__name">${displayName}</span>
          <span class="conversation-item__time ${hasUnread ? "conversation-item__time--unread" : ""}">${relativeTime}</span>
        </div>
        <div class="conversation-item__preview">
          <span class="conversation-item__message ${session.isTyping ? "conversation-item__message--typing" : ""}">${messagePreview}</span>
          ${renderUnreadBadge(session.unreadCount)}
        </div>
      </div>
    </button>
  `;
}

function renderChannelTabs(
  channels: string[],
  activeFilter: string | null,
  onFilterChange: (channel: string | null) => void,
  sessions: GatewaySessionRow[],
): TemplateResult {
  // Count unread per channel
  const unreadByChannel: Record<string, number> = {};
  let totalUnread = 0;
  for (const session of sessions) {
    const count = session.unreadCount ?? 0;
    if (count > 0) {
      totalUnread += count;
      const channel = session.surface?.toLowerCase() ?? "unknown";
      unreadByChannel[channel] = (unreadByChannel[channel] ?? 0) + count;
    }
  }

  return html`
    <div class="conversation-list__tabs">
      <button
        class="conversation-list__tab ${activeFilter === null ? "conversation-list__tab--active" : ""}"
        @click=${() => onFilterChange(null)}
        type="button"
      >
        All
        ${totalUnread > 0
          ? html`<span class="conversation-list__tab-badge">${totalUnread > 99 ? "99+" : totalUnread}</span>`
          : nothing}
      </button>
      ${channels.map((channel) => {
        const channelUnread = unreadByChannel[channel] ?? 0;
        return html`
          <button
            class="conversation-list__tab ${activeFilter === channel ? "conversation-list__tab--active" : ""}"
            @click=${() => onFilterChange(channel)}
            type="button"
            title=${getChannelName(channel)}
          >
            <span class="conversation-list__tab-icon">${getChannelIcon(channel)}</span>
            ${channelUnread > 0
              ? html`<span class="conversation-list__tab-badge">${channelUnread > 99 ? "99+" : channelUnread}</span>`
              : nothing}
          </button>
        `;
      })}
    </div>
  `;
}

export function renderConversationList(props: ConversationListProps): TemplateResult {
  const channels = getUniqueChannels(props.sessions);
  const filteredSessions = filterSessions(
    props.sessions,
    props.searchQuery,
    props.channelFilter,
  );

  return html`
    <div class="conversation-list">
      <div class="conversation-list__header">
        <div class="conversation-list__search">
          <span class="conversation-list__search-icon">${icons.search}</span>
          <input
            type="text"
            class="conversation-list__search-input"
            placeholder="Search conversations..."
            .value=${props.searchQuery}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              props.onSearchChange(target.value);
            }}
          />
        </div>
        <button
          class="conversation-list__refresh"
          @click=${props.onRefresh}
          type="button"
          title="Refresh conversations"
          ?disabled=${props.loading}
        >
          ${props.loading ? icons.loader : icons.radio}
        </button>
      </div>

      ${channels.length > 1
        ? renderChannelTabs(channels, props.channelFilter, props.onChannelFilterChange, props.sessions)
        : nothing}

      <div class="conversation-list__items">
        ${props.loading && filteredSessions.length === 0
          ? html`<div class="conversation-list__loading">
              ${icons.loader} Loading conversations...
            </div>`
          : nothing}

        ${filteredSessions.length === 0 && !props.loading
          ? html`<div class="conversation-list__empty">
              ${props.searchQuery || props.channelFilter
                ? "No conversations match your filters"
                : "No conversations yet"}
            </div>`
          : nothing}

        ${filteredSessions.map((session) =>
          renderConversationItem(
            session,
            session.key === props.activeSessionKey,
            () => props.onSessionSelect(session.key),
          ),
        )}
      </div>
    </div>
  `;
}
