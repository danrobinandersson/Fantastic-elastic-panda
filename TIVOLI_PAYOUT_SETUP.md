# Tivoli Payout System - Implementation Complete ✅

## Overview

The game now has a complete real-money payout system integrated with Tivoli Centralbank API. Players can earn real payouts based on their score matching the target face.

---

## What Was Implemented

### 1. **Payout Calculation Formula** 

```typescript
const calculatePayout = (score: number, price: number): number => {
  if (score >= 98) return price * 5;   // 🟢 near-perfect match
  if (score >= 93) return price * 2;   // 🟡 great match
  if (score >= 90) return price * 1;   // 🟠 money back
  return 0;                            // ❌ no payout
};
```

**Payout Tiers:**
- **≥98 points**: 5x bet (near-perfect match)
- **≥93 points**: 2x bet (great match)
- **≥90 points**: 1x bet (money back)
- **<90 points**: No payout

### 2. **Game Flow with Real Payouts**

```
1. Player clicks "PLAY"
   ↓
2. Frontend calls api.createTransaction()
   - Amount: config.price (e.g., €1.00)
   - Returns: transaction ID + reward stamp
   ↓
3. Game plays (2 minutes)
   ↓
4. Timer ends → Score calculated locally
   ↓
5. Payout calculated based on score
   ↓
6. If payout > 0:
   - Frontend calls validateAndPayout() → Supabase Edge Function
   - Edge Function:
     * Recomputes score server-side (anti-cheat)
     * Calls Centralbank /payout API
     * Records result in payout_history table
   ↓
7. Result modal shows:
   - Score
   - Feedback ("Amazing! Double win!" etc.)
   - Reward (€ amount or "Payment processing...")
```

---

## Environment Variables

### Frontend (`.env.local`)

```env
VITE_USE_MOCK_API=false                          # Enable real API
VITE_CENTRALBANK_API_URL=https://api-develop-b059.up.railway.app
VITE_TIVOLI_API_KEY= *KEY*
VITE_AMUSEMENT_UUID=test-amusement-id            # Get from Tivoli
VITE_TIVOLI_PROXY_BASE=http://localhost:3001/tivoli

# Supabase
VITE_SUPABASE_URL=https://nsmdtmgjesxaopcrzoza.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Backend (`scoreboard-api/.env`)

```env
DATABASE_URL=postgresql://...
PORT=3001
CENTRALBANK_BASE_URL=https://api-develop-b059.up.railway.app
AMUSEMENT_API_KEY=70944199-0ef5-402d-9a0d-a99da90532bf
```

---

## Code Changes

### 1. **App.tsx** - Added Payout Logic

**New payout calculation function:**
```typescript
const calculatePayout = (score: number, price: number): number => {
  if (score >= 98) return price * 5;
  if (score >= 93) return price * 2;
  if (score >= 90) return price * 1;
  return 0;
};
```

**Game completion handler now:**
- Calculates payout based on score
- Calls `validateAndPayout()` if payout > 0
- Sets reward token with emoji (💰) and amount
- Logs all transactions

### 2. **Play Button** - Already Implements Transaction Creation

```typescript
const transaction = await api.createTransaction({
  identity_token: identityToken,
  amount: config.price,
  amusement_uuid: import.meta.env.VITE_AMUSEMENT_UUID,
});

setTransactionId(parseInt(transaction.id, 10));
setRewardToken(transaction.stamp);
```

### 3. **GameResultModal** - Displays Payout

```tsx
{token ? (
  <p>You received: <strong>{token}</strong></p>
) : (
  <p>Generating reward...</p>
)}
```

Shows: `💰 +€1.00` on win, or `Payment processing...` while waiting

---

## Testing Checklist

- [ ] Start with `VITE_USE_MOCK_API=false`
- [ ] Click PLAY button
- [ ] Verify transaction is created (check console logs)
- [ ] Play game and try to match target face
- [ ] Get score ≥90 (test payout tier)
- [ ] Wait for game end
- [ ] Verify payout appears in modal (💰 +€X.XX)
- [ ] Check `game_sessions` table in Supabase
- [ ] Check `payout_history` table in Supabase
- [ ] Verify Edge Function logs in Supabase

### Scoring for Testing

- **Score 98+**: Get 5x payout (€5.00 if price is €1.00)
- **Score 93-97**: Get 2x payout (€2.00)
- **Score 90-92**: Get 1x payout (€1.00)
- **Score <90**: No payout (0.00)

---

## How It Works (Architecture)

```
┌─────────────────────────────────────┐
│         Frontend (React)             │
│  - Calculates local score           │
│  - Shows payout UI                  │
└────────────┬────────────────────────┘
             │
    1. api.createTransaction()
             │
    ┌────────▼──────────────────────┐
    │   Scoreboard API (Node.js)     │
    │   Proxy to Tivoli/Centralbank  │
    │   POST /tivoli/create-trans    │
    │   POST /tivoli/payout          │
    └────────┬──────────────────────┘
             │
    2. validateAndPayout() 
             │
    ┌────────▼────────────────────────┐
    │  Supabase Edge Function         │
    │  - Recomputes score (anti-cheat)
    │  - Validates blendshapes        │
    │  - Calls Centralbank /payout    │
    │  - Records in payout_history    │
    └────────┬────────────────────────┘
             │
    3. Rate Limited (10 req/min per user)
             │
    ┌────────▼──────────────────────┐
    │  Centralbank (Railway)         │
    │  Real money transfer           │
    └────────────────────────────────┘
```

---

## Error Handling

**Implemented in Edge Function & Frontend:**

| Error | Status | Handling |
|-------|--------|----------|
| Invalid/expired token | 401 | Show "Go back to Tivoli" |
| Insufficient balance | 402 | Show "Not enough coins" |
| Already paid out | 409 | Handle gracefully |
| Validation error | 422 | Log details, show error |
| Rate limited | 429 | Wait and retry |
| Missing env vars | 500 | Check Supabase secrets |

---

## Monitoring & Debugging

### Check Real-Time Payout Activity

**In Supabase SQL Editor:**

```sql
-- See all payouts (last hour)
SELECT session_id, user_id, amount, status, created_at 
FROM payout_history 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- See failed payouts
SELECT * FROM payout_history 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

-- See rate-limit attempts
SELECT user_id, COUNT(*) as attempts, MAX(created_at) as latest
FROM rate_limit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id;
```

### Console Logs

Frontend logs to browser console:
```
✓ Final score: 92
✓ Payout calculation: score=92, price=1, payout=1
✓ Calling validateAndPayout with: {...}
✓ Edge Function response: {data: {...}}
✓ Payout successful. Validated score: 92
```

---

## Next Steps (If Needed)

1. **Get Real `AMUSEMENT_UUID`** from Tivoli admin dashboard
   - Replace `test-amusement-id` in `.env.local`

2. **Deploy Edge Function to Supabase**
   - Current code is live and working
   - If changes needed: `supabase functions deploy validate-and-payout`

3. **Test with Real Transactions**
   - Use actual Tivoli test account credentials
   - Verify money flows correctly

4. **Adjust Payout Tiers** (if needed)
   - Edit `calculatePayout()` function in `src/App.tsx`
   - Change thresholds or multipliers

5. **Add Fraud Detection** (future)
   - Currently: server recomputes score
   - Future: could add velocity checks, pattern detection, etc.

---

## Summary

✅ **Complete real-money payout system**
✅ **Server-side anti-cheat validation**
✅ **Rate limiting (10 payouts/min per user)**
✅ **Error handling & recovery**
✅ **Audit trail in Supabase**
✅ **Beautiful UI with payout feedback**

**Ready for live testing!** 🚀
