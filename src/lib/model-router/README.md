# 🧠 Model Router - Hybrid AI System

Sistem care combină **Gemini** (context mare, ieftin) cu **Claude Opus** (raționament superior).

## Cum funcționează

```
[Context Mare 500K tokens]
         ↓
    [Gemini Flash]
    Comprimă → 3K tokens relevante
         ↓
    [Claude Opus 4.5]
    Raționament + Răspuns
         ↓
[Răspuns inteligent]
```

## Componente

### 1. `gemini-compressor.js`
Comprimă context folosind Gemini API direct.

```bash
# Test
node gemini-compressor.js

# Programatic
const { compress } = require('./gemini-compressor');
const result = await compress(largeContext, userQuery);
console.log(result.compressed);
```

### 2. `index.js`
Router complet cu ambele modele.

### 3. `hybrid-via-gateway.js`
Versiune care folosește gateway-ul AIPro (pentru API keys gestionate intern).

## Costuri estimate

| Scenariu | Doar Opus | Hybrid | Economie |
|----------|-----------|--------|----------|
| 50K context | $4.50 | $0.60 | 87% |
| 200K context | $18.00 | $1.20 | 93% |
| 500K context | N/A | $2.50 | ∞ |

## Integrare în AIPro

Pentru a activa automat pentru sesiuni cu context mare, adaugă în heartbeat sau
folosește ca pre-processor înainte de requests complexe.

## Configurare

Setează în environment:
```bash
export GEMINI_API_KEY=your_key
```

Claude folosește cheia din configurația AIPro gateway.
