/**
 * AIPro Platform Sync Plugin
 *
 * Syncs messages to the AIPro Platform database via webhooks.
 * Hooks into message_received and message_sent events to forward
 * message data to the platform for analytics and conversation tracking.
 */

import type { AIProPluginApi } from "aipro/plugin-sdk";
import { createHash } from "node:crypto";

const PLATFORM_WEBHOOK_URL = process.env.AIPRO_PLATFORM_WEBHOOK_URL || "https://api.aipro.ro/webhooks/messages";
const GATEWAY_TOKEN = process.env.AIPRO_GATEWAY_TOKEN || "";

interface MessagePayload {
  gatewayToken: string;
  sessionId: string;
  sessionKey: string;
  role: "user" | "assistant";
  content: string;
  contentType?: string;
  timestamp: string;
  externalId?: string;
  displayName?: string;
  channel?: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  messageId?: string;
}

// Generate a stable session ID from channel + conversation
function generateSessionId(channelId: string, conversationId: string): string {
  const key = `${channelId}:${conversationId}`;
  return createHash("sha256").update(key).digest("hex").substring(0, 16);
}

async function sendToWebhook(payload: MessagePayload): Promise<void> {
  if (!GATEWAY_TOKEN) {
    return;
  }

  try {
    const response = await fetch(PLATFORM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[platform-sync] Webhook failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[platform-sync] Webhook error:`, error);
  }
}

const platformSyncPlugin = {
  id: "platform-sync",
  name: "Platform Sync",
  description: "Syncs messages to AIPro Platform",
  register(api: AIProPluginApi) {
    // Only activate if gateway token is configured
    if (!GATEWAY_TOKEN) {
      api.logger.info("[platform-sync] No AIPRO_GATEWAY_TOKEN configured, plugin disabled");
      return;
    }

    api.logger.info("[platform-sync] Plugin activated, syncing to " + PLATFORM_WEBHOOK_URL);

    // Hook into message_received events (user messages)
    api.on("message_received", async (event, ctx) => {
      const channelId = ctx.channelId || "unknown";
      const conversationId = ctx.conversationId || event.from || "";
      const sessionId = generateSessionId(channelId, conversationId);
      const sessionKey = `${channelId}:${conversationId}`;

      // Extract sender info from metadata
      const metadata = event.metadata || {};
      const displayName = (metadata.senderName as string) || (metadata.senderUsername as string) || undefined;

      await sendToWebhook({
        gatewayToken: GATEWAY_TOKEN,
        sessionId,
        sessionKey,
        role: "user",
        content: event.content,
        contentType: "text",
        timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
        externalId: event.from,
        displayName,
        channel: channelId,
        messageId: metadata.messageId as string | undefined,
      });
    });

    // Hook into message_sent events (assistant messages)
    api.on("message_sent", async (event, ctx) => {
      const channelId = ctx.channelId || "unknown";
      const conversationId = ctx.conversationId || event.to || "";
      const sessionId = generateSessionId(channelId, conversationId);
      const sessionKey = `${channelId}:${conversationId}`;

      await sendToWebhook({
        gatewayToken: GATEWAY_TOKEN,
        sessionId,
        sessionKey,
        role: "assistant",
        content: event.content,
        contentType: "text",
        timestamp: new Date().toISOString(),
        externalId: event.to,
        channel: channelId,
      });
    });
  },
};

export default platformSyncPlugin;
