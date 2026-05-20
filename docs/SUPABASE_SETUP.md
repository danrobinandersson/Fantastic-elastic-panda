# Supabase Edge Function Integration Guide

## Overview

This document describes how to set up and deploy the Supabase Edge Function for authoritative game validation and payout orchestration with built-in rate-limiting.

## What's Included

1. **Database Schema** (`supabase/migrations/20260520000000_game_schema.sql`)
   - `game_users`: Store user info linked to Centralbank IDs
   - `game_sessions`: Track game state, scores, and payout status
   - `rate_limit_log`: Prevent API abuse via request throttling
   - `payout_history`: Audit trail for all payouts

2. **Edge Function** (`supabase/functions/validate-and-payout/index.ts`)
   - Serverless authoritative game validation
   - Score recomputation (prevents client cheating)
   - Orchestrated payout flow
   - Rate-limiting (10 requests/minute per user)

3. **Frontend Integration** (src/api/supabaseGameClient.ts - to be created)
   - Client calls Edge Function after game ends
   - Handles rate-limit responses gracefully

## Setup Instructions

### Step 1: Initialize Supabase Project

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

### Step 2: Run Database Migrations

```bash
# This applies the schema to your Supabase database
supabase db push

# Or if using the Supabase dashboard directly:
# Copy the SQL from supabase/migrations/20260520000000_game_schema.sql
# Paste into the SQL editor in your Supabase dashboard
# Execute
```

### Step 3: Deploy Edge Function

```bash
# Deploy the Edge Function
supabase functions deploy validate-and-payout

# Or use Supabase dashboard:
# Navigate to Edge Functions > New Function > Choose "validate-and-payout"
# Paste the TypeScript code from supabase/functions/validate-and-payout/index.ts
# Save & Deploy
```

### Step 4: Set Environment Variables

In your Supabase project settings, add these secrets:

```
CENTRALBANK_BASE_URL=https://api-develop-b059.up.railway.app
AMUSEMENT_API_KEY=<your-amusement-api-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 5: Frontend Integration

Update `src/App.tsx` to call the Edge Function after game completion:

```typescript
// After game finishes and score is computed
const sessionId = ... // UUID of game session
const validatedScore = ... // Score from Edge Function

const response = await fetch(
  `${SUPABASE_URL}/functions/v1/validate-and-payout`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      identityToken,
      playerBlendshapes,
      targetBlendshapes,
      tivoliTransactionId,
      payoutAmount: finalPayout,
    }),
  }
);

const result = await response.json();

// Handle rate-limit response (429)
if (response.status === 429) {
  console.warn(
    `Rate limited: ${result.remainingRequests} requests remaining, reset in ${result.resetSeconds}s`
  );
  // Show user-friendly message
  return;
}

// Handle success
if (response.ok) {
  console.log("Score validated and payout processed:", result);
  finishGame(result.validatedScore);
}
```

## Rate-Limiting Strategy

**Problem**: Prevent abuse and reduce load on Centralbank API

**Solution**: Multi-layer approach

1. **Request Counting**: Track requests per user per minute in `rate_limit_log` table
2. **Hard Limit**: 10 payout requests per user per 60-second window
3. **HTTP 429 Response**: Returns remaining quota and reset time
4. **Cooldown**: 5-second minimum between payout attempts (enforced client-side)
5. **Exponential Backoff**: Frontend can use retry-after header

**Configuration** (in Edge Function):
```typescript
const MAX_REQUESTS_PER_MINUTE = 10; // Adjust as needed
const RATE_LIMIT_WINDOW_SECONDS = 60;
const COOLDOWN_AFTER_PAYOUT_SECONDS = 5;
```

## Game Flow (Updated)

```
1. User loads game with identity_token from URL
   ↓
2. Frontend calls scoreboard-api GET /tivoli/identity-tokens/{token}
   ↓
3. Frontend calls scoreboard-api POST /tivoli/transactions to debit user
   ↓ (receives tivoli_transaction_id)
4. Game plays
   ↓
5. Timer ends → score computed locally
   ↓
6. Frontend calls Supabase Edge Function (validate-and-payout)
   ├─ Edge Function recomputes score (authoritative)
   ├─ Stores session in Supabase
   ├─ Checks rate-limit
   ├─ If win: calls scoreboard-api POST /tivoli/payout
   ├─ Records payout in Supabase
   └─ Returns validated score + payout result
   ↓
7. UI shows result modal with validated score
```

## Troubleshooting

### Edge Function returns 429 (rate-limited)

**Cause**: User exceeded 10 requests/minute

**Solution**:
- Show user: "Please wait X seconds before trying again"
- Implement client-side cooldown
- Check `rate_limit_log` table to verify

### Payout fails but Edge Function returns 200

**Cause**: Centralbank payout failed but we still recorded it

**Status**: Check `payout_history` table for `status: 'failed'` and `error_message`

**Recovery**: Manual retry needed (not automatic)

### Missing environment variables

**Error**: "Missing required environment variables"

**Solution**:
1. Go to Supabase Dashboard > Functions > validate-and-payout > Settings
2. Add missing env vars (AMUSEMENT_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. Redeploy function

## Monitoring & Observing

### View Rate Limit Activity

```sql
SELECT user_id, request_type, COUNT(*) as count, MAX(created_at) as latest
FROM rate_limit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, request_type
ORDER BY count DESC;
```

### View Payout History

```sql
SELECT session_id, user_id, amount, status, error_message, created_at
FROM payout_history
ORDER BY created_at DESC
LIMIT 50;
```

### View Failed Payouts (needs recovery)

```sql
SELECT * FROM payout_history
WHERE status = 'failed'
ORDER BY created_at DESC;
```

## Next Steps

1. ✅ Deploy schema migration
2. ✅ Deploy Edge Function
3. ✅ Set environment variables
4. Update frontend to call Edge Function (src/App.tsx)
5. Test end-to-end with mock and real Centralbank
6. Monitor rate-limit logs and adjust thresholds if needed

## Questions?

- Edge Function docs: https://supabase.com/docs/guides/functions
- Rate limiting best practices: https://supabase.com/docs/guides/database/extensions/pgbouncer
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
