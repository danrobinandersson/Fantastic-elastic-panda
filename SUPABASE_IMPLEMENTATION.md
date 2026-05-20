# Supabase Edge Function Implementation Checklist

## 📋 What You Now Have

### 1. Database Schema (`supabase/migrations/20260520000000_game_schema.sql`)
- ✅ `game_users` table - track users linked to Centralbank
- ✅ `game_sessions` table - track game state and validation
- ✅ `rate_limit_log` table - enforce 10 req/min per user per request type
- ✅ `payout_history` table - audit trail for payouts (success/fail)
- ✅ Indexes for performance (queries on user_id, transaction_id, status)
- ✅ Row-level security (RLS) configured for service role

### 2. Supabase Edge Function (`supabase/functions/validate-and-payout/index.ts`)
- ✅ Authoritative server-side score validation (prevents client cheating)
- ✅ Rate-limiting: 10 payout requests/minute per user
- ✅ 5-second client-side cooldown (built into frontend client)
- ✅ Orchestrated payout flow (calls Centralbank `/transactions/{id}/payout`)
- ✅ Audit logging (stores all payouts in `payout_history`)
- ✅ Error recovery (marks failed payouts for manual review)

### 3. Frontend Client (`src/api/supabaseGameClient.ts`)
- ✅ `validateAndPayout()` function - calls Edge Function
- ✅ Client-side cooldown (5s between attempts)
- ✅ Rate-limit error handling (429 responses)
- ✅ Helper functions: `isRateLimitError()`, `formatRateLimitError()`
- ✅ Environment variable support (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

### 4. Documentation
- ✅ `docs/SUPABASE_SETUP.md` - Complete setup instructions
- ✅ `docs/INTEGRATION_EXAMPLE.md` - Code example for wiring into App.tsx
- ✅ `.env.example` - Environment variable template

## 🚀 Next Steps (Your Actions)

### Phase 1: Deploy Infrastructure (Today)
- [ ] **1a.** Clone/update to latest `API-implementation` branch
- [ ] **1b.** Ensure `scoreboard-api/.env` has:
  - `DATABASE_URL=postgresql://...` (from Supabase)
  - `AMUSEMENT_API_KEY=...` (from Centralbank registration)
  - `CENTRALBANK_BASE_URL=https://api-develop-b059.up.railway.app`
  
- [ ] **1c.** Set up Supabase project (if not done):
  ```bash
  # Create a Supabase project at https://supabase.com
  # Or link existing:
  supabase link --project-ref <your-project-ref>
  ```
  
- [ ] **1d.** Deploy database schema:
  ```bash
  supabase db push
  # Or paste SQL directly into Supabase dashboard > SQL Editor
  ```
  
- [ ] **1e.** Deploy Edge Function:
  ```bash
  supabase functions deploy validate-and-payout
  # Or use dashboard > Edge Functions > Create
  ```
  
- [ ] **1f.** Add secrets in Supabase:
  - `CENTRALBANK_BASE_URL=https://api-develop-b059.up.railway.app`
  - `AMUSEMENT_API_KEY=<your-key>`
  - `SUPABASE_URL=<your-url>`
  - `SUPABASE_SERVICE_ROLE_KEY=<your-key>`

### Phase 2: Frontend Integration (Tomorrow)
- [ ] **2a.** Update `.env` in project root:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_TIVOLI_PROXY_BASE=http://localhost:3001/tivoli
  ```
  
- [ ] **2b.** Wire Edge Function into `src/App.tsx`:
  - Import: `import { validateAndPayout } from "./api/supabaseGameClient"`
  - In `finishGame` effect, call `validateAndPayout()` after timer ends
  - See `docs/INTEGRATION_EXAMPLE.md` for code sample
  
- [ ] **2c.** Test locally:
  ```bash
  # Terminal 1: scoreboard-api
  cd scoreboard-api && npm run dev
  
  # Terminal 2: frontend
  npm run dev
  
  # Test: play game, check console for Edge Function response
  ```

### Phase 3: Testing & Iteration
- [ ] **3a.** Smoke test flow:
  1. Load game with mock identity token
  2. Play to game end
  3. Check Supabase `game_sessions` table (should have record)
  4. Verify `payout_history` table has entry
  5. Confirm score validated server-side
  
- [ ] **3b.** Test rate-limiting:
  1. Spam payout requests 10+ times in 60s
  2. Should get 429 response on 11th attempt
  3. Verify `rate_limit_log` has entries
  
- [ ] **3c.** Test failure scenarios:
  - Mock Centralbank down: payout should fail gracefully
  - Invalid session ID: Edge Function should return 404
  - Missing env vars: should show clear error

## 📊 Rate-Limiting Configuration

Current defaults (can tune):

```typescript
MAX_REQUESTS_PER_MINUTE = 10        // Per user, per request type
RATE_LIMIT_WINDOW_SECONDS = 60      // Rolling window
COOLDOWN_AFTER_PAYOUT_SECONDS = 5   // Client-side cooldown
```

**Why these defaults?**
- 10 req/min = ~1 game every 6 seconds (very aggressive play)
- 5s cooldown = prevents rapid retry loops
- Rolling window = fair to users spread across time

**If you see rate-limit issues:**
```typescript
// In supabase/functions/validate-and-payout/index.ts, line ~15:
const MAX_REQUESTS_PER_MINUTE = 20;  // Increase if needed
const RATE_LIMIT_WINDOW_SECONDS = 120; // Expand window if needed
```

## 🔍 Monitoring SQL Queries

Paste these into Supabase SQL Editor to monitor activity:

```sql
-- See rate-limit activity in last hour
SELECT user_id, request_type, COUNT(*) as requests, MAX(created_at) as latest
FROM rate_limit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id, request_type
ORDER BY requests DESC;

-- See failed payouts (need investigation)
SELECT * FROM payout_history
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- See all sessions with payout attempts
SELECT s.id, s.game_state, s.score_validated, 
       COUNT(p.id) as payout_attempts, 
       MAX(p.status) as latest_payout_status
FROM game_sessions s
LEFT JOIN payout_history p ON s.id = p.session_id
GROUP BY s.id
ORDER BY s.created_at DESC
LIMIT 20;
```

## 🛠️ Troubleshooting Quick Reference

| Issue | Cause | Fix |
|-------|-------|-----|
| 429 Rate Limited | User exceeded limit | Wait 60s, retry |
| 404 Session Not Found | Bad sessionId | Verify UUID format |
| 500 Server Error | Missing env vars | Check Supabase Secrets |
| Payout fails, 200 OK | Centralbank issue | Check `payout_history.error_message` |
| No data in DB | Function not deployed | `supabase functions deploy` |
| Permission denied (RLS) | Auth issue | Verify service role key |

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260520000000_game_schema.sql` | Database schema |
| `supabase/functions/validate-and-payout/index.ts` | Edge Function (Deno) |
| `src/api/supabaseGameClient.ts` | Frontend client library |
| `src/App.tsx` | **[TO UPDATE]** Wire in validateAndPayout() call |
| `scoreboard-api/server.ts` | Tivoli proxy (already complete) |
| `docs/SUPABASE_SETUP.md` | Detailed setup steps |
| `docs/INTEGRATION_EXAMPLE.md` | Code example for App.tsx |

## 🎯 High-Level Flow (Updated)

```
User loads game
  ↓
Frontend calls api.getIdentity() → scoreboard-api (proxy)
  ↓
Frontend calls api.createTransaction() → scoreboard-api (proxy)
  ↓
Game plays (2min timer)
  ↓
Timer ends → Score computed locally
  ↓
NEW: Frontend calls validateAndPayout() → Supabase Edge Function
  ├─ Edge Function recomputes score (authoritative)
  ├─ Checks rate-limit (10/min per user)
  ├─ Stores session in Supabase
  ├─ If win: calls scoreboard-api POST /tivoli/payout (proxy to Centralbank)
  ├─ Records payout (success/fail) in Supabase
  └─ Returns { validatedScore, payoutSuccess, payoutError }
  ↓
Frontend shows result with server-validated score
```

## ✨ Benefits of This Architecture

1. **Anti-Cheat**: Server recomputes score, client can't fake high scores
2. **Rate-Limiting**: Built-in 10 req/min prevents abuse and API overload
3. **Auditability**: All payouts logged in `payout_history` table
4. **Resilience**: Failed payouts don't break game flow, can retry
5. **Scalability**: Supabase Functions scale to 0, pay per invocation
6. **Observability**: SQL queries for monitoring and debugging
7. **Security**: No API keys in frontend, all secrets server-side

---

**Questions?** Check the troubleshooting section or open an issue on GitHub.
