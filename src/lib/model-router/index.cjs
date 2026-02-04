#!/usr/bin/env node
/**
 * Model Router - Hybrid AI System
 * Combină Gemini 3 Pro (2M context) cu Claude Opus 4.5 (raționament)
 *
 * Flow:
 * 1. Gemini citește contextul mare și extrage esențialul
 * 2. Claude primește contextul comprimat și generează răspunsul
 */

const https = require("https");

// === CONFIGURARE ===
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const GEMINI_MODEL = "gemini-2.5-pro-preview-06-05"; // sau gemini-2.5-pro
const CLAUDE_MODEL = "claude-opus-4-5-20250514";

const MAX_CONTEXT_FOR_CLAUDE = 4000; // tokens comprimate pentru Claude
const COMPRESSION_RATIO = 0.01; // 1% din context original

/**
 * Call Gemini API
 */
async function callGemini(prompt, options = {}) {
  const { maxTokens = 2000, temperature = 0.3 } = options;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
              resolve(json.candidates[0].content.parts[0].text);
            } else if (json.error) {
              reject(new Error(`Gemini error: ${json.error.message}`));
            } else {
              reject(new Error("Gemini: No response generated"));
            }
          } catch (e) {
            reject(new Error(`Gemini parse error: ${e.message}`));
          }
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(60000, () => reject(new Error("Gemini timeout")));
    req.write(data);
    req.end();
  });
}

/**
 * Call Claude API
 */
async function callClaude(systemPrompt, userMessage, options = {}) {
  const { maxTokens = 4096, temperature = 0.7 } = options;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (json.content && json.content[0]?.text) {
              resolve({
                text: json.content[0].text,
                usage: json.usage,
              });
            } else if (json.error) {
              reject(new Error(`Claude error: ${json.error.message}`));
            } else {
              reject(new Error("Claude: No response generated"));
            }
          } catch (e) {
            reject(new Error(`Claude parse error: ${e.message}`));
          }
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(120000, () => reject(new Error("Claude timeout")));
    req.write(data);
    req.end();
  });
}

/**
 * Compress context using Gemini
 */
async function compressContext(fullContext, userQuery, options = {}) {
  const { targetTokens = MAX_CONTEXT_FOR_CLAUDE } = options;

  const compressionPrompt = `Ești un sistem de compresie context. Ai primit un istoric de conversații și date.

SARCINĂ: Extrage DOAR informațiile relevante pentru a răspunde la întrebarea utilizatorului.

ÎNTREBAREA UTILIZATORULUI:
"${userQuery}"

CONTEXT COMPLET:
${fullContext}

---

INSTRUCȚIUNI:
1. Extrage maximum 10-15 puncte cheie relevante pentru întrebare
2. Păstrează: nume, date, numere, decizii importante, context business
3. Elimină: conversații banale, repetări, filler
4. Format: bullet points concise
5. Dacă nu găsești informații relevante, spune "Nu am găsit context relevant pentru această întrebare."
6. MAXIM ${targetTokens} tokens în output

CONTEXT COMPRIMAT:`;

  return await callGemini(compressionPrompt, { maxTokens: targetTokens, temperature: 0.1 });
}

/**
 * Main hybrid response function
 */
async function hybridResponse(userMessage, fullContext, systemPrompt, options = {}) {
  const startTime = Date.now();
  const stats = { geminiTokens: 0, claudeTokens: 0, geminiMs: 0, claudeMs: 0 };

  // Estimează tokens în context
  const estimatedTokens = Math.ceil(fullContext.length / 4);
  console.log(`[ModelRouter] Context size: ~${estimatedTokens} tokens`);

  // Decide dacă e nevoie de compresie
  const needsCompression = estimatedTokens > 10000;

  let compressedContext = fullContext;

  if (needsCompression) {
    console.log(`[ModelRouter] Compressing with Gemini...`);
    const geminiStart = Date.now();

    try {
      compressedContext = await compressContext(fullContext, userMessage, options);
      stats.geminiMs = Date.now() - geminiStart;
      stats.geminiTokens =
        Math.ceil(fullContext.length / 4) + Math.ceil(compressedContext.length / 4);
      console.log(
        `[ModelRouter] Compressed to ~${Math.ceil(compressedContext.length / 4)} tokens in ${stats.geminiMs}ms`,
      );
    } catch (e) {
      console.error(`[ModelRouter] Gemini compression failed: ${e.message}`);
      // Fallback: truncate to last 20K chars
      compressedContext = fullContext.slice(-20000);
    }
  }

  // Claude generates response
  console.log(`[ModelRouter] Generating response with Claude Opus...`);
  const claudeStart = Date.now();

  const enhancedSystem = `${systemPrompt}

---
CONTEXT RELEVANT DIN ISTORIC:
${compressedContext}
---

Răspunde la mesajul utilizatorului folosind contextul de mai sus când e relevant.`;

  const response = await callClaude(enhancedSystem, userMessage, options);
  stats.claudeMs = Date.now() - claudeStart;
  stats.claudeTokens = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  const totalMs = Date.now() - startTime;
  console.log(
    `[ModelRouter] Total: ${totalMs}ms (Gemini: ${stats.geminiMs}ms, Claude: ${stats.claudeMs}ms)`,
  );

  // Estimează cost
  const geminiCost = (stats.geminiTokens / 1000000) * 2.5; // $2/M input, $12/M output avg
  const claudeCost =
    ((response.usage?.input_tokens || 0) / 1000000) * 15 +
    ((response.usage?.output_tokens || 0) / 1000000) * 75;

  console.log(
    `[ModelRouter] Estimated cost: $${(geminiCost + claudeCost).toFixed(4)} (Gemini: $${geminiCost.toFixed(4)}, Claude: $${claudeCost.toFixed(4)})`,
  );

  return {
    text: response.text,
    stats: {
      ...stats,
      totalMs,
      estimatedCost: geminiCost + claudeCost,
      compressed: needsCompression,
    },
  };
}

/**
 * Simple routing decision
 */
function shouldUseHybrid(contextLength, queryComplexity = "normal") {
  // Use hybrid if:
  // - Context > 10K tokens
  // - OR query is complex (needs deep reasoning)
  if (contextLength > 40000) return true; // ~10K tokens
  if (queryComplexity === "complex") return true;
  return false;
}

// Export for use in other modules
module.exports = {
  callGemini,
  callClaude,
  compressContext,
  hybridResponse,
  shouldUseHybrid,
};

// CLI test
if (require.main === module) {
  const testContext = `
    Conversație din 2026-01-15:
    Alexandru: Am firma Areaforu SRL, CUI 38911092
    Xiri: Am găsit firma ta - activă, plătitor TVA din 2018
    
    Conversație din 2026-01-20:
    Alexandru: Vreau să aplic la fonduri europene
    Xiri: Am găsit 3 programe active pentru consultanță
    
    Conversație din 2026-01-25:
    Alexandru: Care era CA-ul firmei?
    Xiri: Areaforu a avut CA de 914.455 lei în 2023
    
    Conversație din 2026-02-01:
    Alexandru: Lansează XIRI pentru antreprenori
    `.repeat(100); // Simulate large context

  console.log("Testing hybrid response...");
  console.log(
    `Test context size: ${testContext.length} chars (~${Math.ceil(testContext.length / 4)} tokens)`,
  );

  hybridResponse(
    "Care era cifra de afaceri a firmei mele?",
    testContext,
    "Ești Xiri, asistent pentru antreprenori români.",
  )
    .then((result) => {
      console.log("\n=== RESULT ===");
      console.log(result.text);
      console.log("\n=== STATS ===");
      console.log(JSON.stringify(result.stats, null, 2));
    })
    .catch((err) => {
      console.error("Error:", err.message);
    });
}
