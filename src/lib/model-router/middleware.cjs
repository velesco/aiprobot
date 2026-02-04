#!/usr/bin/env node
/**
 * Model Router Middleware
 * Integrare în pipeline-ul principal AIPro
 *
 * Folosire: Se apelează automat când contextul depășește pragul
 */

const fs = require("fs");
const path = require("path");
const { compress, needsCompression } = require("./gemini-compressor.cjs");
const { getClientSummary } = require("./auto-compress.cjs");

// Detect environment and set paths accordingly
const isDocker = process.env.AIPRO_DOCKER === "true" || fs.existsSync("/home/node/aipro");
const baseDir = isDocker
  ? "/home/node/aipro"
  : path.join(process.env.HOME || "/home/ubuntu", "aiprobot");

const CONFIG = {
  enabled: true,
  compressionThreshold: 40000, // chars (~10K tokens)
  summaryMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  summariesDir: path.join(baseDir, "client-summaries"),
  logFile: path.join(baseDir, "logs", "model-router.log"),
};

/**
 * Log to file
 */
function log(message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    ...data,
  };

  try {
    fs.appendFileSync(CONFIG.logFile, JSON.stringify(entry) + "\n");
  } catch (e) {
    console.error("[ModelRouter] Log error:", e.message);
  }
}

/**
 * Pre-process context before sending to Claude
 * Returns compressed context if needed, otherwise original
 */
async function preProcess(context, query, clientId = null) {
  if (!CONFIG.enabled) {
    return { context, compressed: false };
  }

  const contextLength = context.length;

  if (!needsCompression(contextLength, CONFIG.compressionThreshold)) {
    log("Context OK, no compression needed", {
      contextLength,
      threshold: CONFIG.compressionThreshold,
    });
    return { context, compressed: false };
  }

  log("Compression needed", { contextLength, clientId });

  try {
    // Try to get cached summary first
    if (clientId) {
      const summaryFile = path.join(CONFIG.summariesDir, `${clientId}.json`);
      if (fs.existsSync(summaryFile)) {
        const stat = fs.statSync(summaryFile);
        if (Date.now() - stat.mtimeMs < CONFIG.summaryMaxAge) {
          const cached = JSON.parse(fs.readFileSync(summaryFile, "utf-8"));
          log("Using cached summary", { clientId, age: Date.now() - stat.mtimeMs });
          return {
            context: cached.summary + "\n\n---\nCONTEXT RECENT:\n" + context.slice(-10000),
            compressed: true,
            fromCache: true,
          };
        }
      }
    }

    // Compress with Gemini
    const startTime = Date.now();
    const result = await compress(context, query);
    const duration = Date.now() - startTime;

    log("Compression complete", {
      originalTokens: result.originalTokens,
      compressedTokens: result.compressedTokens,
      ratio: ((result.compressedTokens / result.originalTokens) * 100).toFixed(1) + "%",
      duration,
    });

    // Cache for client
    if (clientId) {
      const summaryFile = path.join(CONFIG.summariesDir, `${clientId}.json`);
      fs.writeFileSync(
        summaryFile,
        JSON.stringify(
          {
            summary: result.compressed,
            originalTokens: result.originalTokens,
            compressedTokens: result.compressedTokens,
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    }

    return {
      context: result.compressed,
      compressed: true,
      stats: {
        originalTokens: result.originalTokens,
        compressedTokens: result.compressedTokens,
        duration,
      },
    };
  } catch (e) {
    log("Compression error, using truncation", { error: e.message });
    // Fallback: truncate to last 15K chars
    return {
      context: context.slice(-15000),
      compressed: true,
      fallback: true,
      error: e.message,
    };
  }
}

/**
 * Enhance system prompt with client context
 */
async function enhancePrompt(systemPrompt, clientId) {
  if (!clientId) return systemPrompt;

  try {
    const summary = await getClientSummary(clientId);
    if (summary && summary.summary) {
      return `${systemPrompt}

---
CONTEXT CLIENT (sumar conversații anterioare):
${summary.summary}
---`;
    }
  } catch (e) {
    log("Error getting client summary", { clientId, error: e.message });
  }

  return systemPrompt;
}

/**
 * Full middleware pipeline
 */
async function processRequest(request) {
  const { systemPrompt, context, userMessage, clientId } = request;

  // Step 1: Enhance system prompt with client context
  const enhancedPrompt = await enhancePrompt(systemPrompt, clientId);

  // Step 2: Compress context if needed
  const {
    context: processedContext,
    compressed,
    stats,
  } = await preProcess(context, userMessage, clientId);

  return {
    systemPrompt: enhancedPrompt,
    context: processedContext,
    userMessage,
    metadata: {
      compressed,
      stats,
      clientId,
    },
  };
}

// Export
module.exports = {
  preProcess,
  enhancePrompt,
  processRequest,
  CONFIG,
};

// CLI test
if (require.main === module) {
  const testContext = "A".repeat(50000); // 50K chars
  const testQuery = "Ce poți face pentru mine?";

  console.log("Testing middleware...");
  console.log(`Context: ${testContext.length} chars`);

  preProcess(testContext, testQuery, "+40729229599")
    .then((result) => {
      console.log("\n=== RESULT ===");
      console.log(`Compressed: ${result.compressed}`);
      console.log(`Output length: ${result.context.length} chars`);
      if (result.stats) {
        console.log(`Stats:`, result.stats);
      }
    })
    .catch((err) => console.error("Error:", err));
}
