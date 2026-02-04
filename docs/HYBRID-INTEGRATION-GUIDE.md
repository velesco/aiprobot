# 🧠 Ghid Integrare Hybrid Model Router

## Obiectiv
Integrare automată Gemini (2M context) + Claude Opus (raționament) în gateway-ul AIPro.

---

## Arhitectură

```
User Message
     ↓
[AIPro Gateway]
     ↓
[Pre-processor Middleware] ← NOU
     ↓
Context > 10K tokens?
     ├── DA → Gemini comprimă → Claude răspunde
     └── NU → Claude direct
     ↓
Response
```

---

## Fișiere Create (gata de folosit)

```
/home/node/aipro/lib/model-router/
├── gemini-compressor.js   # Compresie cu Gemini API
├── middleware.js          # Pre-processor pentru gateway
├── auto-compress.js       # Batch compression pentru istoric
├── config.json            # Configurare praguri
└── index.js               # Router complet (optional)
```

---

## Pași de Integrare

### 1. Verifică API Keys

```bash
# Gemini (trebuie să existe)
echo $GEMINI_API_KEY

# Test rapid
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say OK"}]}]}'
```

### 2. Integrare în Gateway

Opțiunea A: **Hook în message processing**

În fișierul gateway care procesează mesajele (probabil `gateway.ts` sau `agent.ts`), adaugă:

```typescript
import { preProcess } from '/home/node/aipro/lib/model-router/middleware.js';

// Înainte de a trimite la Claude
async function processMessage(context: string, userMessage: string, clientId: string) {
  
  // PRE-PROCESS: Comprimă dacă e nevoie
  const { context: processedContext, compressed } = await preProcess(
    context,
    userMessage,
    clientId
  );
  
  // Continuă cu contextul procesat
  return sendToClaude(processedContext, userMessage);
}
```

Opțiunea B: **Proxy middleware** (mai curat)

Creează un endpoint intermediar:

```typescript
// /api/hybrid-chat
app.post('/api/hybrid-chat', async (req, res) => {
  const { context, message, clientId, systemPrompt } = req.body;
  
  const { preProcess } = require('/home/node/aipro/lib/model-router/middleware.js');
  
  const result = await preProcess(context, message, clientId);
  
  // Forward to existing Claude endpoint cu context comprimat
  const response = await claudeChat({
    system: systemPrompt,
    context: result.context,
    message: message
  });
  
  res.json({
    response,
    metadata: {
      compressed: result.compressed,
      originalTokens: result.stats?.originalTokens,
      compressedTokens: result.stats?.compressedTokens
    }
  });
});
```

### 3. Configurare Praguri

Editează `/home/node/aipro/lib/model-router/middleware.js`:

```javascript
const CONFIG = {
    enabled: true,
    compressionThreshold: 40000,  // chars (~10K tokens)
    summaryMaxAge: 24 * 60 * 60 * 1000, // 24h cache
    summariesDir: '/home/node/aipro/client-summaries',
    logFile: '/home/node/aipro/logs/model-router.log'
};
```

### 4. Test

```bash
# Test compression direct
node /home/node/aipro/lib/model-router/middleware.js

# Test cu context custom
node -e "
const { preProcess } = require('/home/node/aipro/lib/model-router/middleware.js');
const ctx = 'Test data '.repeat(10000);
preProcess(ctx, 'What is this?', '+40700000000')
  .then(r => console.log('OK:', r.compressed, r.context.length))
  .catch(e => console.error('ERR:', e));
"
```

---

## API Reference

### `preProcess(context, query, clientId)`

```javascript
const { preProcess } = require('./middleware.js');

const result = await preProcess(
  "very long context...",  // string, orice lungime
  "user question",         // string
  "+40729229599"           // clientId pentru cache
);

// Returns:
{
  context: "compressed context...",  // pentru Claude
  compressed: true,                   // dacă s-a comprimat
  fromCache: false,                   // dacă e din cache
  stats: {
    originalTokens: 50000,
    compressedTokens: 500,
    duration: 1200  // ms
  }
}
```

### `compress(context, query, options)`

```javascript
const { compress } = require('./gemini-compressor.js');

const result = await compress(
  "long context",
  "relevant query",
  { targetTokens: 3000, maxPoints: 15 }
);

// Returns:
{
  compressed: "bullet points...",
  originalTokens: 50000,
  compressedTokens: 750,
  model: "gemini-2.0-flash"
}
```

---

## Costuri Estimate

| Context Size | Doar Claude | Hybrid | Economie |
|--------------|-------------|--------|----------|
| 50K tokens   | $4.50       | $0.60  | 87%      |
| 100K tokens  | $9.00       | $0.80  | 91%      |
| 200K tokens  | $18.00      | $1.20  | 93%      |

---

## Troubleshooting

### Gemini returnează eroare
```bash
# Verifică API key
echo $GEMINI_API_KEY | wc -c  # trebuie ~39 chars

# Test direct
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

### Compression prea agresivă
Mărește `targetTokens` în config:
```javascript
{ targetTokens: 5000 }  // default 3000
```

### Cache nu funcționează
```bash
# Verifică permisiuni
ls -la /home/node/aipro/client-summaries/
chmod 755 /home/node/aipro/client-summaries/
```

---

## Contact

Dacă ai întrebări, ping în chat-ul cu Alexandru sau verifică:
- Logs: `/home/node/aipro/logs/model-router.log`
- Docs: `/home/node/aipro/lib/model-router/README.md`
