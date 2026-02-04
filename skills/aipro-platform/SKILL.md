---
name: aipro-platform
description: "Manage AIPro Platform accounts, bots and channels. Create companies, configure bots, enable WhatsApp/Telegram/Discord channels."
metadata: {"aipro":{"emoji":"🤖"}}
---

# AIPro Platform Skill

Manage the AIPro Platform - create accounts, configure bots, and manage channels.

## Configuration

Set environment variables:
```bash
export AIPRO_PLATFORM_URL="http://localhost:3001"
export AIPRO_PLATFORM_TOKEN="your-jwt-token"  # Get from login
```

## API Endpoints

Base URL: `${AIPRO_PLATFORM_URL:-http://localhost:3001}`

### 1. Lookup Company by CUI (Public)

```bash
curl -s "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/companies/lookup?cui=12345678"
```

Response: Company details (denumire, adresa, judet, localitate, etc.)

### 2. Register New Account

```bash
curl -X POST "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "cui": "12345678",
    "companyData": {
      "denumire": "Company Name",
      "adresa": "Street Address",
      "localitate": "City",
      "judet": "County",
      "codPostal": "123456"
    },
    "email": "user@company.ro",
    "password": "SecurePassword123",
    "plan": "STARTER"
  }'
```

Response includes JWT token for authentication.

### 3. Login (Get Token)

```bash
curl -X POST "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@company.ro", "password": "password"}'
```

Save the token: `export AIPRO_PLATFORM_TOKEN="<token>"`

### 4. Configure Bot

```bash
curl -X PATCH "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/bot/config" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "welcomeMessage": "Bună! Cum te pot ajuta?",
    "language": "ro",
    "personality": "FRIENDLY",
    "responseTime": "NATURAL",
    "aiModel": "ADVANCED",
    "autoReply": true
  }'
```

Personality options: PROFESSIONAL, FRIENDLY, CASUAL
AI Model options: BASIC, ADVANCED, PREMIUM

### 5. Enable Telegram Channel

```bash
# First configure the token
curl -X PATCH "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/channels/telegram" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiToken": "123456:ABC..."}'

# Then enable it
curl -X POST "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/channels/telegram/enable" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

### 6. Enable WhatsApp (QR Code)

```bash
# Generate QR code
curl -X POST "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/channels/whatsapp/qr" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force": false}'

# Wait for scan
curl -X POST "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/channels/whatsapp/wait" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

### 7. Check Channel Status

```bash
curl -s "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/channels" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

### 8. Get Bot Status

```bash
curl -s "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/bot/status" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

### 9. List Conversations

```bash
curl -s "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/conversations" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

### 10. List Clients

```bash
curl -s "${AIPRO_PLATFORM_URL:-http://localhost:3001}/api/clients" \
  -H "Authorization: Bearer $AIPRO_PLATFORM_TOKEN"
```

## Complete Flow: Create Account + Configure Bot

```bash
# 1. Lookup company
CUI="12345678"
COMPANY=$(curl -s "http://localhost:3001/api/companies/lookup?cui=$CUI")
echo "$COMPANY" | jq .

# 2. Register account
RESULT=$(curl -s -X POST "http://localhost:3001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"cui\": \"$CUI\",
    \"companyData\": $COMPANY,
    \"email\": \"admin@company.ro\",
    \"password\": \"SecurePass123!\",
    \"plan\": \"STARTER\"
  }")
TOKEN=$(echo "$RESULT" | jq -r '.token')

# 3. Configure bot
curl -X PATCH "http://localhost:3001/api/bot/config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assistant",
    "welcomeMessage": "Bună! Cu ce te pot ajuta?",
    "personality": "FRIENDLY",
    "language": "ro"
  }'

# 4. Enable Telegram
curl -X PATCH "http://localhost:3001/api/channels/telegram" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiToken": "BOT_TOKEN_HERE"}'

curl -X POST "http://localhost:3001/api/channels/telegram/enable" \
  -H "Authorization: Bearer $TOKEN"

echo "Done! Bot created and configured."
```

## Error Codes

- 400: Bad request (missing fields, invalid format)
- 401: Unauthorized (missing/invalid token)
- 404: Resource not found
- 409: Conflict (CUI/email already registered)
- 503: Container not running
