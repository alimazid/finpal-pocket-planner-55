# FinPal Gmail Webhook Integration Guide for Penny Team

## Overview

This document provides the technical specifications for integrating with FinPal's Gmail webhook endpoint. FinPal uses **HMAC-SHA256 signature verification** for webhook authentication to ensure security and prevent unauthorized requests.

## Quick Start

**Webhook URL**: `http://localhost:3001/api/gmail/webhook` (development)
**Method**: `POST`
**Authentication**: HMAC-SHA256 signature
**Shared Secret**: `f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f`

## Authentication Method: HMAC-SHA256 Signatures

### Why HMAC-SHA256?

We use HMAC-SHA256 instead of API keys because:
- ✅ **Security**: Cannot be reversed or extracted from webhooks
- ✅ **Integrity**: Ensures payload hasn't been tampered with
- ✅ **Industry Standard**: Used by GitHub, Stripe, and other major platforms
- ✅ **Timing Attack Protection**: Safe comparison prevents security vulnerabilities

### Implementation

#### 1. Generate Signature (Penny Side)

```javascript
const crypto = require('crypto');

function generateWebhookSignature(payload, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');

  return signature; // Send as 'sha256=' + signature or just signature
}
```

#### 2. Send Webhook Request

```javascript
const payload = {
  event: "email.extracted",
  timestamp: "2024-01-15T10:35:00Z",
  accountId: "penny_acc_123456",
  externalUserId: "finpal_user_789",
  data: {
    // Event-specific data
  }
};

const signature = generateWebhookSignature(payload, WEBHOOK_SECRET);

const response = await fetch('http://localhost:3001/api/gmail/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature  // or 'sha256=' + signature
  },
  body: JSON.stringify(payload)
});
```

### Code Examples

#### Node.js/JavaScript
```javascript
const crypto = require('crypto');

// Generate signature for webhook
function signWebhookPayload(payload, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');
  return signature;
}

// Example usage
const webhookSecret = 'f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f';
const payload = { event: 'test.webhook', accountId: 'test', externalUserId: 'user' };
const signature = signWebhookPayload(payload, webhookSecret);

console.log('Signature:', signature);
```

#### Python
```python
import hmac
import hashlib
import json

def sign_webhook_payload(payload, secret):
    payload_json = json.dumps(payload, separators=(',', ':'))
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_json.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

# Example usage
webhook_secret = 'f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f'
payload = {'event': 'test.webhook', 'accountId': 'test', 'externalUserId': 'user'}
signature = sign_webhook_payload(payload, webhook_secret)
print(f'Signature: {signature}')
```

#### Go
```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
)

func signWebhookPayload(payload interface{}, secret string) (string, error) {
    payloadBytes, err := json.Marshal(payload)
    if err != nil {
        return "", err
    }

    h := hmac.New(sha256.New, []byte(secret))
    h.Write(payloadBytes)
    signature := hex.EncodeToString(h.Sum(nil))

    return signature, nil
}

func main() {
    secret := "f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f"
    payload := map[string]string{
        "event": "test.webhook",
        "accountId": "test",
        "externalUserId": "user",
    }

    signature, _ := signWebhookPayload(payload, secret)
    fmt.Printf("Signature: %s\n", signature)
}
```

## Request Format

### Headers
```
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256-signature>
```

**Note**: The signature header can be sent as either:
- `X-Webhook-Signature: abcd1234...` (raw hex)
- `X-Webhook-Signature: sha256=abcd1234...` (with prefix)

Both formats are supported by FinPal.

### Request Body Schema

```json
{
  "event": "string",           // Event type (required)
  "timestamp": "string",       // ISO 8601 timestamp (required)
  "accountId": "string",       // Penny account ID (required)
  "externalUserId": "string",  // FinPal user ID (required)
  "data": {                    // Event-specific data (optional)
    // Variable structure based on event type
  }
}
```

## Supported Event Types

### Account Management Events
- `account.connected` - Gmail account successfully connected to Penny
- `account.disconnected` - Gmail account disconnected from Penny
- `account.error` - Error occurred with Gmail account connection

### Email Processing Events
- `email.received` - New email received and queued for processing
- `email.classified` - Email classified (financial/non-financial)
- `email.extracted` - **CRITICAL**: Financial data extracted from email
- `email.error` - Error processing specific email

### Monitoring Events
- `monitoring.started` - Email monitoring activated for account
- `monitoring.stopped` - Email monitoring deactivated for account
- `monitoring.error` - Error in monitoring process

## Event Data Examples

### Email with Extracted Financial Data ⚠️ IMPORTANT
```json
{
  "event": "email.extracted",
  "timestamp": "2024-01-15T10:35:00Z",
  "accountId": "penny_acc_123456",
  "externalUserId": "finpal_user_789",
  "data": {
    "emailId": "gmail_msg_456789",
    "sender": "noreply@chase.com",
    "subject": "Your Chase card ending in 1234 was charged $127.50",
    "receivedAt": "2024-01-15T10:34:42Z",
    "extractedData": {
      "type": "expense",           // "expense" or "income"
      "amount": 127.50,           // Positive number
      "currency": "USD",          // ISO currency code
      "transactionDate": "2024-01-15",  // YYYY-MM-DD format
      "merchant": "Amazon.com",   // Merchant/payee name
      "category": "shopping",     // Optional: suggested category
      "confidence": 0.95,         // AI confidence score (0-1)
      "description": "Online Purchase - Amazon.com",  // Optional
      "reference": "TXN123456789"  // Optional: transaction ID
    }
  }
}
```

### Account Connected Event
```json
{
  "event": "account.connected",
  "timestamp": "2024-01-15T10:30:00Z",
  "accountId": "penny_acc_123456",
  "externalUserId": "finpal_user_789",
  "data": {
    "gmailAddress": "user@gmail.com",
    "status": "active",
    "permissions": ["readonly", "labels", "modify"],
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Monitoring Started Event
```json
{
  "event": "monitoring.started",
  "timestamp": "2024-01-15T10:30:05Z",
  "accountId": "penny_acc_123456",
  "externalUserId": "finpal_user_789",
  "data": {
    "gmailAddress": "user@gmail.com",
    "monitoringSettings": {
      "realTime": true,
      "batchProcessing": false,
      "filters": ["financial", "transactions"]
    }
  }
}
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Error Responses

#### Missing Signature (401 Unauthorized)
```json
{
  "success": false,
  "error": "Missing webhook signature"
}
```

#### Invalid Signature (401 Unauthorized)
```json
{
  "success": false,
  "error": "Invalid webhook signature"
}
```

#### Invalid Request Body (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid request body: [validation details]"
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to process webhook"
}
```

## Security Considerations

### ✅ DO
- **Always generate fresh signatures** for each request
- **Use the exact JSON payload** when computing signatures (no pretty printing)
- **Store webhook secret securely** (environment variables, secrets management)
- **Implement retry logic** with exponential backoff for failed requests
- **Log webhook attempts** for debugging and monitoring

### ❌ DON'T
- **Never log the webhook secret** in plain text
- **Don't reuse signatures** across different requests
- **Don't modify payload** after generating signature
- **Don't ignore webhook failures** - implement proper error handling
- **Don't send API keys** in webhook headers (use signatures only)

## Testing the Integration

### Manual Testing with curl
```bash
# Generate signature first (using Node.js example above)
SECRET="f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f"
PAYLOAD='{"event":"test.webhook","timestamp":"2024-01-15T10:00:00Z","accountId":"test-account","externalUserId":"test-user","data":{}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send webhook request
curl -X POST http://localhost:3001/api/gmail/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### Verification Steps

1. **Check FinPal logs** for webhook processing confirmation
2. **Verify signature validation** passes in FinPal logs
3. **Confirm event handling** for different event types
4. **Test error scenarios** (invalid signature, malformed payload)

## Integration Checklist

- [ ] **Implement HMAC-SHA256 signature generation** in Penny codebase
- [ ] **Add webhook secret to Penny configuration** (secure storage)
- [ ] **Update webhook sending logic** to include `X-Webhook-Signature` header
- [ ] **Test signature verification** with FinPal webhook endpoint
- [ ] **Implement retry mechanism** for failed webhook deliveries
- [ ] **Add logging and monitoring** for webhook requests
- [ ] **Handle all supported event types** in webhook payload
- [ ] **Validate webhook responses** and handle errors appropriately

## Environment Configuration

### Development
- **Webhook URL**: `http://localhost:3001/api/gmail/webhook`
- **Shared Secret**: `f5054b288275cf846fa30f16b3974484be62c55a71f067c6098dab14f22f239f`

### Production (Update when deployed)
- **Webhook URL**: `https://your-production-domain.com/api/gmail/webhook`
- **Shared Secret**: [Same secret, ensure both systems have it]

## Support & Troubleshooting

### Common Issues

1. **401 Unauthorized Response**
   - ✅ Check signature generation algorithm
   - ✅ Verify webhook secret matches on both sides
   - ✅ Ensure payload used for signature matches request body exactly

2. **400 Bad Request Response**
   - ✅ Validate JSON structure matches schema
   - ✅ Check required fields are present
   - ✅ Verify data types (strings, numbers, etc.)

3. **500 Internal Server Error**
   - ✅ Check FinPal server logs for detailed error information
   - ✅ Verify webhook secret is configured in FinPal environment

### Debugging Tips

- **Enable detailed logging** in Penny for webhook requests
- **Compare signatures** between Penny and FinPal logs
- **Test with minimal payload** first, then add complexity
- **Use webhook testing tools** like ngrok for local testing

## Contact Information

For technical questions about this webhook integration:
- **Development Team**: FinPal Engineering
- **Documentation**: This file (`PENNY_WEBHOOK_INTEGRATION.md`)
- **Test Endpoint**: Available for signature verification testing

---

**Last Updated**: January 2024
**Version**: 1.0
**Integration Status**: Ready for Implementation