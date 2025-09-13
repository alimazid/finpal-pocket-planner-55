# Penny Prototype External API Documentation

## Overview

The Penny Prototype External API allows third-party applications to register Gmail accounts for email monitoring and AI processing. This enables your app to handle the OAuth flow while leveraging Penny's monitoring capabilities.

## Base URL

```
Production: https://your-penny-instance.com
Development: http://localhost:3000
```

## Authentication

All API requests require an API key in the header:
```
X-API-Key: your-api-key-here
```

**Test API Key (Development):** `test-api-key-development`

---

## API Endpoints

### 1. Register Gmail Account

**Endpoint:** `POST /api/external/register-account`

Registers a Gmail account for monitoring using tokens obtained from your OAuth flow.

**Request Headers:**
```
X-API-Key: your-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "gmailAddress": "user@gmail.com",
  "accessToken": "ya29.a0AfH6SMB...",
  "refreshToken": "1//0gLu8Fj...",
  "tokenExpiresAt": "2025-09-14T10:30:00Z",
  "externalUserId": "user-456",
  "startMonitoring": true,
  "metadata": {
    "userName": "John Doe",
    "webhookUrl": "https://yourapp.com/webhook/penny",
    "customData": {
      "subscriptionTier": "premium"
    }
  }
}
```

**Required Fields:**
- `gmailAddress` - Gmail email address
- `accessToken` - Gmail OAuth access token
- `refreshToken` - Gmail OAuth refresh token
- `externalUserId` - User ID in your system

**Optional Fields:**
- `tokenExpiresAt` - Token expiration (ISO date string)
- `startMonitoring` - Auto-start monitoring (default: false)
- `metadata` - Additional data including webhook URL

**Response (200 OK):**
```json
{
  "success": true,
  "accountId": "cmeki0g0p000h13kfgrcunawo",
  "gmailAddress": "user@gmail.com",
  "monitoringStatus": "active",
  "message": "Account registered and monitoring started"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/external/register-account \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "gmailAddress": "user@gmail.com",
    "accessToken": "ya29...",
    "refreshToken": "1//...",
    "tokenExpiresAt": "2025-12-31T23:59:59Z",
    "externalUserId": "user-123",
    "startMonitoring": true,
    "metadata": {
      "userName": "John Doe",
      "webhookUrl": "https://yourapp.com/webhook"
    }
  }'
```

---

### 2. Get Account Status

**Endpoint:** `GET /api/external/accounts/:accountId`

**Response:**
```json
{
  "accountId": "cmeki0g0p000h13kfgrcunawo",
  "gmailAddress": "user@gmail.com",
  "isConnected": true,
  "monitoringActive": true,
  "lastSyncAt": "2025-09-13T09:15:00Z",
  "registeredAt": "2025-09-13T08:00:00Z",
  "externalUserId": "user-123",
  "statistics": {
    "totalEmails": 150,
    "financialEmails": 45,
    "extractedData": 38
  }
}
```

---

### 3. Start Monitoring

**Endpoint:** `POST /api/external/accounts/:accountId/start-monitoring`

**Response:**
```json
{
  "success": true,
  "accountId": "cmeki0g0p000h13kfgrcunawo",
  "monitoringStatus": "active",
  "message": "Monitoring started successfully"
}
```

---

### 4. Stop Monitoring

**Endpoint:** `POST /api/external/accounts/:accountId/stop-monitoring`

**Response:**
```json
{
  "success": true,
  "accountId": "cmeki0g0p000h13kfgrcunawo",
  "monitoringStatus": "inactive",
  "message": "Monitoring stopped successfully"
}
```

---

### 5. Remove Account

**Endpoint:** `DELETE /api/external/accounts/:accountId`

Removes the account and stops all monitoring.

**Response:**
```json
{
  "success": true,
  "message": "Account removed and monitoring stopped"
}
```

---

## Webhook Notifications

When you register an account with a webhook URL, Penny will send real-time notifications:

**Webhook URL Configuration:**
Set `metadata.webhookUrl` when registering an account.

**Webhook Payload:**
```json
{
  "event": "email.classified",
  "timestamp": "2025-09-13T10:30:00Z",
  "accountId": "cmeki0g0p000h13kfgrcunawo",
  "externalUserId": "user-456",
  "data": {
    "emailId": "cmesjq1ra000hma6cqr16hlph",
    "subject": "Your statement is ready",
    "sender": "alerts@bankofamerica.com",
    "classification": "BANKING",
    "isFinancial": true,
    "extractedData": {
      "amount": 1250.50,
      "currency": "USD",
      "transactionDate": "2025-09-12",
      "merchant": "Bank of America"
    }
  }
}
```

**Event Types:**
- `account.connected` - Account successfully registered
- `account.disconnected` - Account disconnected (auth failure)
- `email.received` - New email detected
- `email.classified` - Email classified by AI
- `email.extracted` - Financial data extracted
- `monitoring.started` - Monitoring activated
- `monitoring.stopped` - Monitoring deactivated
- `token.refreshed` - OAuth tokens refreshed
- `error.occurred` - Processing error

**Webhook Response:**
Your webhook endpoint should respond with HTTP 200 status within 5 seconds.

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "value"
  }
}
```

**Error Codes:**
- `MISSING_API_KEY` - API key not provided
- `INVALID_API_KEY` - API key invalid or inactive
- `INVALID_TOKEN` - Gmail tokens invalid or expired
- `ACCOUNT_EXISTS` - Account already registered
- `ACCOUNT_NOT_FOUND` - Account ID not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid request data
- `WEBHOOK_FAILED` - Webhook delivery failed
- `INTERNAL_ERROR` - Server error

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (API key issues)
- `404` - Not Found (account not found)
- `409` - Conflict (account already exists)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## Rate Limits

- **Default:** 60 requests per minute per API key
- **Burst:** Up to 10 requests per second
- **Headers returned:**
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 45`
  - `X-RateLimit-Reset: 1694603400`

---

## OAuth Configuration

### Important: Shared Client Credentials

For the integration to work, your app must use **Penny's OAuth client credentials** when obtaining Gmail tokens:

```javascript
const oauth2Client = new google.auth.OAuth2(
  process.env.PENNY_CLIENT_ID,     // Provided by Penny
  process.env.PENNY_CLIENT_SECRET, // Provided by Penny
  'https://yourapp.com/auth/callback'
);

// Required Gmail scopes
const scopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify'
];
```

### Why Shared Credentials?

Gmail OAuth refresh tokens are tied to the client credentials that created them. Using Penny's credentials ensures tokens can be refreshed by both your app and Penny's monitoring system.

---

## Integration Guide

### Step 1: Setup OAuth

Request Penny's OAuth client credentials and configure your app:

```javascript
// Configure OAuth client with Penny's credentials
const oauth2Client = new google.auth.OAuth2(
  PENNY_CLIENT_ID,
  PENNY_CLIENT_SECRET,
  'https://yourapp.com/auth/callback'
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://www.googleapis.com/auth/gmail.modify'
  ],
  prompt: 'consent' // Ensures refresh token is provided
});
```

### Step 2: Handle OAuth Callback

```javascript
// Exchange authorization code for tokens
const { tokens } = await oauth2Client.getToken(authorizationCode);

// Extract tokens
const accessToken = tokens.access_token;
const refreshToken = tokens.refresh_token;
const expiryDate = new Date(tokens.expiry_date).toISOString();
```

### Step 3: Register with Penny

```javascript
const response = await fetch('http://localhost:3000/api/external/register-account', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gmailAddress: userEmail,
    accessToken: accessToken,
    refreshToken: refreshToken,
    tokenExpiresAt: expiryDate,
    externalUserId: userId,
    startMonitoring: true,
    metadata: {
      userName: userName,
      webhookUrl: 'https://yourapp.com/webhook/penny'
    }
  })
});

const result = await response.json();

if (result.success) {
  // Store accountId for future reference
  const accountId = result.accountId;
  console.log('Account registered:', accountId);
} else {
  console.error('Registration failed:', result.error);
}
```

### Step 4: Handle Webhooks

```javascript
app.post('/webhook/penny', (req, res) => {
  const { event, accountId, externalUserId, data } = req.body;

  switch(event) {
    case 'email.classified':
      if (data.isFinancial) {
        // Process financial email
        processFinancialData(externalUserId, data.extractedData);
      }
      break;

    case 'account.disconnected':
      // Handle reconnection flow
      notifyUserToReconnect(externalUserId);
      break;

    case 'monitoring.started':
      console.log(`Monitoring started for user ${externalUserId}`);
      break;
  }

  // Always respond with 200 OK
  res.status(200).send('OK');
});
```

### Step 5: Manage Accounts

```javascript
// Get account status
const status = await fetch(`http://localhost:3000/api/external/accounts/${accountId}`, {
  headers: { 'X-API-Key': 'your-api-key' }
});

// Stop monitoring
await fetch(`http://localhost:3000/api/external/accounts/${accountId}/stop-monitoring`, {
  method: 'POST',
  headers: { 'X-API-Key': 'your-api-key' }
});

// Remove account
await fetch(`http://localhost:3000/api/external/accounts/${accountId}`, {
  method: 'DELETE',
  headers: { 'X-API-Key': 'your-api-key' }
});
```

---

## Testing

### Development Environment

```bash
# Base URL
http://localhost:3000

# Test API Key
test-api-key-development

# Test registration endpoint
curl -X POST http://localhost:3000/api/external/register-account \
  -H "X-API-Key: test-api-key-development" \
  -H "Content-Type: application/json" \
  -d '{
    "gmailAddress": "test@gmail.com",
    "accessToken": "test-token",
    "refreshToken": "test-refresh",
    "tokenExpiresAt": "2025-12-31T23:59:59Z",
    "externalUserId": "test-user-1"
  }'
```

Note: Test tokens will fail validation (expected behavior). Use real Gmail tokens for full testing.

---

## Security Best Practices

### API Key Management
- Store API keys securely (environment variables)
- Never expose API keys in client-side code
- Rotate API keys periodically
- Use different keys for development/production

### Token Security
- Always use HTTPS in production
- Tokens are encrypted at rest in Penny's database
- Implement token rotation when tokens expire
- Monitor for authentication failures

### Webhook Security
- Verify webhook payloads come from Penny
- Implement idempotency for webhook processing
- Use HTTPS endpoints for webhook URLs
- Validate webhook signatures (coming soon)

---

## Support & Contact

- **Technical Issues:** Create GitHub issue
- **API Access:** Contact Penny team for API keys
- **Integration Help:** Refer to this documentation
- **Status Updates:** Check server logs for monitoring status

---

## Changelog

### Version 1.0.0 (2025-09-13)
- Initial release
- Account registration endpoint
- Webhook notifications
- Basic account management
- Rate limiting and authentication
- Development testing support

---

This documentation covers all aspects of integrating with Penny's External API. For additional questions or support, please reach out to the Penny development team.