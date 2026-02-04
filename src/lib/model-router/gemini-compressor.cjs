#!/usr/bin/env node
/**
 * Gemini Context Compressor
 * Comprimă context mare folosind Gemini API direct
 * Pentru a fi folosit înaintea unui request Claude
 */

const https = require("https");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash"; // Fast & cheap

/**
 * Compress context with Gemini
 */
async function compress(context, query, options = {}) {
  const { targetTokens = 3000, maxPoints = 15, language = "ro" } = options;

  const prompt =
    language === "ro"
      ? `Ești un sistem de compresie context. Extrage DOAR informațiile relevante pentru întrebarea dată.

ÎNTREBARE: "${query}"

CONTEXT DE COMPRIMAT:
${context}

---

REGULI:
1. Extrage maximum ${maxPoints} puncte cheie relevante pentru întrebare
2. PĂSTREAZĂ: nume, CUI-uri, date, sume, decizii, contacte, fapte importante
3. ELIMINĂ: conversații banale, salutări, repetări
4. Format: bullet points concise în română
5. Dacă nu e relevant pentru întrebare, nu include
6. MAXIM ${Math.floor(targetTokens * 0.8)} cuvinte

CONTEXT COMPRIMAT:`
      : `You are a context compression system. Extract ONLY relevant information for the given question.

QUESTION: "${query}"

CONTEXT TO COMPRESS:
${context}

---

RULES:
1. Extract maximum ${maxPoints} key points relevant to the question
2. KEEP: names, IDs, dates, amounts, decisions, contacts, important facts
3. REMOVE: small talk, greetings, repetitions
4. Format: concise bullet points
5. If not relevant to the question, don't include
6. MAXIMUM ${Math.floor(targetTokens * 0.8)} words

COMPRESSED CONTEXT:`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: targetTokens,
      },
    });

    const req = https.request(
      {
        hostname: "generativelanguage.googleapis.com",
        path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
              resolve({
                compressed: json.candidates[0].content.parts[0].text,
                originalTokens: Math.ceil(context.length / 4),
                compressedTokens: Math.ceil(json.candidates[0].content.parts[0].text.length / 4),
                model: GEMINI_MODEL,
              });
            } else if (json.error) {
              reject(new Error(`Gemini: ${json.error.message}`));
            } else {
              // Fallback
              resolve({
                compressed: context.slice(-12000),
                originalTokens: Math.ceil(context.length / 4),
                compressedTokens: 3000,
                model: "fallback-truncate",
                warning: "Gemini returned no content, used truncation",
              });
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(30000, () => reject(new Error("Timeout")));
    req.write(data);
    req.end();
  });
}

/**
 * Quick check if compression is needed
 */
function needsCompression(contextLength, threshold = 40000) {
  // ~10K tokens = ~40K chars
  return contextLength > threshold;
}

// Export
module.exports = { compress, needsCompression };

// CLI
if (require.main === module) {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    process.exit(1);
  }

  const testContext =
    process.argv[2] ||
    `
Alexandru Irimescu conduce Areaforu SRL (CUI 38911092).
Firma a avut CA de 914.455 lei în 2023, profit 382.309 lei.
Este plătitor TVA din decembrie 2018.
Activitate principală: CAEN 7022 - Consultanță afaceri.
Sediul în Ploiești, strada Ion Luca Caragiale 14.
Număr angajați: 1 (asociat unic).
    `.repeat(20);

  const query = process.argv[3] || "Care e cifra de afaceri a firmei?";

  console.log(`Compressing ${testContext.length} chars for query: "${query}"`);

  compress(testContext, query)
    .then((result) => {
      console.log("\n=== RESULT ===");
      console.log(`Original: ~${result.originalTokens} tokens`);
      console.log(`Compressed: ~${result.compressedTokens} tokens`);
      console.log(
        `Ratio: ${((result.compressedTokens / result.originalTokens) * 100).toFixed(1)}%`,
      );
      console.log(`Model: ${result.model}`);
      if (result.warning) console.log(`Warning: ${result.warning}`);
      console.log("\n--- Compressed content ---");
      console.log(result.compressed);
    })
    .catch((err) => {
      console.error("Error:", err.message);
    });
}
