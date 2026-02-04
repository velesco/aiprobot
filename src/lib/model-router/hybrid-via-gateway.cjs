#!/usr/bin/env node
/**
 * Hybrid Model Router via Gateway
 * Folosește sessions_spawn pentru a rula compresie Gemini + raționament Claude
 * prin infrastructure-ul existent AIPro
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const CONFIG = {
  compressionModel: "moonshot/kimi-k2-5", // Model ieftin pentru compresie
  reasoningModel: "anthropic/claude-opus-4-5", // Model puternic pentru răspuns
  contextThreshold: 10000, // Tokens peste care activăm compresie
  compressionTarget: 3000, // Tokens țintă după compresie
};

/**
 * Estimează numărul de tokens dintr-un text
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Comprimă contextul folosind un model ieftin
 */
async function compressWithKimi(context, query) {
  const prompt = `TASK: Extract only the relevant information to answer this question.

QUESTION: "${query}"

CONTEXT:
${context}

---

OUTPUT FORMAT:
- List 10-15 key bullet points relevant to the question
- Include: names, dates, numbers, decisions, important facts
- Exclude: small talk, repetitions, irrelevant details
- Be concise but complete

COMPRESSED CONTEXT:`;

  // Salvează prompt într-un fișier temporar
  const tempFile = `/tmp/compress-${Date.now()}.txt`;
  fs.writeFileSync(tempFile, prompt);

  try {
    // Folosește aipro CLI pentru a trimite la Kimi
    const result = execSync(
      `cat "${tempFile}" | aipro chat --model "${CONFIG.compressionModel}" --no-stream 2>/dev/null`,
      {
        encoding: "utf-8",
        timeout: 60000,
      },
    );
    return result.trim();
  } catch (e) {
    console.error("[HybridRouter] Compression failed:", e.message);
    // Fallback: truncate
    return context.slice(-15000);
  } finally {
    try {
      fs.unlinkSync(tempFile);
    } catch {}
  }
}

/**
 * Generează răspuns cu Claude Opus
 */
async function respondWithClaude(systemPrompt, compressedContext, userMessage) {
  const fullPrompt = `${systemPrompt}

---
RELEVANT CONTEXT:
${compressedContext}
---

USER MESSAGE: ${userMessage}`;

  const tempFile = `/tmp/claude-${Date.now()}.txt`;
  fs.writeFileSync(tempFile, fullPrompt);

  try {
    const result = execSync(
      `cat "${tempFile}" | aipro chat --model "${CONFIG.reasoningModel}" --no-stream 2>/dev/null`,
      {
        encoding: "utf-8",
        timeout: 120000,
      },
    );
    return result.trim();
  } catch (e) {
    console.error("[HybridRouter] Claude response failed:", e.message);
    throw e;
  } finally {
    try {
      fs.unlinkSync(tempFile);
    } catch {}
  }
}

/**
 * Funcția principală de routing hibrid
 */
async function hybridRoute(userMessage, fullContext, systemPrompt) {
  const contextTokens = estimateTokens(fullContext);
  console.log(`[HybridRouter] Context: ~${contextTokens} tokens`);

  let workingContext = fullContext;
  let compressed = false;

  if (contextTokens > CONFIG.contextThreshold) {
    console.log(`[HybridRouter] Compressing with Kimi...`);
    const startCompress = Date.now();
    workingContext = await compressWithKimi(fullContext, userMessage);
    console.log(
      `[HybridRouter] Compressed to ~${estimateTokens(workingContext)} tokens in ${Date.now() - startCompress}ms`,
    );
    compressed = true;
  }

  console.log(`[HybridRouter] Generating response with Claude Opus...`);
  const startClaude = Date.now();
  const response = await respondWithClaude(systemPrompt, workingContext, userMessage);
  console.log(`[HybridRouter] Claude responded in ${Date.now() - startClaude}ms`);

  return {
    response,
    stats: {
      originalTokens: contextTokens,
      compressedTokens: estimateTokens(workingContext),
      compressed,
      compressionRatio: compressed
        ? ((estimateTokens(workingContext) / contextTokens) * 100).toFixed(1) + "%"
        : "N/A",
    },
  };
}

// Export
module.exports = { hybridRoute, compressWithKimi, estimateTokens, CONFIG };

// CLI test
if (require.main === module) {
  const testContext = `
Conversație din 2026-01-15:
Alexandru: Am firma Areaforu SRL, CUI 38911092
Xiri: Am găsit firma ta - activă, plătitor TVA din 2018, CA 914.455 lei în 2023

Conversație din 2026-01-20:
Alexandru: Care sunt opțiunile pentru fonduri europene?
Xiri: Am identificat 3 programe: POC, PNRR, IMM Invest

Conversație din 2026-01-25:
Alexandru: Pregătește un raport despre competitori
Xiri: Analizez piața de consultanță...
    `.repeat(50); // ~25K chars

  console.log("=== HYBRID ROUTER TEST ===");
  console.log(`Test context: ${testContext.length} chars`);

  hybridRoute(
    "Ce CA a avut firma mea anul trecut?",
    testContext,
    "Ești Xiri, asistent pentru antreprenori.",
  )
    .then((result) => {
      console.log("\n=== RESPONSE ===");
      console.log(result.response);
      console.log("\n=== STATS ===");
      console.log(JSON.stringify(result.stats, null, 2));
    })
    .catch((err) => {
      console.error("Error:", err.message);
    });
}
