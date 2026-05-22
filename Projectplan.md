# Fantastic Elastic Panda — Project Plan

> Tivoli School Assignment · 2 people · 3 weeks

---

# 1. Overview

Fantastic Elastic Panda is a Three.js blendshape-matching game where players attempt to recreate a target panda facial expression before time runs out.

The game uses:
- React
- TypeScript
- Three.js via React Three Fiber
- Supabase for backend validation and leaderboards

The player manipulates a 3D panda face using drag gestures. Scores are calculated based on how closely the player's blendshape values match the target expression.

The project includes:
- Full game loop
- Mobile-first interaction
- Supabase leaderboard
- Server-authoritative anti-cheat validation
- Centralbank API integration
- Admin configuration page

---

# 2. Project Scope

| | |
|---|---|
| Team | 2 people |
| Duration | 3 weeks |
| Frontend | React + TypeScript |
| 3D Engine | Three.js via @react-three/fiber |
| Backend | Supabase |
| Model Format | GLTF / GLB |
| Deployment | Early deployment recommended |

---

# 3. Core Features

## 3.1 Must — Core Gameplay

- Load GLTF panda model with working morph targets
- Two panda instances:
  - Target Panda
  - Player Panda
- Blendshape-based facial manipulation
- Touch + mouse drag controls
- Timer-based gameplay
- Blendshape score calculation
- Centralbank API integration
- Dynamic reward system
- Tutorial flow
- Leaderboard system
- Supabase-backed anti-cheat validation

---

## 3.2 Must — UI / UX

- Mobile-first layout
- Full viewport gameplay
- No page scroll
- Touch + mouse support
- Fullscreen support where available
- Animated transitions
- WCAG-compliant touch targets
- Accessible controls
- Contextual help overlays
- Responsive layout

---

## 3.3 Must — Backend & Security

Supabase is the authoritative backend.

Features:
- Authentication
- Session ownership
- Leaderboards
- Event storage
- Server-side score validation
- Anti-cheat validation
- Secure RPC / Edge Functions

---

## 3.4 Must — Highscore System

- Persistent leaderboard
- Top 10 scores
- Stored in Supabase
- Server-validated scores only
- Displayed inside modal component
- Highlight player when entering leaderboard

---

## 3.5 Should (If Time Allows)

- Drum roll audio
- Advanced animations
- Adjustable timer settings
- Additional reward tiers
- Enhanced leaderboard transitions

---

## 3.6 Could (Stretch Goals)

- Additional face regions
- Alternate panda skins

---

# 4. User Flow & UI Specification

# 4.1 First Visit Experience

When a player visits for the first time:

- Show tutorial modal
- 4-page slideshow
- Navigation:
  - Previous
  - Next
  - Skip
- Progress dots at bottom

---

## Tutorial Slides

### Slide 1
> Match the target panda’s expression before time runs out.

### Slide 2
> Drag the panda’s face using your finger or mouse to match the target expression.

### Slide 3
> The closer your match, the higher your score.

> Reach `{config.moneyBackThreshold}%` to win your money back.  
> Reach `{config.doubleWinThreshold}%` to double your reward.

### Slide 4
> Press “Play” when you’re ready.

---

# 4.2 Returning Users

Returning users skip the tutorial and go directly to the main screen.

---

# 4.3 Main Screen

## Visible Elements

### A. Player Panda
Interactive panda controlled by the player.

---

### B. Target Panda
- Neutral by default
- Idle blinking animation
- Expression changes during gameplay

---

### C. Controls Hint

Displays:
- Finger icon on mobile
- Mouse icon on desktop

Text:
> Drag to match

Includes:
- Question mark button
- Opens tutorial modal

---

### D. Play Button

```html
<h2>Play!</h2>
<p>Cost: €[actualCost]</p>
<img>[Coin]</img>
```

Cost value is dynamic.

---

### E. Reset Button

Resets:
- Player blendshapes to neutral

---

### F. Highscore Button

- Trophy icon
- Positioned top-left
- Opens leaderboard modal

Displays:
- Top 10 players
- Scores

---

# 4.4 Pre-Game Rules

Before gameplay:
- Player can freely manipulate PlayerPanda
- TargetPanda remains neutral

---

# 4.5 Game Start Flow

When Play is clicked:

## Immediate Actions

### Target Panda
- Random expression generated
- Animation system activated

### Player Panda
- Blendshapes reset to neutral

### Timer
- Appears top-left
- Animated entrance

### Play Button
- Shrink/fade animation
- Hidden afterward

### Controls Hint
- Shrink/fade animation
- Hidden afterward

---

# 4.6 Game End Flow

When timer expires:

## Immediate Actions

### Player Panda
- Expression freezes
- Still allowed to blink

### Delay
- Small suspense delay before results

---

## Results Modal

### Title

```html
<h2>Time’s up!</h2>
```

---

### Score Display

```text
Your score: [Score]
```

Animation:
- Count up from 0
- Ease-in animation
- Approx. 5 seconds

---

### Highscore Notification

If player enters leaderboard:
- Display special notification

---

### Result Messages

Examples:
- Amazing match!
- So close!
- Better luck next time!

---

### Reward Stamp

```text
You received...
[Reward from API]
```

---

## Modal Buttons

### Highscore
Displays leaderboard modal.

### Return to Tivoli
Returns player to Tivoli website.

---

# 5. Blendshape Control System

## Drag Zones

Invisible drag regions:
- Left Ear
- Right Ear
- Left Eyebrow
- Right Eyebrow
- Left Cheek
- Right Cheek
- Nose
- Mouth

---

## Gesture Mapping

| Gesture | Result |
|---|---|
| Drag up | Activates `_Up` |
| Drag down | Activates `_Down` |
| Drag left | Activates `_Left` |
| Drag right | Activates `_Right` |
| Diagonal | Blends both axes |

---

## Blendshape Rules

- Opposing shapes are mutually exclusive
- Symmetrical controls share logic
- Mirror support via `isRight`

---

# 6. Game Loop

| Step | Description |
|---|---|
| 1 | Supabase session created |
| 2 | Entry cost deducted |
| 3 | Target expression generated |
| 4 | Reveal animation plays |
| 5 | Match phase begins |
| 6 | Client records snapshots (~10Hz) |
| 7 | Timer expires |
| 8 | Samples submitted to Edge Function |
| 9 | Server validates gameplay |
| 10 | Score recomputed server-side |
| 11 | Reward payout triggered |
| 12 | Results displayed |

---

# 7. Supabase Architecture

Supabase is the authoritative backend.

---

## Responsibilities

### Client
- Rendering
- Input handling
- Snapshot collection

### Server
- Session validation
- Score recomputation
- Anti-cheat detection
- Leaderboards
- Secure payouts

---

# 7.1 Session Flow

## Start Game

Server creates:
- session_id
- started_at
- config snapshot

---

## During Gameplay

Client records:

```ts
{
  ts: Date.now(),
  sample: {
    Mouth_Left: 0.4,
    Eye_Right_Up: 0.7
  }
}
```

Recommended rate:
- ~10Hz

---

## End Game

Client submits:
- sessionId
- sample array

to:
- Supabase Edge Function

---

## Validation

Server validates:
- Session ownership
- Timestamp order
- Sample rate
- Impossible movement
- Duration limits
- Blendshape sanity
- Recomputed score

Only server-computed scores are valid.

---

# 7.2 Anti-Cheat Strategy

## Never Trust the Client

The client:
- Can be modified
- Can fake scores

The server:
- Recomputes score
- Validates all gameplay

---

## Validation Rules

- Monotonic timestamps
- Max sample rate
- No future timestamps
- Reasonable movement deltas
- Session duration validation
- Payload sanity checks

---

# 7.3 Database Tables

## sessions

Stores:
- User ID
- Start time
- Config snapshot
- Session status

---

## events

Stores:
- Timestamped blendshape samples

---

## results

Stores:
- Validated score
- Leaderboard data
- Reward metadata

---

# 7.4 Security

Required:
- Row Level Security (RLS)
- Authenticated writes
- Server-side validation
- Hidden service_role keys

Never:
- Trust client score
- Expose admin credentials
- Accept direct leaderboard writes

---

# 8. Project Structure

```txt
fantastic-elastic-panda/
├── public/
│   └── panda.glb
│
├── src/
│   ├── api/
│   │   ├── centralbank.ts
│   │   ├── antiCheat.ts
│   │   ├── leaderboard.ts
│   │   └── session.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── types.ts
│   │
│   ├── components/
│   │   ├── scene/
│   │   ├── controls/
│   │   ├── ui/
│   │   └── admin/
│   │
│   ├── hooks/
│   ├── utils/
│   ├── config/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

# 9. Packages

| Package | Purpose |
|---|---|
| react | UI |
| typescript | Type safety |
| vite | Bundler |
| three | 3D engine |
| @react-three/fiber | React renderer |
| @react-three/drei | Helpers |
| zustand | State management |
| framer-motion | Animations |
| @supabase/supabase-js | Backend |
| zod | Runtime validation |
| nanoid | IDs |

---

# 10. Accessibility

Requirements:
- Keyboard support
- Touch targets ≥ 44x44px
- Clear feedback
- Mobile usability
- Visible instructions
- Consistent interactions

---

# 11. Mobile Layout Strategy

| Region | Content |
|---|---|
| Top Bar | Timer + balance |
| Main Area | Panda canvas |
| Bottom Bar | Buttons + status |

---

## Fullscreen

### Android/Desktop
Use Fullscreen API.

### iOS Safari
Fallback:
- 100dvh
- touch-action: none

---

# 12. 3-Week Timeline

# Week 1 — Core 3D Systems

| Day | Tasks |
|---|---|
| 1 | Setup project + load GLTF |
| 2 | Morph target testing |
| 3 | Build drag controls |
| 4 | Implement all control zones |
| 5 | Random face generator |

---

# Week 2 — Gameplay + Backend

| Day | Tasks |
|---|---|
| 6 | Game state machine |
| 7 | Timer + transitions |
| 8 | Score calculation |
| 9 | Supabase setup |
| 10 | Edge Functions + leaderboard |

---

# Week 3 — Polish + Validation

| Day | Tasks |
|---|---|
| 11 | Anti-cheat validation |
| 12 | Admin page |
| 13 | Score animations |
| 14 | Cross-device QA |
| 15 | Final deploy + docs |

---

# 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| GLTF issues | Test early |
| Touch conflicts | Disable scroll |
| Fake scores | Server validation |
| Large payloads | Sample throttling |
| Edge Function cold starts | Lightweight validation |

---

# 14. Recommended Architecture

Recommended stack:
- React
- TypeScript
- React Three Fiber
- Supabase
- Edge Functions
- Server-authoritative validation

This architecture is:
- Secure
- Scalable
- Mobile-friendly
- Production-oriented
- Realistic within 3 weeks

---

# 15. Documentation Links

## React Three Fiber
https://r3f.docs.pmnd.rs/getting-started/introduction

## Drei
https://drei.docs.pmnd.rs

## GLTFJSX
https://github.com/pmndrs/gltfjsx

## Three.js
https://threejs.org/docs

## Supabase
https://supabase.com/docs
