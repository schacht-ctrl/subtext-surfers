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
- **Caffeine**: coffee ☕ and Mate 🧉 make you faster and speed up the music.
  Overcharge the bar and your controls invert and vibrate — it decays over time.
- **Lives**: you start with 10. Heal with vegan chocolate croissants 🥐 from
  the sipgate kitchen.
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

### Optional: GitHub sign-in (company GitHub verification)

The game works with a plain name login (stored locally in the browser).
To link logins to the employees' GitHub accounts:

1. Create an **OAuth App** in the company GitHub org
   (Settings → Developer settings → OAuth Apps):
   - **Authorization callback URL**: `https://YOUR-SITE.netlify.app/api/auth-callback`
2. In Netlify → Site settings → Environment variables, set:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
3. Redeploy. The "Sign in with GitHub 🐙" button appears on the login screen
   and marks player accounts as verified ✔.

## 🔧 Tech notes

- Pure HTML/JS/CSS + Canvas 2D, all pixel art generated in code (nyan-cat vibe)
- `assets/audio/background.wav` — the team's 8-bit track, looped via Web Audio,
  playback rate tied to the caffeine level
- Player data (logins, highscores, style points, unlocks) lives in `localStorage`
- `netlify/functions/` — GitHub OAuth flow (config probe, login redirect, callback)

## 📁 Structure

```
index.html                – screens & HUD
assets/styles.css         – sparkly pixel UI
assets/js/sprites.js      – pixel font & all generated art
assets/js/audio.js        – music (caffeine tempo!) & pling sounds
assets/js/storage.js      – players, highscores, unlocks, shop items
assets/js/game.js         – engine: lanes, physics, collisions, rendering
assets/js/main.js         – UI glue: login, start screen, shop, tutorial, HUD
netlify/functions/*.js    – optional GitHub OAuth
```

*Made with 🌈 by the Subtext Surfers.*
