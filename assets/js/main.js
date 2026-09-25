/* ==========================================================================
 * Subtext Surfers – main.js
 * Screens & UI glue: login, start screen, character select, unlock shop,
 * Helge's tutorial, HUD and the game-over leaderboard.
 * ========================================================================== */
'use strict';

const MainUI = (() => {
  const $ = (id) => document.getElementById(id);
  let currentPlayer = null;
  let selectedCharacter = 'wave';
  let authConfig = { enabled: false };

  /* =============================== boot =============================== */
  function boot() {
    Game.setHUDUpdater(updateHUD);
    Game.init($('game-canvas'));

    wireLogin();
    wireStart();
    wireShop();
    wireTutorial();
    wireGameOver();

    handleGithubRedirect();
    checkAuthConfig(); // async, non-blocking

    const players = Storage.listPlayers();
    if (players.length === 0) showScreen('screen-login');
    else showScreen('screen-start');
  }

  function handleGithubRedirect() {
    // GitHub OAuth result?
    const params = new URLSearchParams(location.search);
    const gh = params.get('github_login');
    if (gh) {
      sessionStorage.setItem('subtext.github', gh);
      history.replaceState(null, '', location.pathname);
    }
  }

  async function checkAuthConfig() {
    try {
      const res = await fetch('/api/auth-config');
      if (res.ok) authConfig = await res.json();
    } catch (e) { /* static dev: no function → name login only */ }
    const ghBtn = $('gh-login-btn');
    if (ghBtn) ghBtn.style.display = authConfig.enabled ? '' : 'none';
  }

  /* ============================== screens ============================= */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('visible'));
    if (id) $(id).classList.add('visible');
    const inGame = (id === null);
    $('hud').style.display = inGame ? '' : 'none';
  }

  /* =============================== login ============================== */
  function wireLogin() {
    $('login-submit').addEventListener('click', () => {
      const name = $('login-name').value.trim();
      if (!name) { shakeEl($('login-name')); return; }
      const gh = sessionStorage.getItem('subtext.github');
      currentPlayer = Storage.createPlayer(name, gh || null);
      if (gh) sessionStorage.removeItem('subtext.github');
      AudioSys.init().then(() => AudioSys.SFX.ui());
      refreshStartScreen();
      showScreen('screen-start');
    });
    $('login-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('login-submit').click(); });
    $('gh-login-btn').addEventListener('click', () => {
      location.href = '/api/auth-login';
    });
  }

  function shakeEl(el) {
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
  }

  /* ============================ start screen ========================== */
  function refreshStartScreen() {
    if (!currentPlayer) {
      const players = Storage.listPlayers();
      currentPlayer = players[0] || null;
    }
    // player picker
    const list = $('player-list');
    list.innerHTML = '';
    for (const p of Storage.listPlayers()) {
      const btn = document.createElement('button');
      btn.className = 'player-chip' + (currentPlayer && p.name === currentPlayer.name ? ' active' : '') + (p.github ? ' verified' : '');
      btn.innerHTML = `${escapeHtml(p.name)}${p.github ? ' <span class="gh-badge" title="verified via GitHub">✔</span>' : ''} <span class="chip-score">🏅 ${p.highscore}</span>`;
      btn.addEventListener('click', () => {
        currentPlayer = p;
        selectedCharacter = p.character || 'wave';
        refreshStartScreen();
        AudioSys.SFX.ui();
      });
      list.appendChild(btn);
    }
    // name entry for returning players
    const nameRow = $('start-name-row');
    nameRow.innerHTML = '';
    const inp = document.createElement('input');
    inp.id = 'start-name'; inp.placeholder = '…or enter your name'; inp.maxLength = 24;
    const btn = document.createElement('button');
    btn.id = 'start-name-btn'; btn.textContent = 'Login';
    btn.addEventListener('click', () => {
      const n = inp.value.trim();
      if (!n) { shakeEl(inp); return; }
      currentPlayer = Storage.createPlayer(n, sessionStorage.getItem('subtext.github') || null);
      refreshStartScreen();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
    nameRow.appendChild(inp); nameRow.appendChild(btn);

    if (!currentPlayer) return;
    $('start-highscore').textContent = currentPlayer.highscore;
    $('start-trickpts').textContent = currentPlayer.trickPoints;
    $('start-welcome').textContent = `Aloha, ${currentPlayer.name}! 🤙`;
    renderCharacterCards();
    $('btn-tutorial').style.display = currentPlayer.tutorialSeen ? '' : '';
  }

  function renderCharacterCards() {
    const wrap = $('char-select');
    wrap.innerHTML = '';
    for (const id of ['wave', 'khaki', 'sky', 'helge']) {
      const def = Sprites.CHARACTERS[id];
      const card = document.createElement('div');
      card.className = 'char-card' + (selectedCharacter === id ? ' active' : '');
      const cnv = document.createElement('canvas');
      const spr = Sprites.surferSprite(id, 'run');
      const scale = 5;
      cnv.width = spr.width * scale + 12; cnv.height = spr.height * scale + 12;
      const c = cnv.getContext('2d');
      c.imageSmoothingEnabled = false;
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(0, 0, cnv.width, cnv.height);
      c.drawImage(spr, 6, 8, spr.width * scale, spr.height * scale);
      const label = document.createElement('div');
      label.className = 'char-name';
      label.textContent = def.name;
      const desc = document.createElement('div');
      desc.className = 'char-desc';
      desc.textContent = def.desc;
      card.appendChild(cnv); card.appendChild(label); card.appendChild(desc);
      card.addEventListener('click', () => {
        selectedCharacter = id;
        if (currentPlayer) Storage.updatePlayer(currentPlayer.name, { character: id });
        refreshStartScreen();
        AudioSys.SFX.ui();
      });
      wrap.appendChild(card);
    }
  }

  function wireStart() {
    $('btn-play').addEventListener('click', () => {
      if (!currentPlayer) { showScreen('screen-login'); return; }
      startPlaying();
    });
    $('btn-shop').addEventListener('click', () => { refreshShop(); showScreen('screen-shop'); });
    $('btn-tutorial').addEventListener('click', () => {
      showTutorial(true);
    });
    $('btn-mute').addEventListener('click', () => {
      AudioSys.setMuted(!AudioSys.isMuted());
      $('btn-mute').textContent = AudioSys.isMuted() ? '🔇' : '🔊';
    });
  }

  function startPlaying() {
    const p = Storage.getPlayer(currentPlayer.name);
    currentPlayer = p || currentPlayer;
    const loadout = buildLoadout(currentPlayer);
    const tutorial = !currentPlayer.tutorialSeen;
    Storage.updatePlayer(currentPlayer.name, { tutorialSeen: true });
    showScreen(null);
    updateHUD(true);
    Game.startRun({
      name: currentPlayer.name,
      character: selectedCharacter,
      loadout,
      tutorial,
    });
    if (!tutorial) hideTutorialUI();
  }

  function buildLoadout(p) {
    const u = p.unlocked || [];
    const lo = p.loadout || {};
    return {
      board: lo.board === 'board_galaxy' && u.includes('board_galaxy') ? 'galaxy'
        : lo.board === 'board_rainbow' && u.includes('board_rainbow') ? 'rainbow' : 'classic',
      hat: (lo.hat && u.includes(lo.hat))
        ? (lo.hat === 'hat_crown' ? 'crown' : lo.hat === 'hat_propeller' ? 'propeller' : 'party') : null,
      rainbowWater: u.includes('water_rainbow') && !!lo.rainbowWater,
      lippo: u.includes('lippo') && !!lo.lippo,
      lippoBoard: lo.lippoBoard === 'lippo_board_paddle' && u.includes('lippo_board_paddle') ? 'paddle'
        : (u.includes('lippo_board_sparkle') ? 'sparkle' : 'classic'),
      lippoSparkles: u.includes('lippo_sparkles') && !!lo.lippoSparkles,
      lippoHat: (lo.lippoHat && u.includes(lo.lippoHat))
        ? (lo.lippoHat === 'lippo_hat_crown' ? 'crown' : 'party') : null,
    };
  }

  /* ================================ shop ============================== */
  function refreshShop() {
    if (!currentPlayer) return;
    const p = Storage.getPlayer(currentPlayer.name) || currentPlayer;
    $('shop-balance').textContent = p.trickPoints;
    const grid = $('shop-grid');
    grid.innerHTML = '';
    for (const item of SHOP_ITEMS) {
      const owned = (p.unlocked || []).includes(item.id);
      const card = document.createElement('div');
      card.className = 'shop-card' + (owned ? ' owned' : '');
      const equipped = isEquipped(p, item);
      let buttons = '';
      if (owned) {
        if (item.kind === 'board' || item.kind === 'hat' || item.kind === 'lippoHat' || item.kind === 'lippoBoard')
          buttons += `<button class="equip-btn ${equipped ? 'on' : ''}" data-id="${item.id}">${equipped ? '✓ Equipped' : 'Equip'}</button>`;
        if (item.kind === 'water' || item.kind === 'lippo' || item.kind === 'lippoFx')
          buttons += `<button class="equip-btn ${equipped ? 'on' : ''}" data-id="${item.id}">${equipped ? '✓ Active' : 'Activate'}</button>`;
      } else {
        const afford = p.trickPoints >= item.cost;
        buttons += `<button class="buy-btn" data-id="${item.id}" ${afford ? '' : 'disabled'}>${item.cost} ✦</button>`;
      }
      card.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-name">${escapeHtml(item.name)}</div>
        <div class="shop-desc">${escapeHtml(item.desc)}</div>
        ${buttons}`;
      grid.appendChild(card);
    }
    grid.querySelectorAll('.buy-btn').forEach(b => b.addEventListener('click', () => buyItem(b.dataset.id)));
    grid.querySelectorAll('.equip-btn').forEach(b => b.addEventListener('click', () => equipItem(b.dataset.id)));
  }

  function isEquipped(p, item) {
    const lo = p.loadout || {};
    switch (item.kind) {
      case 'board': return lo.board === item.id;
      case 'hat': return lo.hat === item.id;
      case 'water': return lo.board !== undefined && !!lo.rainbowWater && item.id === 'water_rainbow';
      case 'lippo': return !!lo.lippo;
      case 'lippoBoard': return lo.lippoBoard === item.id;
      case 'lippoFx': return !!lo.lippoSparkles;
      case 'lippoHat': return lo.lippoHat === item.id;
      default: return false;
    }
  }

  function buyItem(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    let p = Storage.getPlayer(currentPlayer.name);
    if (!p || p.trickPoints < item.cost || p.unlocked.includes(id)) return;
    p = Storage.updatePlayer(currentPlayer.name, {
      trickPoints: p.trickPoints - item.cost,
      unlocked: p.unlocked.concat(id),
    });
    // auto-equip on purchase
    equipItem(id, true);
    AudioSys.SFX.unlock();
    MainUI_flashShop();
    refreshShop();
    refreshStartScreen();
  }

  function equipItem(id, silent) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;
    let p = Storage.getPlayer(currentPlayer.name);
    if (!p || !p.unlocked.includes(id)) return;
    const lo = Object.assign({}, p.loadout);
    switch (item.kind) {
      case 'board': lo.board = lo.board === id ? 'classic' : id; break;
      case 'hat': lo.hat = lo.hat === id ? null : id; break;
      case 'water': lo.rainbowWater = !lo.rainbowWater; break;
      case 'lippo': lo.lippo = !lo.lippo; break;
      case 'lippoBoard': lo.lippoBoard = lo.lippoBoard === id ? 'classic' : id; break;
      case 'lippoFx': lo.lippoSparkles = !lo.lippoSparkles; break;
      case 'lippoHat': lo.lippoHat = lo.lippoHat === id ? null : id; break;
    }
    p = Storage.updatePlayer(currentPlayer.name, { loadout: lo });
    currentPlayer = p;
    if (!silent) AudioSys.SFX.ui();
    refreshShop();
  }

  function MainUI_flashShop() {
    const el = $('shop-balance');
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 400);
  }

  function wireShop() {
    $('btn-shop-back').addEventListener('click', () => { refreshStartScreen(); showScreen('screen-start'); });
  }

  /* ============================== tutorial ============================ */
  const TUTORIAL_STEPS = [
    { img: 'helge', text: 'Aloha! I\'m <b>Helge</b> and this is <b>Subtext Surfers</b>! We ride the waves of conversation. Ready to catch some words? 🌊' },
    { img: 'helge', text: 'Use <b>← →</b> (or <b>A</b>/<b>D</b>) to switch lanes. Your surfboard tilts and swings with every move!' },
    { img: 'helge', text: 'Press <b>↑</b> (or <b>W</b>) to <b>jump</b> over Mate crates and sofas. Press <b>↓</b> (or <b>S</b>) to <b>duck</b> under the Mate bar signs.' },
    { img: 'helge', text: 'Collect the golden <b>letters</b> to spell our favourite words: <b>SIPGATE</b>, <b>SONA</b>, <b>AGENT</b> and <b>VOICE</b>. Complete a word for a big bonus!' },
    { img: 'helge', text: 'Dodge the red <b>bad words</b> — <b>LATENCY</b>, <b>BUG</b>, <b>HALLUCINATION</b> and <b>ERROR</b> are up to no good. Never let them hit you!' },
    { img: 'helge', text: 'Press <b>SPACE</b> — twice, with the right timing — for a <b>trick</b>! Tricks earn bonus points and <b>style points ✦</b> for the shop.' },
    { img: 'helge', text: 'Grab <b>coffee ☕</b> and <b>Mate 🧉</b> to surf faster — but beware! Overcharge your caffeine bar and your controls go… <i>wobbly</i>. The music speeds up too!' },
    { img: 'helge', text: 'You start with <b>10 lives</b>. Collect <b>vegan chocolate croissants 🥐</b> from the sipgate kitchen to heal. Now let\'s surf! 🏄‍♀️' },
  ];
  let tutStep = 0;

  function wireTutorial() {
    $('tut-next').addEventListener('click', () => {
      tutStep++;
      AudioSys.SFX.ui();
      if (tutStep >= TUTORIAL_STEPS.length) {
        hideTutorialUI();
        if (currentPlayer) Storage.updatePlayer(currentPlayer.name, { tutorialSeen: true });
        if (Game.state === 'tutorial') Game.endTutorial();
      } else {
        renderTutorialStep();
      }
    });
  }

  function showTutorial(show) {
    if (!show) return;
    tutStep = 0;
    renderTutorialStep();
    $('screen-tutorial').classList.add('visible');
    $('hud').style.display = '';
  }

  function hideTutorialUI() {
    $('screen-tutorial').classList.remove('visible');
  }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutStep];
    $('tut-text').innerHTML = step.text;
    $('tut-count').textContent = `${tutStep + 1} / ${TUTORIAL_STEPS.length}`;
    $('tut-next').textContent = tutStep === TUTORIAL_STEPS.length - 1 ? 'Let\'s surf! 🏄' : 'Next';
    const portrait = $('tut-helge');
    const spr = Sprites.helgePortrait(7);
    portrait.width = spr.width; portrait.height = spr.height;
    const c = portrait.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, portrait.width, portrait.height);
    c.drawImage(spr, 0, 0);
  }

  /* ============================== game over =========================== */
  function wireGameOver() {
    $('btn-again').addEventListener('click', () => { showScreen(null); startPlaying(); });
    $('btn-to-start').addEventListener('click', () => { Game.stop(); refreshStartScreen(); showScreen('screen-start'); });
  }

  function showGameOver(score, isBest, trickPts) {
    $('go-score').textContent = score;
    $('go-best-label').textContent = isBest ? '🏆 New personal best!' : 'Your best: ';
    $('go-best').textContent = isBest ? '' : currentPlayer.highscore;
    $('go-trickpts').textContent = `+${trickPts} ✦ style points earned`;
    const rank = Storage.getRanking(currentPlayer.name);
    $('go-position').textContent = rank.position ? `You are #${rank.position} of ${rank.total} surfers!` : '';
    const table = $('go-leaderboard');
    table.innerHTML = '';
    rank.players.slice(0, 10).forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'lb-row' + (p.name === currentPlayer.name ? ' me' : '');
      row.innerHTML = `<span class="lb-pos">${i + 1}.</span><span class="lb-name">${escapeHtml(p.name)}${p.github ? ' <span class="gh-badge" title="verified via GitHub">✔</span>' : ''}</span><span class="lb-score">${p.highscore}</span>`;
      table.appendChild(row);
    });
    showScreen('screen-gameover');
  }

  /* ================================= HUD ============================== */
  let lastLives = -1, lastWord = null;
  function updateHUD(force) {
    const d = Game.hudData();
    if (!d) return;
    $('hud-score').textContent = d.score;
    $('hud-speed').textContent = `💨 ${d.speed} u/s`;
    $('hud-trick').textContent = `✦ ${d.trickPts}`;
    if (d.lives !== lastLives || force) {
      lastLives = d.lives;
      const el = $('hud-lives');
      el.innerHTML = '';
      for (let i = 0; i < 10; i++) {
        const img = Sprites.heartSprite(i < d.lives).cloneNode();
        img.getContext('2d').drawImage(Sprites.heartSprite(i < d.lives), 0, 0);
        img.className = 'heart' + (i >= d.lives ? ' empty' : '');
        if (d.lives <= 3) img.classList.add('blink');
        el.appendChild(img);
      }
    }
    const bar = $('caff-bar-fill');
    bar.style.width = d.caffeine + '%';
    bar.classList.toggle('hot', d.caffeine > 85);
    $('caff-label').textContent = d.overcharged ? 'OVERCHARGED ⚠' : '☕ caffeine';
    if (d.word !== lastWord || force) {
      lastWord = d.word;
      const el = $('hud-word');
      el.innerHTML = '';
      if (d.word) {
        el.classList.add('active');
        for (let i = 0; i < d.word.length; i++) {
          const chip = document.createElement('span');
          chip.className = 'letter-chip' + (i < d.wordProgress ? ' got' : '');
          chip.textContent = d.word[i];
          el.appendChild(chip);
        }
      } else {
        el.classList.remove('active');
      }
    }
    $('pause-overlay').style.display = d.paused ? 'flex' : 'none';
  }

  function updateHUDVisibility(state) { updateHUD(true); }

  function flashMessage(text) {
    const el = $('flash');
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  document.addEventListener('DOMContentLoaded', boot);

  return { showGameOver, flashMessage, updateHUDVisibility, showTutorial };
})();
