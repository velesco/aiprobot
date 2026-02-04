#!/usr/bin/env node
/**
 * Auto-Compress Session Context
 * Rulează periodic pentru a comprima istoricul sesiunilor
 * și a crea sumare pentru acces rapid
 */

const fs = require("fs");
const path = require("path");
const { compress } = require("./gemini-compressor.cjs");

// Detect environment and set paths accordingly
const isDocker = process.env.AIPRO_DOCKER === "true" || fs.existsSync("/home/node/aipro");
const homeDir = isDocker ? "/home/node" : process.env.HOME || "/home/ubuntu";
const baseDir = isDocker ? "/home/node/aipro" : path.join(homeDir, "aiprobot");

const SESSIONS_DIR = path.join(homeDir, ".aipro/agents/main/sessions");
const SUMMARIES_DIR = path.join(baseDir, "client-summaries");
const MAX_TOKENS_BEFORE_COMPRESS = 15000; // ~60K chars

/**
 * Parse session JSONL file
 */
function parseSessionFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const messages = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "message" && entry.message?.content) {
          const role = entry.message.role || "unknown";
          let text = "";

          if (Array.isArray(entry.message.content)) {
            text = entry.message.content
              .filter((c) => c.type === "text")
              .map((c) => c.text)
              .join(" ");
          } else if (typeof entry.message.content === "string") {
            text = entry.message.content;
          }

          if (text) {
            messages.push({
              role,
              text: text.substring(0, 2000), // Limit per message
              timestamp: entry.timestamp,
            });
          }
        }
      } catch (e) {
        // Skip malformed lines
      }
    }

    return messages;
  } catch (e) {
    console.error(`Error parsing ${filepath}:`, e.message);
    return [];
  }
}

/**
 * Extract client ID from session key
 */
function extractClientId(sessionKey) {
  // Format: agent:main:whatsapp:dm:+40729229599
  const match = sessionKey.match(/\+\d+/);
  return match ? match[0] : null;
}

/**
 * Compress a session's history
 */
async function compressSession(sessionFile) {
  const messages = parseSessionFile(sessionFile);
  if (messages.length === 0) return null;

  // Build context string
  const context = messages.map((m) => `[${m.role}] ${m.text}`).join("\n\n");

  const estimatedTokens = Math.ceil(context.length / 4);
  console.log(`Session has ~${estimatedTokens} tokens`);

  if (estimatedTokens < MAX_TOKENS_BEFORE_COMPRESS) {
    console.log("No compression needed");
    return null;
  }

  console.log("Compressing...");
  const result = await compress(
    context,
    "Creează un sumar al conversației cu punctele cheie: decizii, numere, date importante, preferințe client",
    { targetTokens: 2000, maxPoints: 20 },
  );

  return {
    originalTokens: result.originalTokens,
    compressedTokens: result.compressedTokens,
    summary: result.compressed,
    messagesCount: messages.length,
    lastMessage: messages[messages.length - 1]?.timestamp,
  };
}

/**
 * Process all sessions and create client summaries
 */
async function processAllSessions() {
  // Ensure summaries directory exists
  if (!fs.existsSync(SUMMARIES_DIR)) {
    fs.mkdirSync(SUMMARIES_DIR, { recursive: true });
  }

  const sessionFiles = fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => path.join(SESSIONS_DIR, f));

  console.log(`Found ${sessionFiles.length} session files`);

  const results = [];

  for (const sessionFile of sessionFiles.slice(0, 10)) {
    // Limit for testing
    console.log(`\nProcessing: ${path.basename(sessionFile)}`);

    try {
      const result = await compressSession(sessionFile);
      if (result) {
        results.push({
          session: path.basename(sessionFile),
          ...result,
        });
      }
    } catch (e) {
      console.error(`Error processing ${sessionFile}:`, e.message);
    }
  }

  // Save results
  const summaryFile = path.join(SUMMARIES_DIR, `batch-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  console.log(`\nSaved summaries to ${summaryFile}`);

  return results;
}

/**
 * Get or create client summary
 */
async function getClientSummary(clientId) {
  const summaryFile = path.join(SUMMARIES_DIR, `${clientId}.json`);

  if (fs.existsSync(summaryFile)) {
    const stat = fs.statSync(summaryFile);
    const ageHours = (Date.now() - stat.mtimeMs) / 1000 / 60 / 60;

    if (ageHours < 24) {
      // Use cached summary
      return JSON.parse(fs.readFileSync(summaryFile, "utf-8"));
    }
  }

  // Need to generate new summary
  // Find session file for this client
  const sessionFiles = fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.includes(clientId.replace("+", "")));

  if (sessionFiles.length === 0) {
    return { summary: "Nicio conversație anterioară.", tokens: 0 };
  }

  const latestSession = path.join(SESSIONS_DIR, sessionFiles[sessionFiles.length - 1]);
  const result = await compressSession(latestSession);

  if (result) {
    fs.writeFileSync(summaryFile, JSON.stringify(result, null, 2));
    return result;
  }

  return { summary: "Context insuficient pentru sumar.", tokens: 0 };
}

// Export
module.exports = {
  compressSession,
  processAllSessions,
  getClientSummary,
  parseSessionFile,
};

// CLI
if (require.main === module) {
  const cmd = process.argv[2];

  if (cmd === "all") {
    processAllSessions()
      .then((results) => {
        console.log(`\n=== DONE ===`);
        console.log(`Processed ${results.length} sessions`);
      })
      .catch((err) => console.error("Error:", err));
  } else if (cmd === "client" && process.argv[3]) {
    getClientSummary(process.argv[3])
      .then((result) => {
        console.log("\n=== CLIENT SUMMARY ===");
        console.log(JSON.stringify(result, null, 2));
      })
      .catch((err) => console.error("Error:", err));
  } else {
    console.log("Usage:");
    console.log("  node auto-compress.js all              # Process all sessions");
    console.log("  node auto-compress.js client +40729... # Get client summary");
  }
}
