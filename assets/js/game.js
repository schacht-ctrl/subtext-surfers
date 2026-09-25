/* ==========================================================================
 * Subtext Surfers – game.js
 * Pseudo-3D endless surfer: 3 lanes, jump/duck obstacles, good letters to
 * collect, bad words to dodge, tricks, caffeine madness and Lippo.
 * ========================================================================== */
'use strict';

const Game = (() => {

  /* ----------------------------- constants ----------------------------- */
  const W = 960, H = 540;
  const HORIZON_Y = 168;
  const BASE_Y = 468;              // player baseline (feet)
  const LANE_W = 252;              // lane x-offset at s = 1
  const Z_MAX = 60;                 // spawn distance
  const COLLIDE_Z = 1.15;          // collision window around z = 0
  const MAX_LIVES = 5;
  const CAFF_MAX = 100;
  const OVERCHARGE = 85;           // above this: vibration + inverted controls
  const RAMP_DIST = 2400;          // distance over which difficulty reaches max
  const GOOD_WORDS = ['SIPGATE', 'SONA', 'AGENT', 'VOICE'];
  const BAD_WORDS = ['LATENCY', 'BUG', 'HALLUCINATION', 'ERROR'];
  const LETTER_SCORE = 10, WORD_SCORE = 100, CROISSANT_SCORE = 25;
  const TRICK_WINDOW = 400;        // ms between the two space presses
  const INVULN_TIME = 1.6;

  /* ------------------------------- state ------------------------------- */
  const canvas = null; // set in init
  let ctx = null;
  let state = 'idle';            // idle | running | paused | tutorial | over
  let raf = null, lastT = 0;

  let playerName = '', characterId = 'wave', loadout = null, firstRun = false;

  let entities = [], particles = [], stars = [];
  let distance = 0, score = 0, lives = MAX_LIVES, caffeine = 0;
  let trickRunPts = 0, combo = 1, comboUntil = 0;
  let overcharged = false, invulnUntil = 0, shakeT = 0;
  let spawnAcc = 0, pickupAcc = 0;
  let activeWord = null;          // { word, trail: [{char, collected, done}] }
  let lastSpace = 0, trickT = 0, trickAirborne = false;
  let caffInvert = false;

  const player = {
    lane: 0, targetLane: 0, visualX: 0,
    jumpT: -1, ducking: false,
  };
  const lippo = { lane: 0, x: 0, bob: 0 };

  /* ----------------------------- projection ---------------------------- */
  function scaleAt(z) { return 1 / (1 + z * 0.075); }
  function xAt(lane, s) { return W / 2 + lane * LANE_W * s; }
  function yAt(s) { return HORIZON_Y + (BASE_Y - HORIZON_Y) * s; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* difficulty 0 → 1 over the first RAMP_DIST units, then stays maxed */
  function difficulty01() { return Math.max(0, Math.min(1, distance / RAMP_DIST)); }

  /* ------------------------------- init -------------------------------- */
  function init(canvasEl) {
    ctx = canvasEl.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    makeStars();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  function makeStars() {
    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * (HORIZON_Y - 10),
        size: Math.random() < 0.3 ? 2 : 1,
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2,
        color: ['#ffffff', '#ffd23f', '#5bb9eb', '#ff5d8f', '#7ee787'][Math.floor(Math.random() * 5)],
      });
    }
  }

  /* ----------------------------- run control --------------------------- */
  function startRun(opts) {
    playerName = opts.name;
    characterId = opts.character;
    loadout = opts.loadout;
    firstRun = !!opts.tutorial;
    entities = []; particles = [];
    distance = 0; score = 0; lives = MAX_LIVES; caffeine = 0;
    trickRunPts = 0; combo = 1; comboUntil = 0;
    overcharged = false; invulnUntil = 0; shakeT = 0;
    spawnAcc = 0; pickupAcc = 0; activeWord = null;
    lastSpace = 0; trickT = 0;
    player.lane = 0; player.targetLane = 0; player.visualX = 0;
    player.jumpT = -1; player.ducking = false;
    lippo.lane = 0; lippo.x = 0;
    state = firstRun ? 'tutorial' : 'running';
    if (typeof MainUI !== 'undefined') MainUI.showTutorial(firstRun ? true : false);
    AudioSys.init().then(() => AudioSys.startMusic());
    lastT = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function endTutorial() {
    if (state === 'tutorial') { state = 'running'; lastT = performance.now(); }
  }

  function stop() {
    state = 'idle';
    AudioSys.stopMusic();
  }

  function gameOver() {
    state = 'over';
    AudioSys.SFX.gameover();
    AudioSys.stopMusic();
    const isBest = Storage.recordRun(playerName, score, trickRunPts);
    if (typeof MainUI !== 'undefined') MainUI.showGameOver(score, isBest, trickRunPts);
  }

  function togglePause() {
    if (state === 'running') { state = 'paused'; AudioSys.stopMusic(); }
    else if (state === 'paused') { state = 'running'; AudioSys.startMusic(); lastT = performance.now(); }
    if (typeof MainUI !== 'undefined') MainUI.updateHUDVisibility(state);
  }

  /* ------------------------------- input -------------------------------- */
  function onKeyDown(e) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar'].includes(e.key)) e.preventDefault();
    const k = e.key.toLowerCase();
    // pause/unpause works in any active state
    if (k === 'escape' || k === 'p') { togglePause(); return; }
    if (state !== 'running') return;
    const invert = caffInvert && overcharged;
    if (k === 'arrowleft' || k === 'a') switchLane(invert ? 1 : -1);
    else if (k === 'arrowright' || k === 'd') switchLane(invert ? -1 : 1);
    else if (k === 'arrowup' || k === 'w') jump();
    else if (k === 'arrowdown' || k === 's') { player.ducking = true; }
    else if (k === ' ' || e.key === 'Spacebar') spacePress();
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowdown' || k === 's') player.ducking = false;
  }

  function switchLane(dir) {
    player.targetLane = Math.max(-1, Math.min(1, player.targetLane + dir));
    if (player.targetLane !== player.lane) {
      player.lane = player.targetLane;
      AudioSys.SFX.ui();
    }
  }

  function jump() {
    if (player.jumpT < 0) {
      player.jumpT = 0;
      AudioSys.SFX.ui();
    }
  }

  function spacePress() {
    const now = performance.now();
    const since = now - lastSpace;
    if (lastSpace > 0 && since <= TRICK_WINDOW) {
      doTrick();
      lastSpace = 0;
    } else {
      lastSpace = now;
    }
  }

  function doTrick() {
    if (trickT > 0) return;                 // already spinning
    trickT = 0.55;
    trickAirborne = player.jumpT >= 0;
    if (player.jumpT < 0) player.jumpT = 0; // little hop if grounded
    if (performance.now() < comboUntil) combo = Math.min(5, combo + 1);
    else combo = 1;
    comboUntil = performance.now() + 3000;
    const pts = 50 * combo;
    score += pts;
    trickRunPts += 25 * combo;
    AudioSys.SFX.trick();
    burst(24, '#ffd23f', '#ff5d8f');
    if (typeof MainUI !== 'undefined') MainUI.flashMessage(`TRICK! +${pts} (x${combo})`);
  }

  /* ------------------------------ spawning ------------------------------ */
  function spawnRow() {
    const d = difficulty01();
    // good words keep appearing at a steady pace once a trail is finished
    if (!activeWord && Math.random() < 0.45) {
      spawnLetterTrail();
      return;
    }
    // obstacles ramp up slowly; early runs get long plain stretches for tricks
    if (Math.random() < lerp(0.35, 0.92, d)) spawnObstacles();
    // otherwise: plain open water this row
  }

  function spawnObstacles() {
    const d = difficulty01();
    // choose 1–2 blocked lanes, keep at least one lane free of bad words
    const lanes = [-1, 0, 1].sort(() => Math.random() - 0.5);
    const n = Math.random() < lerp(0.15, 0.45, d) ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const lane = lanes[i];
      const kindRoll = Math.random();
      let type;
      if (kindRoll < lerp(0.25, 0.42, d)) type = 'badword';
      else if (kindRoll < 0.6) type = 'crate';
      else if (kindRoll < 0.8) type = 'bar';
      else type = 'sofa';
      entities.push({
        type, lane, z: Z_MAX,
        word: type === 'badword' ? BAD_WORDS[Math.floor(Math.random() * BAD_WORDS.length)] : null,
        hit: false,
      });
      // a second bad word only appears later in the run — and never in all
      // three lanes, so there is always a dodgeable way through
      if (type === 'badword' && i === 0 && Math.random() < 0.2 * d) {
        entities.push({ type: 'badword', lane: lanes[1], z: Z_MAX + 4, word: BAD_WORDS[Math.floor(Math.random() * BAD_WORDS.length)], hit: false });
        break;
      }
    }
  }

  function spawnLetterTrail() {
    const word = GOOD_WORDS[Math.floor(Math.random() * GOOD_WORDS.length)];
    let lane = Math.floor(Math.random() * 3) - 1;
    const trail = [];
    for (let i = 0; i < word.length; i++) {
      if (i > 0 && Math.random() < 0.5) lane = Math.max(-1, Math.min(1, lane + (Math.random() < 0.5 ? -1 : 1)));
      entities.push({ type: 'letter', lane, z: Z_MAX + i * 3.4, char: word[i], idx: i, collected: false });
      trail.push(i);
    }
    activeWord = { word, next: 0, count: word.length, remaining: word.length };
  }

  function spawnPickup(lane) {
    lane = (lane !== undefined) ? lane : (Math.floor(Math.random() * 3) - 1);
    const roll = Math.random();
    let type;
    // coffee & Mate are rarer now; croissants heal the 5 lives you have
    if (roll < 0.3) type = 'coffee';
    else if (roll < 0.55) type = 'mate';
    else type = 'croissant';
    entities.push({ type, lane, z: Z_MAX, collected: false });
  }

  /* ------------------------------ particles ----------------------------- */
  function burst(n, c1, c2) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: W / 2 + (Math.random() * 120 - 60), y: BASE_Y - 120,
        vx: Math.random() * 300 - 150, vy: -Math.random() * 260 - 60,
        life: 0.9 + Math.random() * 0.4, t: 0,
        color: Math.random() < 0.5 ? c1 : c2, size: 2 + Math.floor(Math.random() * 3),
      });
    }
  }

  function plingFx(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x, y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130,
        life: 0.5, t: 0, color, size: 2,
      });
    }
  }

  /* ------------------------------- update ------------------------------- */
  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (state === 'running' || state === 'tutorial' || state === 'over') update(dt);
    render(t / 1000);
    if (state === 'running') MainUI_updateHUD();
  }

  function baseSpeed() {
    return 15 + Math.min(distance * 0.003, 8);
  }

  function update(dt) {
    const t = performance.now();
    // tutorial and game-over keep the scenery gently moving
    if (state !== 'running') {
      updateParticles(dt);
      return;
    }

    // speed & distance
    const speed = baseSpeed() * (1 + caffeine / CAFF_MAX * 0.55);
    distance += speed * dt;
    score += speed * dt * 0.8;

    // caffeine decay
    caffeine = Math.max(0, caffeine - 4.5 * dt);
    if (overcharged && caffeine <= OVERCHARGE) overcharged = false;
    AudioSys.setMusicRate(1 + (caffeine / CAFF_MAX) * 0.5);

    // jump / duck / trick
    if (player.jumpT >= 0) {
      player.jumpT += dt;
      if (player.jumpT > 0.55) player.jumpT = -1;
    }
    if (trickT > 0) trickT -= dt;

    // lane visual lerp
    player.visualX += (player.lane - player.visualX) * Math.min(1, dt * 11);

    // lippo follows
    if (loadout && loadout.lippo) {
      lippo.x += (player.lane - lippo.x) * Math.min(1, dt * 5);
      lippo.lane = Math.round(lippo.x);
      lippo.bob += dt;
    }

    // spawning – rows start far apart (long plain stretches for tricks)
    // and tighten slowly as the run progresses, so dodging stays fair
    spawnAcc += speed * dt;
    const gap = lerp(17, 6.5, difficulty01());
    if (spawnAcc > gap) { spawnAcc = 0; spawnRow(); }

    // pickups run on their own, slower rhythm (coffee/Mate are a treat now)
    pickupAcc += speed * dt;
    const pickupGap = lerp(34, 17, difficulty01());
    if (pickupAcc > pickupGap) { pickupAcc = 0; if (Math.random() < 0.8) spawnPickup(); }

    // entities
    for (const e of entities) e.z -= speed * dt;
    handleCollisions(t);
    entities = entities.filter(e => e.z > -4);
    checkWordTrail();

    updateParticles(dt);

    if (shakeT > 0) shakeT -= dt;
    if (invulnUntil > 0 && t > invulnUntil) invulnUntil = 0;
  }

  function updateParticles(dt) {
    for (const p of particles) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt;
    }
    particles = particles.filter(p => p.t < p.life);
  }

  function handleCollisions(t) {
    const jumping = player.jumpT >= 0;
    const jumpFrac = jumping ? Math.sin(Math.min(1, player.jumpT / 0.55) * Math.PI) : 0;
    for (const e of entities) {
      if (e.z < -0.2 || e.z > COLLIDE_Z) continue;
      if (e.type === 'badword' || e.type === 'crate' || e.type === 'bar' || e.type === 'sofa') {
        if (e.hit) continue;
        if (e.lane !== player.lane) continue;
        let safe = false;
        if (e.type === 'crate') safe = jumpFrac > 0.35;
        else if (e.type === 'sofa') safe = jumpFrac > 0.5;
        else if (e.type === 'bar') safe = player.ducking;
        // badword: never safe in-lane
        if (!safe && t > invulnUntil) {
          hitPlayer(t);
          e.hit = true;
        }
      } else if (!e.collected && e.lane === player.lane) {
        collect(e);
      }
    }
  }

  function hitPlayer(t) {
    lives -= 1;
    invulnUntil = t + INVULN_TIME * 1000;
    shakeT = 0.45;
    combo = 1;
    AudioSys.SFX.hit();
    burst(16, '#ff5d8f', '#ffffff');
    if (lives <= 0) { lives = 0; gameOver(); }
    MainUI_updateHUD(true);
  }

  function collect(e) {
    e.collected = true;
    const s = scaleAt(Math.max(0, e.z));
    const px = xAt(e.lane, s), py = yAt(s) - 30;
    if (e.type === 'letter') {
      AudioSys.SFX.letter();
      plingFx(px, py, '#ffd23f');
      if (activeWord && activeWord.word[activeWord.next] === e.char) {
        activeWord.next += 1;
        score += LETTER_SCORE;
        if (activeWord.next >= activeWord.count) {
          score += WORD_SCORE;
          AudioSys.SFX.word();
          burst(30, '#7ee787', '#ffd23f');
          MainUI.flashMessage(`${activeWord.word}! +${WORD_SCORE}`);
          activeWord = null;
        }
      } else {
        score += 5;
      }
    } else if (e.type === 'coffee' || e.type === 'mate') {
      const v = e.type === 'coffee' ? 22 : 38;
      caffeine = Math.min(CAFF_MAX + 25, caffeine + v);
      if (caffeine > CAFF_MAX) caffeine = CAFF_MAX;
      if (!overcharged && caffeine > OVERCHARGE) {
        overcharged = true;
        caffInvert = true;
        AudioSys.SFX.overcharge();
        MainUI.flashMessage('⚠ OVERCHARGED! Controls wobbling…');
      }
      (e.type === 'coffee' ? AudioSys.SFX.coffee : AudioSys.SFX.mate)();
      plingFx(px, py, e.type === 'coffee' ? '#f5f0e6' : '#7ee787');
    } else if (e.type === 'croissant') {
      lives = Math.min(MAX_LIVES, lives + 2);
      score += CROISSANT_SCORE;
      AudioSys.SFX.croissant();
      plingFx(px, py, '#f0b45f');
      MainUI.flashMessage('🥐 +2 lives');
    }
    MainUI_updateHUD(true);
  }

  function checkWordTrail() {
    if (!activeWord) return;
    // if all letters of the trail despawned, start a fresh word
    const trailLetters = entities.filter(e => e.type === 'letter');
    if (trailLetters.length === 0) {
      if (activeWord.next >= activeWord.count) activeWord = null;
      else activeWord = null; // missed letters → word forfeited
    }
  }

  /* ------------------------------- render ------------------------------- */
  function render(time) {
    if (!ctx) return;
    ctx.save();
    if (shakeT > 0) {
      ctx.translate((Math.random() - 0.5) * 12 * shakeT, (Math.random() - 0.5) * 10 * shakeT);
    }

    drawSky(time);
    drawWater(time);
    drawLaneFoam(time);
    drawEntities(time);
    if (state === 'running' || state === 'paused' || state === 'tutorial') drawPlayer(time);
    drawParticles();

    ctx.restore();
  }

  function drawSky(time) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON_Y + 40);
    g.addColorStop(0, '#1a1040');
    g.addColorStop(0.5, '#7b3fa8');
    g.addColorStop(0.85, '#ff6fb5');
    g.addColorStop(1, '#ffb347');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, HORIZON_Y + 60);

    // sun
    const sx = W - 110, sy = 74;
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 8; i++) {
      const a = time * 0.8 + i * Math.PI / 4;
      ctx.fillRect(sx + Math.cos(a) * 34 - 2, sy + Math.sin(a) * 34 - 2, 4, 4);
    }
    ctx.fillStyle = '#fff2b0';
    ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill();

    // twinkling stars
    for (const st of stars) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * st.speed + st.phase));
      ctx.globalAlpha = tw;
      ctx.fillStyle = st.color;
      ctx.fillRect(st.x, st.y, st.size, st.size);
      if (st.size > 1) {
        ctx.fillRect(st.x - st.size, st.y, st.size * 3, st.size > 1 ? 1 : st.size);
        ctx.fillRect(st.x, st.y - st.size, st.size > 1 ? 1 : st.size, st.size * 3);
      }
    }
    ctx.globalAlpha = 1;

    // blinking skyline strip at the horizon
    for (let i = 0; i < 24; i++) {
      const on = Math.sin(time * 3 + i * 1.7) > 0;
      ctx.fillStyle = on ? '#fff2b0' : '#7b3fa8';
      const bx = (i * 41 + (time * 8) % 41) % (W + 40) - 20;
      ctx.fillRect(bx, HORIZON_Y - 4 - (i % 3) * 3, 3, 4 + (i % 3) * 3);
    }
  }

  function drawWater(time) {
    const rainbow = loadout && loadout.rainbowWater;
    const cols = rainbow
      ? ['#ff5d8f', '#ff9f45', '#ffd23f', '#7ee787', '#5bb9eb', '#b07cff']
      : ['#2a7fd4', '#3a9be8', '#5bb9eb', '#79c8f2', '#9adcf7'];

    const rows = 34;
    for (let i = 0; i < rows; i++) {
      const f = i / rows;
      const y0 = HORIZON_Y + f * (H - HORIZON_Y);
      const y1 = HORIZON_Y + ((i + 1) / rows) * (H - HORIZON_Y);
      const scroll = Math.sin(time * 1.2 + i * 0.8) * 0.5 + 0.5;
      const idx = Math.floor((i + time * (rainbow ? 6 : 3)) % cols.length);
      ctx.fillStyle = cols[Math.abs(idx) % cols.length];
      ctx.globalAlpha = 0.35 + f * 0.55 + scroll * 0.08;
      ctx.fillRect(-20, y0, W + 40, y1 - y0 + 1);
    }
    ctx.globalAlpha = 1;

    // glints
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 26; i++) {
      const gy = HORIZON_Y + 14 + ((i * 53 + time * 90) % (H - HORIZON_Y - 20));
      const gx = (i * 137 + time * 120 * (1 + i % 3)) % W;
      if (Math.sin(time * 4 + i) > 0.2) ctx.fillRect(gx, gy, 3, 2);
    }
  }

  function drawLaneFoam(time) {
    // dashed foam lines racing toward the player mark the lanes
    const gap = 4;
    for (const lane of [-1, 0, 1]) {
      for (let z = -(distance % gap); z < Z_MAX; z += gap) {
        const s = scaleAt(z);
        const y = yAt(s);
        const x = xAt(lane, s);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        const w = Math.max(2, 26 * s);
        ctx.fillRect(x - w / 2, y - 2, w, Math.max(1.5, 4 * s));
      }
    }
  }

  function drawEntities(time) {
    const sorted = entities.slice().sort((a, b) => b.z - a.z);
    for (const e of sorted) {
      if (e.z < -3) continue;
      const s = scaleAt(Math.max(0, e.z));
      const x = xAt(e.lane, s);
      const y = yAt(s);
      const bob = Math.sin(time * 3 + e.z) * 3 * s;

      if (e.type === 'badword') {
        const spr = Sprites.badWordSprite(e.word);
        const w = spr.width * s * 1.6, h = spr.height * s * 1.6;
        ctx.drawImage(spr, x - w / 2, y - h - 26 * s, w, h);
      } else if (e.type === 'crate') {
        const spr = Sprites.crateSprite();
        const w = spr.width * s * 3, h = spr.height * s * 3;
        ctx.drawImage(spr, x - w / 2, y - h, w, h);
      } else if (e.type === 'bar') {
        const spr = Sprites.barSprite();
        const w = spr.width * s * 3, h = spr.height * s * 3;
        // bar floats: duck under the plank
        ctx.drawImage(spr, x - w / 2, y - h - 46 * s, w, h);
      } else if (e.type === 'sofa') {
        const spr = Sprites.sofaSprite();
        const w = spr.width * s * 3, h = spr.height * s * 3;
        ctx.drawImage(spr, x - w / 2, y - h, w, h);
      } else if (e.type === 'letter') {
        if (e.collected) continue;
        const spr = Sprites.letterSprite(e.char, '#ffd23f');
        const w = spr.width * s * 2.2, h = spr.height * s * 2.2;
        // golden sparkle ring
        ctx.save();
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 6 + e.z);
        ctx.drawImage(spr, x - w / 2, y - 60 * s + bob - h / 2, w, h);
        ctx.restore();
      } else if (e.type === 'coffee' || e.type === 'mate' || e.type === 'croissant') {
        if (e.collected) continue;
        const spr = e.type === 'coffee' ? Sprites.coffeeSprite() : e.type === 'mate' ? Sprites.mateSprite() : Sprites.croissantSprite();
        const w = spr.width * s * 2.2, h = spr.height * s * 2.2;
        ctx.drawImage(spr, x - w / 2, y - 40 * s + bob - h / 2, w, h);
      }
    }
  }

  function drawPlayer(time) {
    const jumpFrac = player.jumpT >= 0 ? Math.sin(Math.min(1, player.jumpT / 0.55) * Math.PI) : 0;
    const bob = Math.sin(time * 4.2) * 2.5;
    const px = xAt(player.visualX, 1);
    let py = BASE_Y - jumpFrac * 120 + bob;

    // overcharged vibration
    if (overcharged) {
      const jx = (Math.random() - 0.5) * 10;
      const jy = (Math.random() - 0.5) * 8;
      ctx.save();
      ctx.translate(jx, jy);
    }

    // invulnerability flicker
    const t = performance.now();
    if (invulnUntil > 0 && Math.floor(t / 90) % 2 === 0) {
      if (overcharged) ctx.restore();
      return;
    }

    const pose = player.ducking && player.jumpT < 0 ? 'duck' : (player.jumpT >= 0 ? 'jump' : 'run');
    const spr = Sprites.surferSprite(characterId, pose);
    const scale = 3.2;
    const w = spr.width * scale, h = spr.height * scale;

    // lane-change tilt (surfboard movement)
    const laneDiff = player.lane - player.visualX;
    const tilt = laneDiff * -0.35;

    // shadow on the water
    ctx.fillStyle = 'rgba(10,20,60,0.35)';
    ctx.beginPath();
    ctx.ellipse(px, BASE_Y + 12 - jumpFrac * 4, 46 - jumpFrac * 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // lippo first (slightly behind)
    if (loadout && loadout.lippo) {
      const lx = xAt(lippo.x, 0.92) - 64; // rides just beside the surfer
      const ly = yAt(0.92) + Math.sin(lippo.bob * 3.4) * 4;
      const lspr = Sprites.lippoSprite();
      const lw = lspr.width * 3, lh = lspr.height * 3;
      Sprites.drawBoard(ctx, lx, ly + 10, 58, 12, loadout.lippoBoard === 'paddle' ? 'classic' : 'rainbow', 0);
      ctx.drawImage(lspr, lx - lw / 2, ly - lh + 10, lw, lh);
      if (loadout.lippoSparkles) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
          const a = lippo.bob * 2 + i * 1.3;
          const r = 26 + Math.sin(a * 2) * 6;
          ctx.fillRect(lx + Math.cos(a) * r - 1, ly - 14 + Math.sin(a) * (r / 2) - 1, 3, 3);
        }
      }
      if (loadout.lippoHat) {
        // hat sits on Lippo's head (right side of the sprite)
        Sprites.drawHat(ctx, loadout.lippoHat, lx + lw * 0.2, ly - lh + 12, 3);
      }
    }

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(tilt + (trickT > 0 ? (1 - trickT / 0.55) * Math.PI * 2 : 0));

    // surfboard right under the feet (classic = the character's signature board)
    Sprites.drawBoard(ctx, 0, 6, 120, 24, loadout ? loadout.board : 'classic', 0, characterId);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, -w / 2, -h, w, h);

    // hat on top
    if (loadout && loadout.hat) {
      Sprites.drawHat(ctx, loadout.hat, 0, -h + 3 * scale, scale * 1.2);
    }
    ctx.restore();

    if (overcharged) ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* --------------------------- HUD data out ---------------------------- */
  function hudData() {
    return {
      score: Math.floor(score), lives, maxLives: MAX_LIVES, caffeine,
      overcharged, speed: (baseSpeed() * (1 + caffeine / CAFF_MAX * 0.55)).toFixed(1),
      trickPts: trickRunPts, combo,
      word: activeWord ? activeWord.word : null,
      wordProgress: activeWord ? activeWord.next : 0,
      running: state === 'running',
      paused: state === 'paused',
    };
  }

  /* HUD updater hook – assigned by main.js to avoid a hard dependency */
  let MainUI_updateHUD = () => {};
  function setHUDUpdater(fn) { MainUI_updateHUD = fn; }

  return {
    init, startRun, stop, gameOver, endTutorial, togglePause, hudData,
    setHUDUpdater,
    get state() { return state; },
    /* test/debug access to the live run state */
    get debugState() {
      return {
        player, entities, particles, distance, score, lives, caffeine,
        overcharged, trickRunPts, combo, activeWord, spawnAcc,
      };
    },
  };
})();
