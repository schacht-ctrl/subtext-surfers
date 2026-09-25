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
  /* '.' transparent, letters map to a palette key. Maps are drawn without
   * outlines – buildSprite() adds the dark cartoon outline automatically,
   * matching the thick line-art of the team artwork.
   *
   * Every character = UPPER (head + torso, 17 rows) + a shared LOWER part
   * per pose. `head` = number of head rows (kept when ducking). */

  const LOWER = {
    run: [
      '....pppppppppp....',
      '....ppppqqpppp....',
      '...ppppp..ppppp...',
      '...pPpp....ppPp...',
      '..pppp......pppp..',
      '..pPpp......ppPp..',
      '..kkkk......kkkk..',
      '.kkKkk......kkKkk.',
      '.wwwww......wwwww.',
    ],
    jump: [
      '....pppppppppp....',
      '...pppppppppppp...',
      '..ppPpp....ppPpp..',
      '..kkKkk....kkKkk..',
      '..wwwww....wwwww..',
      '..................',
      '..................',
      '..................',
      '..................',
    ],
    duck: [
      '..pppppppppppppp..',
      '.ppPpppp..ppppPpp.',
      '.kkKkkk....kkKkkk.',
      '.wwwwww....wwwwww.',
    ],
  };

  /* Blonde surfer: long golden waves, round glasses, striped shirt,
   * colourful backpack, light jeans, blue/pink sneakers, red board. */
  const SKY_UPPER = [
    '.....hhhhhhhh.....',
    '...hhhhHHHhhhhh...',
    '..hhhHHHhhhhhhhh..',
    '..hhHhhhhhhhhhhh..',
    '.hhhhhhsssssssshh.',
    '.hhhsggssssggshhh.',
    '.hhhgweggggewghhh.',
    '.hhhsggssssggshhh.',
    '.hhhsrssssssrshhh.',
    '.hhhsssmmmmssshhh.',
    'hhHhhsssssssshhHhh',
    'hhhhhhhSSSShhhhhhh',
    'hhhhcCcCsscCcChhhh',
    'hhhbCcCcCcCcCcbhhh',
    'ssccbcCcCcCcCbccss',
    'ss..bCcCcCcCcb..ss',
    '.yz.cCcCcCcCcC....',
  ];

  /* Beanie guy: black 'THE OCEAN' beanie, platinum hair, chunky black
   * glasses, big grin, black hoodie with white logo, joggers, blue board. */
  const WAVE_UPPER = [
    '.....bbbbbbbb.....',
    '...bbbBBbbbbbbb...',
    '..bbbbbbbbbbbbbb..',
    '..bwwbwbwwbwwbwb..',
    '..bbbbbbbbbbbbbb..',
    '.hhhssssssssssHhh.',
    '.hhggggssssggggHh.',
    '.hhgelggggggelghh.',
    '.hhggggssssgggghh.',
    '..hsssssSSssssshh.',
    '...ssmwwwwwwmss...',
    '....sssmmmmsss....',
    '...cccCcwwcCccc...',
    '..cccccccccccccc..',
    'ssccccccwcwcccccss',
    'ss..cccwwwcccc..ss',
    '....CCCCCCCCCC....',
  ];

  /* Brunette surfer: long brown waves, khaki jacket over a black top,
   * golden necklace, dark trousers & boots, green neon board. */
  const KHAKI_UPPER = [
    '.....hhhhhhhh.....',
    '...hhhHHhhhhhhh...',
    '..hhHHhhhhhhhhhh..',
    '..hhhhhhhhhhhhhh..',
    '.hhhhsssssshhhhhh.',
    '.hhhsddssssddshhh.',
    '.hhhseesssseeshhh.',
    '.hhhsssssssssshhh.',
    '.hhhsrssSSssrshhh.',
    '.hhhsssmmmmssshhh.',
    'hhHhhsssssssshhHhh',
    'hhhhhhhSSSShhhhhhh',
    'hhhhjjJttttJjjhhhh',
    'hhhjjjJtnntJjjjhhh',
    'ssjjjjJttttJjjjjss',
    'ss..jjJttttJjj..ss',
    '....jjJttttJjj....',
  ];

  /* Helge: huge dark pompadour, round white-rimmed shades, toothy grin,
   * long chin, white turtleneck (purple trousers as a nod to his backdrop). */
  const HELGE_UPPER = [
    '....hhhhhhhhhh....',
    '..hhhhhHHhhhhhhh..',
    '.hhhhHHhhhhhhhhhh.',
    '.hhhhhhhhhhhhhhhh.',
    '.hhhhhhsssssssshh.',
    '.hhhgggssssggghhh.',
    '.hhgeweeggeweeghh.',
    '.hhgeeeeggeeeeghh.',
    '.hhhgggsnnsggghhh.',
    '.hhhssssnnsssshhh.',
    '.hhsswwwwwwwwsshh.',
    '....sSmmmmmmSs....',
    '....sSssssssSs....',
    '....tttttttttt....',
    'sstttTttttttTtttss',
    'ss..tTttttttTt..ss',
    '....TttttttttT....',
  ];

  /* Lippo – golden retriever, sitting, facing right */
  const LIPPO_MAP = [
    '........ffffff....',
    '.......fFFffffff..',
    '......dfFfffewfff.',
    '......ddffffffffnn',
    '......dddfffFFFt..',
    '......dddffffftt..',
    '.......ddfffff....',
    'dd....fffFFfff....',
    'fdd..ffffFFFff....',
    '.fdfffffffFFff....',
    '..ffffffffffff....',
    '..fffffffffFff....',
    '...ffff..ffFf.....',
    '..FFFF...FFFF.....',
  ];

  const OUTLINE = '#1b1626';

  /* Palettes per character (+ signature board colours from the artwork) */
  const CHARACTERS = {
    wave: {
      id: 'wave', name: 'Wave', head: 12, upper: WAVE_UPPER,
      palette: {
        b: '#1d1d26', B: '#3a3a4a', h: '#eef0f5', H: '#c4c8d4', s: '#f6d2b6', S: '#e0a887',
        g: '#15151c', l: '#cfe3f2', e: '#1f1a2b', m: '#b8405e', w: '#ffffff',
        c: '#22222c', C: '#383846',
        p: '#1f1f28', P: '#f2f2f2', q: '#15151c', k: '#e6d8b8', K: '#b7a27a',
      },
      board: { colors: ['#1f5fc0', '#4fd0ff', '#1f5fc0'], glow: '#5ad1ff' },
      desc: 'Beanie & blue lightning board',
    },
    khaki: {
      id: 'khaki', name: 'Khaki', head: 12, upper: KHAKI_UPPER,
      palette: {
        h: '#6b3f24', H: '#9a6238', s: '#f4cfb2', S: '#dca283', d: '#4a2a18', e: '#2a1a14',
        w: '#ffffff', r: '#f0a0a8', m: '#c44d62',
        j: '#cfb68d', J: '#a58d66', t: '#1c1a22', n: '#f2c14e',
        p: '#2a2530', P: '#3f3848', q: '#1a171f', k: '#5a3d2a', K: '#7d5a40',
      },
      board: { colors: ['#1e3a26', '#2f8f4a', '#1e3a26'], glow: '#4dff7c' },
      desc: 'Khaki jacket & neon board',
    },
    sky: {
      id: 'sky', name: 'Sky', head: 12, upper: SKY_UPPER,
      palette: {
        h: '#eeb449', H: '#fbe08a', s: '#f8d5bc', S: '#e2a98b', g: '#7a4b32', w: '#ffffff',
        e: '#1f1a2b', r: '#f29ab0', m: '#d4506e', c: '#f5f7fb', C: '#7b9cc9', b: '#3d4461',
        y: '#e8743b', z: '#46a6d9',
        p: '#86acd8', P: '#5f86b3', q: '#5f86b3', k: '#4f7fd1', K: '#ff79a8',
      },
      board: { colors: ['#c42a3e', '#ff6070', '#c42a3e'], glow: '#ff5a5a' },
      desc: 'Backpack, glasses & red board',
    },
    helge: {
      id: 'helge', name: 'Helge', head: 13, upper: HELGE_UPPER,
      palette: {
        h: '#2e2e34', H: '#4f4f5a', s: '#f8dcc4', S: '#e0b89a', n: '#f0a070',
        g: '#e4e4ea', e: '#0e0e12', w: '#ffffff', m: '#9c3b4c',
        t: '#fafafa', T: '#d6d6de',
        p: '#5a3aa8', P: '#7753c4', q: '#3e2780', k: '#1d1d26', K: '#3a3a4a',
      },
      board: { colors: ['#5a36b8', '#b58cff', '#5a36b8'], glow: '#b07cff' },
      desc: 'The mascot himself',
    },
  };

  function poseMap(def, pose) {
    if (pose === 'duck') {
      // keep the head, squash the torso to arms + hem, crouch the legs
      const u = def.upper;
      return u.slice(0, def.head).concat([u[u.length - 3], u[u.length - 1]], LOWER.duck);
    }
    return def.upper.concat(LOWER[pose === 'jump' ? 'jump' : 'run']);
  }

  /* Build a sprite canvas from a map + palette, optionally with a 1px outline */
  function buildSprite(map, palette, outline) {
    const w = map[0].length, h = map.length;
    const pad = outline ? 1 : 0;
    const canvas = document.createElement('canvas');
    canvas.width = w + pad * 2; canvas.height = h + pad * 2;
    const ctx = canvas.getContext('2d');
    const solid = (r, c) => r >= 0 && r < h && c >= 0 && c < w && !!palette[map[r][c]];
    if (outline) {
      ctx.fillStyle = outline;
      for (let r = -1; r <= h; r++)
        for (let c = -1; c <= w; c++)
          if (!solid(r, c) && (solid(r - 1, c) || solid(r + 1, c) || solid(r, c - 1) || solid(r, c + 1)))
            ctx.fillRect(c + pad, r + pad, 1, 1);
    }
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const col = palette[map[r][c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(c + pad, r + pad, 1, 1);
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
    const cnv = buildSprite(poseMap(def, pose), def.palette, OUTLINE);
    cache.set(key, cnv);
    return cnv;
  }

  function lippoSprite() {
    if (cache.has('lippo')) return cache.get('lippo');
    const cnv = buildSprite(LIPPO_MAP, {
      f: '#e3a43c', F: '#f6c96e', d: '#b8741f', e: '#1f1a2b', w: '#ffffff', n: '#2a1e18', t: '#f07a8a',
    }, OUTLINE);
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
  /* The classic board is replaced by the character's signature board
   * (red / blue / green / purple glow, as in the team artwork). */
  function drawBoard(ctx, x, y, w, h, boardId, tilt, charId) {
    const sig = (!boardId || boardId === 'classic') && CHARACTERS[charId] && CHARACTERS[charId].board;
    const def = sig || BOARDS[boardId] || BOARDS.classic;
    const segs = def.colors.length;
    ctx.save();
    ctx.translate(x, y);
    if (tilt) ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
    const hw = w / 2, hh = h / 2;
    if (sig) {
      // neon glow halo under the board
      ctx.fillStyle = def.glow;
      ctx.globalAlpha = 0.45 + 0.15 * Math.sin(Date.now() * 0.008);
      ctx.beginPath(); ctx.ellipse(0, 0, hw + 6, hh + 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // board outline, then colour segments clipped to the board shape
    ctx.fillStyle = '#1b1626';
    ctx.beginPath(); ctx.ellipse(0, 0, hw + 2, hh + 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2); ctx.clip();
    for (let i = 0; i < segs; i++) {
      ctx.fillStyle = def.colors[i % def.colors.length];
      ctx.fillRect(-hw + (w / segs) * i - 0.5, -hh - 1, w / segs + 1, h + 2);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-hw * 0.5, -1, w * 0.5, 2);
    if (sig) {
      // lightning zig-zag decal
      ctx.fillStyle = def.glow;
      const u = Math.max(2, Math.round(h / 8));
      ctx.fillRect(-3 * u, -2 * u, 3 * u, u);
      ctx.fillRect(-u, -u, u, u);
      ctx.fillRect(-u, 0, 3 * u, u);
      ctx.fillRect(u, u, u, u);
    }
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
    // head & shoulders only (like the portrait artwork), on a purple disc
    const full = surferSprite('helge', 'run');
    const base = document.createElement('canvas');
    base.width = full.width; base.height = CHARACTERS.helge.head + 2; // outline row + turtleneck
    base.getContext('2d').drawImage(full, 0, 0);
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
