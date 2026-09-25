# 🏄 Subtext Surfers

A colorful pixel-art browser game for the **Subtext Surfers** team (conversation
design & data science for sipgate's AI agents). Ride the waves of conversation:
collect the letters of good words, dodge the bad ones, grab coffee & Mate —
and don't overcharge!

Built as a static web app (no build step) with Netlify Functions for the
optional GitHub sign-in.

## 🎮 Gameplay

- **3 lanes** — switch with `←`/`→` or `A`/`D` (the surfboard tilts along)
- **Jump** (`↑`/`W`) over Mate crates & sofas, **duck** (`↓`/`S`) under the Mate bar signs
- **Good words** (collect the letters!): `SIPGATE`, `SONA`, `AGENT`, `VOICE`
- **Bad words** (dodge!): `LATENCY`, `BUG`, `HALLUCINATION`, `ERROR`
- **Tricks**: press `Space` twice in a row with the right timing → bonus points
  and **style points ✦**
- **Caffeine**: coffee ☕ and Mate 🧉 are rare treats — they make you faster
  and speed up the music. Overcharge the bar and your controls invert and
  vibrate — it decays over time.
- **Lives**: you start with 5. Heal with vegan chocolate croissants 🥐 from
  the sipgate kitchen.
- **Difficulty ramp**: the run starts with long, obstacle-free stretches
  (perfect for tricks!) and slowly gets busier and faster over time.
- **Unlocks** (bought with style points ✦): 2 extra surfboards, 3 funny hats,
  rainbow water, **Lippo** 🐶 the dog companion + his boards, sparkles and hats.
- **Pause**: `P` or `Esc`

Helge explains everything in the in-game tutorial on your first run. 🎓

## 🕹 Run locally

Just serve the folder (no build step):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Audio starts with the first click (browser autoplay policy).

## 🚀 Deploy to Netlify

1. Push this repo to GitHub (it's already structured for it).
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
   Build command: *(empty)* · Publish directory: `.` (both preset in `netlify.toml`).
3. Done. 🎉

### Login

Logins are **name + password**: pick a name and a password once to create
your surfer, and log in with them later to get your highscore, style points
and unlocks back. The password is only a local gate for the browser profile
(SHA-256-hashed in `localStorage`) — it never leaves the device. Switch
players via "🔑 Switch player" on the start screen.

## 🔧 Tech notes

- Pure HTML/JS/CSS + Canvas 2D, all pixel art generated in code (nyan-cat vibe)
- `assets/audio/background.wav` — the team's 8-bit track, looped via Web Audio,
  playback rate tied to the caffeine level
- Player data (logins incl. SHA-256 password hashes, highscores, style
  points, unlocks) lives in `localStorage`

## 📁 Structure

```
index.html                – screens & HUD
assets/styles.css         – sparkly pixel UI
assets/js/sprites.js      – pixel font & all generated art
assets/js/audio.js        – music (caffeine tempo!) & pling sounds
assets/js/storage.js      – players, highscores, unlocks, shop items
assets/js/game.js         – engine: lanes, physics, collisions, rendering
assets/js/main.js         – UI glue: login, start screen, shop, tutorial, HUD
```

*Made with 🌈 by the Subtext Surfers.*
