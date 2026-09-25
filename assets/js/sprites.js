/* ==========================================================================
 * Subtext Surfers – sprites.js
 * Pixel font, sprite maps, offscreen pre-rendering. All art is generated
 * in code (cute pixel / nyan-cat aesthetic). Palette colors for the team
 * characters & Helge are derived from the team's mascot artwork.
 * ========================================================================== */
'use strict';

const Sprites = (() => {

  /* ---------------------- 5x7 pixel font (A–Z) ---------------------- */
  const FONT = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '..##.', '..##.'],
    ':': ['.....', '..##.', '..##.', '.....', '..##.', '..##.', '.....'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  };

  /* Renders text with the pixel font into a canvas, optional outline.
   * cell = pixel size per font-pixel. Returns a canvas. */
  function renderText(text, cell, color, outline) {
    const t = String(text).toUpperCase();
    const pad = outline ? cell : 0;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, t.length * 6 * cell - cell + pad * 2);
    canvas.height = 7 * cell + pad * 2;
    const ctx = canvas.getContext('2d');
    const passes = outline ? [[outline, 0, 0], [color, pad, pad]] : [[color, pad, pad]];
    for (const [col, oX, oY] of passes) {
      ctx.fillStyle = col;
      if (outline && col === outline) {
        // thick outline: stamp a 3x3 kernel around every pixel
        let px = pad;
        for (let i = 0; i < t.length; i++) {
          const glyph = FONT[t[i]] || FONT[' '];
          for (let r = 0; r < 7; r++)
            for (let c = 0; c < 5; c++)
              if (glyph[r][c] === '#')
                ctx.fillRect(px + c * cell - cell, oY + r * cell - cell, cell * 3, cell * 3);
          px += 6 * cell;
        }
      } else {
        let px = pad;
        for (let i = 0; i < t.length; i++) {
          const glyph = FONT[t[i]] || FONT[' '];
          for (let r = 0; r < 7; r++)
            for (let c = 0; c < 5; c++)
              if (glyph[r][c] === '#')
                ctx.fillRect(px + c * cell, oY + r * cell, cell, cell);
          px += 6 * cell;
        }
      }
    }
    return canvas;
  }

  /* Simple flat text (no outline) */
  function renderTextFlat(text, cell, color) {
    const t = String(text).toUpperCase();
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, t.length * 6 * cell - cell);
    canvas.height = 7 * cell;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    let px = 0;
    for (let i = 0; i < t.length; i++) {
      const glyph = FONT[t[i]] || FONT[' '];
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 5; c++) {
          if (glyph[r][c] === '#') ctx.fillRect(px + c * cell, r * cell, cell, cell);
        }
      }
      px += 6 * cell;
    }
    return canvas;
  }

  /* ------------------------- sprite maps ------------------------- */
  /* '.' transparent, letters map to a palette key. */

  const SURFER_MAP = [
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...hssssssh...',
    '...hseessesh..',
    '...hssssssh...',
    '....sssmms....',
    '....sssss.....',
    '...bbbbbbbb...',
    '..bbbbbbbbbb..',
    '..bfbbbbbbfb..',
    '..bfbbbbbbfb..',
    '...bbbbbbbb...',
    '...pppppppp...',
    '...pp....pp...',
    '...ss....ss...',
    '...ss....ss...',
  ];

  const SURFER_JUMP_MAP = [
    '....hhhhhh....',
    '...hhhhhhhh...',
    '...hssssssh...',
    '...hseessesh..',
    '...hssssssh...',
    '....sssmms....',
    '....sssss.....',
    '...bbbbbbbb...',
    '..bbbbbbbbbb..',
    '..bfbbbbbbfb..',
    '..bfbbbbbbfb..',
    '...bbbbbbbb...',
    '...pppppppp...',
    '...pp.pp.pp...',
    '....ss..ss....',
    '..............',
  ];

  const SURFER_DUCK_MAP = [
    '................',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '...hssssssssh...',
    '...hseessessh...',
    '...hssssssssh...',
    '....sssmmss.....',
    '.bbbbssssssbbbbb',
    'bbbfbbbbbbbbfbbb',
    'bbbfbbbbbbbbfbbb',
    '.bbppppppppppbb.',
    '..pppppppppppp..',
    '................',
  ];

  const HELGE_MAP = [
    '.....kkkkkk.....',
    '...kkkkkkkkkk...',
    '..kkkkkkkkkkkk..',
    '..kksssssssskk..',
    '..kssseesseessk.',
    '..kssssssssssk..',
    '...ssssmmssss...',
    '...ssssssssss...',
    '....ssssssss....',
    '...uuuuuuuuuu...',
    '..uuuuuuuuuuuu..',
    '..uwuuuuuuuuwu..',
    '..uwuuuuuuuuwu..',
    '...uuuuuuuuuu...',
    '...dddddddddd...',
    '...dddd..dddd...',
    '...kkk....kkk...',
    '...kkk....kkk...',
  ];

  const HELGE_JUMP_MAP = HELGE_MAP.slice(0, 14).concat([
    '...dddddddddd...',
    '...dd.dd.dd.dd..',
    '...kk....kk.....',
    '................',
  ]);

  const HELGE_DUCK_MAP = [
    '..................',
    '.....kkkkkkkk.....',
    '...kkkkkkkkkkkk...',
    '..kkkkkkkkkkkkk...',
    '..kksssssssssskk..',
    '..kssseesseesssk..',
    '..kssssssssssssk..',
    '...ssssmmssssss...',
    'uuuussssssssssuuuu',
    'uuuuuuuuuuuuuuuuu.',
    'uwuuuuuuuuuuuuwu..',
    '.uuuuuuuuuuuuuuu..',
    '..dddddddddddd....',
    '..................',
  ];

  const LIPPO_MAP = [
    '.ee........ee.',
    '.eee......eee.',
    '.eebbbbbbbee..',
    '.eebsssbbee...',
    '..bbbssssbb...',
    '..bbbbnbbbb...',
    '..bbbttbbb....',
    '...bbbbbb.....',
    '...bb..bb.....',
    '...bb..bb.....',
  ];

  /* Palettes per character */
  const CHARACTERS = {
    wave: {
      id: 'wave', name: 'Wave',
      palette: { h: '#12203f', s: '#f8d9bd', e: '#141414', m: '#d96a8a', b: '#2d9dd6', f: '#5bb9eb', p: '#123c5e' },
      desc: 'Blue-hoodie speedster',
    },
    khaki: {
      id: 'khaki', name: 'Khaki',
      palette: { h: '#4e322e', s: '#e9b98d', e: '#141414', m: '#a05a3c', b: '#968f71', f: '#8f6c5e', p: '#5e5340' },
      desc: 'Earth-tone cruiser',
    },
    sky: {
      id: 'sky', name: 'Sky',
      palette: { h: '#304b5f', s: '#f8dfc8', e: '#141414', m: '#c96a8a', b: '#a1e0f1', f: '#6fc8ec', p: '#2b3849' },
      desc: 'Light-sky trickster',
    },
    helge: {
      id: 'helge', name: 'Helge',
      palette: { k: '#131313', s: '#f8d9bd', e: '#141414', m: '#d96a8a', u: '#7753c4', w: '#825bd9', d: '#312250' },
      desc: 'The mascot himself',
    },
  };

  /* Build a sprite canvas from a map + palette */
  function buildSprite(map, palette) {
    const w = map[0].length, h = map.length;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const ch = map[r][c];
        if (ch === '.' || ch === ' ') continue;
        const col = palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(c, r, 1, 1);
      }
    }
    return canvas;
  }

  /* Cache of built sprites, filled lazily */
  const cache = new Map();

  function surferSprite(charId, pose) {
    const key = `surfer:${charId}:${pose}`;
    if (cache.has(key)) return cache.get(key);
    const def = CHARACTERS[charId] || CHARACTERS.wave;
    let map = SURFER_MAP, pal = Object.assign({}, def.palette);
    if (charId === 'helge') {
      map = pose === 'jump' ? HELGE_JUMP_MAP : pose === 'duck' ? HELGE_DUCK_MAP : HELGE_MAP;
    } else {
      map = pose === 'jump' ? SURFER_JUMP_MAP : pose === 'duck' ? SURFER_DUCK_MAP : SURFER_MAP;
    }
    const cnv = buildSprite(map, pal);
    cache.set(key, cnv);
    return cnv;
  }

  function lippoSprite() {
    if (cache.has('lippo')) return cache.get('lippo');
    const cnv = buildSprite(LIPPO_MAP, { e: '#4e322e', b: '#b5825f', s: '#f2d3b3', n: '#3a241f', t: '#e96a7d' });
    cache.set('lippo', cnv);
    return cnv;
  }

  /* ------------------------- obstacle art ------------------------- */

  /* Mate crate (jump over). Wide enough for the 'MATE' pixel label. */
  function crateSprite() {
    if (cache.has('crate')) return cache.get('crate');
    const W = 26, H = 18;
    const cnv = document.createElement('canvas');
    cnv.width = W; cnv.height = H;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#c98a3d'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8f5a24'; ctx.fillRect(0, 0, W, 2); ctx.fillRect(0, H - 2, W, 2);
    ctx.fillRect(0, 0, 2, H); ctx.fillRect(W - 2, 0, 2, H);
    ctx.fillStyle = '#e8a84f';
    ctx.fillRect(3, 3, W - 6, 2); ctx.fillRect(3, H - 5, W - 6, 2);
    // 'MATE' label in tiny pixel font (cell=1 → 4*6-1 = 23 px wide)
    const label = renderTextFlat('MATE', 1, '#4a2c10');
    ctx.drawImage(label, Math.floor((W - label.width) / 2), Math.floor((H - 7) / 2) + 1);
    cache.set('crate', cnv);
    return cnv;
  }

  /* Duck-bar: two side stacks + horizontal plank ('MATE' sign) */
  function barSprite() {
    if (cache.has('bar')) return cache.get('bar');
    const W = 30, H = 22;
    const cnv = document.createElement('canvas');
    cnv.width = W; cnv.height = H;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#c98a3d';
    ctx.fillRect(0, 0, 4, H); ctx.fillRect(W - 4, 0, 4, H);
    ctx.fillStyle = '#8f5a24';
    ctx.fillRect(0, 0, 4, 2); ctx.fillRect(W - 4, 0, 4, 2);
    ctx.fillRect(0, 8, 4, 2); ctx.fillRect(W - 4, 8, 4, 2);
    ctx.fillRect(0, 16, 4, 2); ctx.fillRect(W - 4, 16, 4, 2);
    // plank
    ctx.fillStyle = '#e8a84f'; ctx.fillRect(4, 0, W - 8, 8);
    ctx.fillStyle = '#8f5a24'; ctx.fillRect(4, 0, W - 8, 2); ctx.fillRect(4, 6, W - 8, 2);
    const label = renderTextFlat('MATE', 1, '#4a2c10');
    ctx.drawImage(label, Math.floor((W - label.width) / 2), 1);
    cache.set('bar', cnv);
    return cnv;
  }

  /* Sofa (jump over – tall) */
  function sofaSprite() {
    if (cache.has('sofa')) return cache.get('sofa');
    const W = 34, H = 20;
    const cnv = document.createElement('canvas');
    cnv.width = W; cnv.height = H;
    const ctx = cnv.getContext('2d');
    const R = '#e05780', D = '#a23a5c', L = '#7a2a45';
    ctx.fillStyle = D; // back
    ctx.fillRect(2, 0, W - 4, 6);
    ctx.fillStyle = R; // seat
    ctx.fillRect(0, 6, W, 8);
    ctx.fillStyle = D; // armrests
    ctx.fillRect(0, 4, 5, 12); ctx.fillRect(W - 5, 4, 5, 12);
    ctx.fillStyle = '#f288ab'; // cushions highlight
    ctx.fillRect(7, 7, 8, 5); ctx.fillRect(19, 7, 8, 5);
    ctx.fillStyle = L; // legs
    ctx.fillRect(3, 16, 3, 4); ctx.fillRect(W - 6, 16, 3, 4);
    cache.set('sofa', cnv);
    return cnv;
  }

  /* Bad word panel – prerendered per word */
  const badWordCache = new Map();
  function badWordSprite(word) {
    if (badWordCache.has(word)) return badWordCache.get(word);
    const cell = 3;
    const text = renderTextFlat(word, cell, '#ffffff');
    const pad = 2 * cell;
    const W = text.width + pad * 2, H = 7 * cell + pad * 2 + 2 * cell;
    const cnv = document.createElement('canvas');
    cnv.width = W; cnv.height = H;
    const ctx = cnv.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#ff4d6d');
    grad.addColorStop(1, '#8a1c4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3a0a2a';
    ctx.fillRect(0, 0, W, cell); ctx.fillRect(0, H - cell, W, cell);
    ctx.fillRect(0, 0, cell, H); ctx.fillRect(W - cell, 0, cell, H);
    // zigzag warning lights along the top edge
    ctx.fillStyle = '#ffd23f';
    for (let x = cell; x < W - cell * 2; x += cell * 2) ctx.fillRect(x, cell, cell, cell);
    ctx.drawImage(text, pad, pad + cell);
    badWordCache.set(word, cnv);
    return cnv;
  }

  /* Collectible letter coin */
  const letterCache = new Map();
  function letterSprite(ch, color) {
    const key = ch + ':' + (color || '#ffd23f');
    if (letterCache.has(key)) return letterCache.get(key);
    const cell = 4;
    const glyph = renderTextFlat(ch, cell, '#5a3a00');
    const W = 7 * cell, H = 7 * cell + cell;
    const cnv = document.createElement('canvas');
    cnv.width = W; cnv.height = H;
    const ctx = cnv.getContext('2d');
    // coin body
    ctx.fillStyle = color || '#ffd23f';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff2b0';
    ctx.beginPath();
    ctx.arc(W / 2 - cell, H / 2 - cell, W / 2 - 3 - cell, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(glyph, Math.floor((W - glyph.width) / 2), Math.floor((H - glyph.height) / 2) + 1);
    letterCache.set(key, cnv);
    return cnv;
  }

  /* Coffee cup */
  function coffeeSprite() {
    if (cache.has('coffee')) return cache.get('coffee');
    const cnv = document.createElement('canvas');
    cnv.width = 12; cnv.height = 14;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#f5f0e6'; ctx.fillRect(2, 4, 8, 9);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(3, 5, 6, 3);
    ctx.fillStyle = '#d7cfc0'; ctx.fillRect(2, 12, 8, 1);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(10, 6, 2, 2); ctx.fillRect(11, 8, 1, 2);
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(4, 0, 1, 2); ctx.fillRect(7, 1, 1, 2); ctx.fillRect(5, 2, 1, 2);
    cache.set('coffee', cnv);
    return cnv;
  }

  /* Mate bottle (caffeinated softdrink) */
  function mateSprite() {
    if (cache.has('mate')) return cache.get('mate');
    const cnv = document.createElement('canvas');
    cnv.width = 10; cnv.height = 16;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#7a4a1f'; ctx.fillRect(4, 0, 2, 3);
    ctx.fillStyle = '#3f8f4f'; ctx.fillRect(2, 3, 6, 12);
    ctx.fillStyle = '#2c6b3a'; ctx.fillRect(2, 3, 1, 12); ctx.fillRect(7, 3, 1, 12);
    ctx.fillStyle = '#f5e9c8'; ctx.fillRect(3, 6, 4, 5);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(3, 7, 4, 1); ctx.fillRect(3, 9, 4, 1);
    ctx.fillStyle = '#f7c848'; ctx.fillRect(2, 14, 6, 2);
    cache.set('mate', cnv);
    return cnv;
  }

  /* Vegan chocolate croissant */
  function croissantSprite() {
    if (cache.has('croissant')) return cache.get('croissant');
    const cnv = document.createElement('canvas');
    cnv.width = 14; cnv.height = 9;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#d9913d';
    ctx.fillRect(2, 2, 10, 5);
    ctx.fillRect(1, 3, 1, 3); ctx.fillRect(12, 3, 1, 3);
    ctx.fillStyle = '#b56a24';
    ctx.fillRect(3, 3, 2, 3); ctx.fillRect(6, 3, 2, 3); ctx.fillRect(9, 3, 2, 3);
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(3, 3, 1, 1); ctx.fillRect(6, 4, 1, 1); ctx.fillRect(9, 3, 1, 1);
    ctx.fillStyle = '#f0b45f'; ctx.fillRect(2, 2, 10, 1);
    cache.set('croissant', cnv);
    return cnv;
  }

  /* Hearts for the HUD (drawn as tiny canvas, also used inline) */
  function heartSprite(full) {
    const key = 'heart:' + (full ? 'full' : 'empty');
    if (cache.has(key)) return cache.get(key);
    const cnv = document.createElement('canvas');
    cnv.width = 9; cnv.height = 8;
    const ctx = cnv.getContext('2d');
    const map = [
      '.##.##.',
      '#######',
      '#######',
      '.#####.',
      '..###..',
      '...#...',
    ];
    const col = full ? '#ff5d8f' : '#5a5170';
    ctx.fillStyle = col;
    for (let r = 0; r < map.length; r++)
      for (let c = 0; c < map[r].length; c++)
        if (map[r][c] === '#') ctx.fillRect(c + 1, r + 1, 1, 1);
    cache.set(key, cnv);
    return cnv;
  }

  /* Surfboards */
  const BOARDS = {
    classic: { id: 'classic', name: 'Classic Board', colors: ['#f7f7f7', '#2d9dd6'] },
    rainbow: { id: 'rainbow', name: 'Rainbow Board', colors: ['#ff5d8f', '#ffd23f', '#7ee787', '#5bb9eb', '#b07cff'] },
    galaxy: { id: 'galaxy', name: 'Galaxy Board', colors: ['#b07cff', '#5bb9eb', '#ff5d8f'] },
  };

  /* Draw a surfboard directly (ellipse-ish pixel style), width in px */
  function drawBoard(ctx, x, y, w, h, boardId, tilt) {
    const def = BOARDS[boardId] || BOARDS.classic;
    const segs = def.colors.length;
    ctx.save();
    ctx.translate(x, y);
    if (tilt) ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
    const hw = w / 2, hh = h / 2;
    for (let i = 0; i < segs; i++) {
      ctx.fillStyle = def.colors[i % def.colors.length];
      const x0 = -hw + (w / segs) * i;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 - 0.5, -hh - 1, w / segs + 1, h + 2);
      ctx.clip();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-hw * 0.5, -1, w * 0.5, 2);
    ctx.restore();
  }

  /* Hats (drawn onto the character's head, in sprite-cell units) */
  function drawHat(ctx, hatId, cx, topY, s) {
    if (!hatId) return;
    if (hatId === 'party') {
      ctx.fillStyle = '#ff5d8f';
      ctx.beginPath(); ctx.moveTo(cx - 4 * s, topY); ctx.lineTo(cx + 4 * s, topY); ctx.lineTo(cx, topY - 7 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 4 * s, topY - 2 * s, 8 * s, s);
      ctx.fillStyle = '#5bb9eb'; ctx.fillRect(cx - 2.5 * s, topY - 4.5 * s, 5 * s, s);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - s, topY - 7 * s, 2 * s, s);
    } else if (hatId === 'crown') {
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(cx - 4 * s, topY - 3 * s, 8 * s, 3 * s);
      ctx.beginPath();
      ctx.moveTo(cx - 4 * s, topY - 3 * s);
      ctx.lineTo(cx - 3 * s, topY - 6 * s); ctx.lineTo(cx - 1.5 * s, topY - 3.5 * s);
      ctx.lineTo(cx, topY - 7 * s); ctx.lineTo(cx + 1.5 * s, topY - 3.5 * s);
      ctx.lineTo(cx + 3 * s, topY - 6 * s); ctx.lineTo(cx + 4 * s, topY - 3 * s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5d8f'; ctx.fillRect(cx - 1 * s, topY - 5 * s, 2 * s, 2 * s);
    } else if (hatId === 'propeller') {
      ctx.fillStyle = '#7ee787'; ctx.fillRect(cx - 3 * s, topY - 3 * s, 6 * s, 3 * s);
      ctx.fillStyle = '#5bb9eb'; ctx.fillRect(cx - s, topY - 5 * s, 2 * s, 2 * s);
      ctx.fillStyle = '#ff5d8f';
      const t = Date.now() * 0.02;
      const w = Math.cos(t) * 6 * s;
      ctx.fillRect(cx - Math.abs(w) / 2 - 1, topY - 6 * s, Math.abs(w) + 2, s + 1);
    }
  }

  /* Helge talking portrait for the tutorial (bigger, with sparkle bg) */
  function helgePortrait(scale) {
    const key = 'helgePortrait:' + scale;
    if (cache.has(key)) return cache.get(key);
    const base = surferSprite('helge', 'run');
    const cnv = document.createElement('canvas');
    cnv.width = base.width * scale + 16;
    cnv.height = base.height * scale + 16;
    const ctx = cnv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // sparkly background
    ctx.fillStyle = 'rgba(183, 92, 255, 0.25)';
    ctx.beginPath(); ctx.arc(cnv.width / 2, cnv.height / 2, cnv.width / 2 - 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + 0.4;
      const rx = cnv.width / 2 + Math.cos(a) * (cnv.width / 2 - 12);
      const ry = cnv.height / 2 + Math.sin(a) * (cnv.height / 2 - 12);
      ctx.fillRect(rx - 1, ry - 1, 2, 2);
      ctx.fillRect(rx - 3, ry, 6, 1);
      ctx.fillRect(rx, ry - 3, 1, 6);
    }
    ctx.drawImage(base, 8, 12, base.width * scale, base.height * scale);
    cache.set(key, cnv);
    return cnv;
  }

  return {
    FONT, CHARACTERS, BOARDS,
    renderText, renderTextFlat,
    surferSprite, lippoSprite, crateSprite, barSprite, sofaSprite,
    badWordSprite, letterSprite, coffeeSprite, mateSprite,
    croissantSprite, heartSprite, drawBoard, drawHat, helgePortrait,
  };
})();
