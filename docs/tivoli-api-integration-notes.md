# Tivoli Centralbank API — Fantastic Elastic Panda Integration Notes

## Our Role

Fantastic Elastic Panda is a Tivoli amusement of type `game`.

We do not handle Tivoli login. Tivoli sends players to our deployed game with an `identity_token`.

---

## Base URL

```
https://api-develop-b059.up.railway.app
```

---

## Required Values

| Value | Source |
|---|---|
| `identity_token` | URL query parameter |
| `api_key` | Our registered amusement |
| `transactionId` | Response from `POST /transactions` |

> **Note:** `api_key` is sent in the **request body**, not in headers.

---

## Player Entry Flow

Tivoli redirects the player to:

```
https://our-game-url.com/?identity_token=<token>
```

On page load:

1. Read `identity_token` from the URL
2. Remove it from the URL immediately:
   ```js
   window.history.replaceState({}, "", window.location.pathname);
   ```
3. Optionally resolve player info:

```
GET /identity-tokens/{token}
```

**Returns:**

```json
{
  "user": { "id": 1, "name": "Amin" },
  "expires_at": "2026-05-18T11:25:00+00:00"
}
```

---

## Start Game / Payment

When the player clicks **Play**:

```
POST /transactions
```

**Body:**

```json
{
  "identity_token": "string",
  "amount": 5.00,
  "api_key": "string"
}
```

**Returns:**

```json
{
  "id": 42,
  "stamp": { ... }
}
```

Save `id` for payout and `stamp` for the result screen.

---

## Spin Again Rules

Identity tokens can be reused for playing again. However:

- Only the **first use** of an identity token gives a stamp.
- A player can only get **one stamp from the same amusement every 3 minutes**.
- Re-entering from Tivoli does **not** bypass this cooldown.

---

## Finish Game / Payout

After the timer ends, Supabase validates the score server-side.

If the player wins:

```
POST /transactions/{transactionId}/payout
```

**Body:**

```json
{
  "amount": 10.00,
  "api_key": "string"
}
```

**Suggested payout logic:**

```ts
if (score >= 95) payout = price * 2;
else if (score >= 90) payout = price;
else payout = 0;
```

> Only call the payout endpoint if `payout > 0`.

---

## Stamps

A valid paid play may return a stamp automatically from `POST /transactions`.

**Animals:**
- `lion`
- `dolphin`
- `toucan`
- `beetlebug`
- `snake`

**Metals:**
- `silver`
- `gold`
- `platinum`
- `null` (no metal)

**Useful fields:**

```ts
stamp.stamptype.animal
stamp.stamptype.metal
stamp.image_url
```

---

## Important Error Codes

| Code | Meaning |
|---|---|
| `401` | Invalid / expired / used token, or bad `api_key` |
| `402` | Insufficient user balance |
| `409` | Conflict (e.g. already paid out) |
| `422` | Validation error |

For `401`, show a clear message and provide a link back to Tivoli.

---

## Revenue / VP Risk

All income from our game is split directly between group members.

> ⚠️ If **total winnings > total stakes**, amusement owners receive **0 VP** regardless of collected stamps.

---

## Endpoints We Use

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/identity-tokens/{token}` | Greet player on page load |
| `POST` | `/transactions` | Charge player, get stamp |
| `POST` | `/transactions/{id}/payout` | Pay winnings to player |

---

## Endpoints We Do Not Need

- `/activate`
- `/login`
- `/logout`
- `/csrf-token`
- `/user`
- `/groups`
- `/stamps`
- `/exchanges`
- `/votes`
- `/settle`
- `/leaderboard`

---

## Recommended Game Flow

```
Page load
  → Read identity_token from URL
  → Scrub token from URL
  → Greet player (optional GET /identity-tokens/{token})

Play clicked
  → POST /transactions
  → Save transaction id + stamp
  → Start game / timer

Timer ends
  → Validate score server-side (Supabase Edge Function)
  → If win: POST /transactions/{id}/payout
  → Show result: score + stamp + reward message
```

---

## Supabase vs Centralbank — Responsibility Split

| Concern | Handled by |
|---|---|
| Payments | Centralbank |
| Stamps | Centralbank |
| Payouts | Centralbank |
| Tivoli economy | Centralbank |
| Game sessions | Supabase |
| Anti-cheat | Supabase |
| Score validation | Supabase |
| Leaderboard | Supabase |

> **Do not** replace Centralbank with Supabase for money or stamps. Both systems serve distinct roles.