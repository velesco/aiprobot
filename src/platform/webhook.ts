/**
 * AIPro Platform Webhook
 *
 * Sends message events to the AIPro Platform for analytics and tracking.
 * This is built into the gateway and triggered by message hooks.
 *
 * Configuration:
 * - Environment: AIPRO_PLATFORM_WEBHOOK_URL, AIPRO_GATEWAY_TOKEN
 * - Config file: platform.webhookUrl in aipro.json
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// Try to read webhook URL from separate platform config file
function getConfigWebhookUrl(): string | undefined {
  try {
    // Read from separate platform.json file to avoid aiprobot config validation
    const configPath = join(homedir(), ".aipro", "platform.json");
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      return config?.webhookUrl;
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

const PLATFORM_WEBHOOK_URL = process.env.AIPRO_PLATFORM_WEBHOOK_URL || getConfigWebhookUrl();
const GATEWAY_TOKEN = process.env.AIPRO_GATEWAY_TOKEN;

export interface PlatformMessagePayload {
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

/**
 * Check if platform sync is enabled
 */
export function isPlatformSyncEnabled(): boolean {
  return Boolean(PLATFORM_WEBHOOK_URL && GATEWAY_TOKEN);
}

/**
 * Send a message to the platform webhook
 */
export async function sendToPlatformWebhook(
  payload: Omit<PlatformMessagePayload, "gatewayToken">,
): Promise<void> {
  if (!PLATFORM_WEBHOOK_URL || !GATEWAY_TOKEN) {
    return;
  }

  const fullPayload: PlatformMessagePayload = {
    ...payload,
    gatewayToken: GATEWAY_TOKEN,
  };

  try {
    const response = await fetch(PLATFORM_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullPayload),
    });

    if (!response.ok) {
      console.error(`[platform-webhook] Failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Silent fail - don't break message flow
    console.error(`[platform-webhook] Error:`, error);
  }
}

/**
 * Generate a stable session ID from channel and conversation ID
 */
export function generatePlatformSessionId(channelId: string, conversationId: string): string {
  // Simple hash-like ID
  const key = `${channelId}:${conversationId}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
