// game.js — state, physics, update loop, highscores.

// ── Constants ─────────────────────────────────────────────────────────────────
const W = 800, H = 480, TILE = 40;
const GRAVITY = 0.21, JUMP_FORCE = -7, PLAYER_SPEED = 1.95;

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Fullscreen scaling ────────────────────────────────────────────────────────
function resizeGame() {
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 480);
  const c = document.getElementById('gameContainer');
  c.style.left      = Math.round((window.innerWidth  - 800 * scale) / 2) + 'px';
  c.style.top       = Math.round((window.innerHeight - 480 * scale) / 2) + 'px';
  c.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', resizeGame);
resizeGame();

// ── Game state ────────────────────────────────────────────────────────────────
let state = 'menu';
let score = 0, lives = 3, maxLives = 3, currentLevel = 0;
let camera = { x: 0 };
let player, tiles, candies, enemies, flag, selma;
let heartPickups = [], forkPickups = [], powerPickups = [], projectiles = [];
let particles = [], clouds = [];
let frameCount = 0;
let boss = null;
let levelCompleteTimer = 0, levelStartTimer = 0;
let onLevelCompleteEnd = null, levelCompleteMsg = 'LEVEL COMPLETE!';

// ── Boss config ────────────────────────────────────────────────────────────────
const BOSS_CONFIGS = {
  // speed = walk speed; jumpDelay = frames between jumps (lower = more aggressive)
  // shotDelay / shotSpeed apply to Ganon's fireballs only
  2: { type: 'mushroomking', hp: 5,  speed: 0.65, jumpDelay: 130 },
  5: { type: 'mushroomking', hp: 9,  speed: 0.80, jumpDelay: 100 },
  9: { type: 'ganon', hp: 18, speed: 1.15, jumpDelay: 70, shotDelay: 55, shotSpeed: 3.0 },
};

// ── Settings (persisted) ───────────────────────────────────────────────────────
let musicEnabled = true;
let difficulty   = 'normal'; // 'easy' | 'normal' | 'hard'
(function loadCfg() {
  try {
    const s = JSON.parse(localStorage.getItem('supersam_cfg') || '{}');
    if (s.music === false) musicEnabled = false;
    if (['easy','normal','hard'].includes(s.diff)) difficulty = s.diff;
  } catch {}
})();
function saveCfg() {
  try { localStorage.setItem('supersam_cfg', JSON.stringify({ music: musicEnabled, diff: difficulty })); } catch {}
}

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  // Number keys 1–9 jump to that level; 0 jumps to level 10
  if (state !== 'gameover' && state !== 'win') {
    const num = parseInt(e.key);
    if (!isNaN(num) && e.key >= '0' && e.key <= '9') {
      const lvl = num === 0 ? 9 : num - 1;
      if (lvl < LEVELS.length) jumpToLevel(lvl);
    }
  }
  e.preventDefault && [' ','ArrowUp','ArrowDown'].includes(e.key) && e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
// Touch input (separate from gamepad so pollGamepad doesn't clobber it)
const touch = { left: false, right: false, jump: false, fire: false };

function isLeft()  { return keys['ArrowLeft']  || keys['KeyA']  || gp.left  || touch.left; }
function isRight() { return keys['ArrowRight'] || keys['KeyD']  || gp.right || touch.right; }
function isJump()  { return keys['ArrowUp'] || keys['KeyW'] || keys['Space'] || gp.jump || touch.jump; }
function isFork()  { return keys['KeyF'] || gp.fork || touch.fire; }

// ── Gamepad ───────────────────────────────────────────────────────────────────
const gp = { left:false, right:false, jump:false, fork:false, justA:false, justStart:false };
const _gpPrev = {};

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for (let i = 0; i < pads.length; i++) { if (pads[i]) { pad = pads[i]; break; } }

  if (!pad) {
    gp.left = gp.right = gp.jump = gp.fork = gp.justA = gp.justStart = false;
    return;
  }

  const b    = i => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const ax   = i => (pad.axes[i] !== undefined ? pad.axes[i] : 0);
  const just = i => b(i) && !_gpPrev[i];

  // Standard gamepad layout:
  // Axes 0/1 = left stick, Buttons 0=A 1=B 2=X 3=Y 4=LB 5=RB 8=Select 9=Start 12=Up 13=Down 14=Left 15=Right
  gp.left      = ax(0) < -0.3 || b(14);
  gp.right     = ax(0) >  0.3 || b(15);
  gp.jump      = b(0) || b(12) || ax(1) < -0.5;
  gp.fork      = b(2) || b(1)  || b(5);
  gp.justA     = just(0);
  gp.justStart = just(9) || just(8);

  for (let i = 0; i < pad.buttons.length; i++) _gpPrev[i] = b(i);
}

window.addEventListener('gamepadconnected', e => {
  const t = document.createElement('div');
  t.textContent = `🎮 ${e.gamepad.id.slice(0, 36)} connected`;
  t.style.cssText = 'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);' +
    'background:#1a0838;color:#ffd700;padding:9px 18px;border-radius:8px;' +
    'font-family:monospace;font-size:12px;z-index:9999;border:2px solid #ffd700;pointer-events:none;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
});

// ── Build Level ───────────────────────────────────────────────────────────────
function buildLevel(lvlIdx) {
  const map  = LEVELS[lvlIdx];
  const rows = map.length;
  const cols = map[6].length; // ground row is canonical width
  tiles = []; candies = []; enemies = [];
  heartPickups = []; forkPickups = []; powerPickups = []; projectiles = []; particles = [];
  flag = null; selma = null; boss = null;

  const eSpeeds = [0.45, 0.55, 0.6, 0.68, 0.75, 0.83, 0.9, 1.0, 1.08, 1.2];
  const eSpeed  = eSpeeds[lvlIdx] || 1.2;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = col < map[row].length ? map[row][col] : '_';
      const x = col * TILE, y = row * TILE;
      if      (ch === 'G') tiles.push({ x, y, type:'ground',   w:TILE,    h:TILE });
      else if (ch === 'B') tiles.push({ x, y, type:'brick',    w:TILE,    h:TILE });
      else if (ch === 'P') tiles.push({ x, y, type:'platform', w:TILE,    h:TILE/2 });
      else if (ch === 'C') candies.push({ x:x+8, y:y+4, w:24, h:24, alive:true });
      else if (ch === 'H') heartPickups.push({ x:x+4, y:y+2, w:24, h:24, alive:true });
      else if (ch === 'W') forkPickups.push({ x:x+4, y:y+2, w:24, h:28, alive:true, type:'fork'  });
      else if (ch === 'S') forkPickups.push({ x:x+4, y:y+2, w:24, h:28, alive:true, type:'sword' });
      else if (ch === 'X') powerPickups.push({ x:x+4, y:y+4, w:24, h:24, alive:true, type:'boots' });
      else if (ch === 'V') powerPickups.push({ x:x+4, y:y+4, w:24, h:24, alive:true, type:'cape'  });
      else if ('EJRTZ'.includes(ch) && x >= 8 * TILE) {
        const rate = difficulty === 'easy' ? 0.35 : difficulty === 'hard' ? 1.0 : 0.72;
        if (Math.random() < rate) enemies.push(makeEnemy(x, y+4, eSpeed, lvlIdx, ch));
      }
      else if (ch === 'F') flag  = { x:x+8, y:y-40, w:24, h:80, pole:{ x, y:y-40, h:80 } };
      else if (ch === 'K') selma = { x:x+4, y:y-80, w:32, h:80, poleX:x, poleY:y-80, poleH:80 };
    }
  }

  clouds = [];
  for (let i = 0; i < 14; i++) {
    clouds.push({ x:Math.random()*cols*TILE, y:30+Math.random()*110, speed:0.3+Math.random()*0.4, w:80+Math.random()*60 });
  }

  // Spawn boss for boss levels
  const bossCfg = BOSS_CONFIGS[lvlIdx];
  const goal = selma || flag;
  if (bossCfg && goal) {
    const bx = goal.x - (bossCfg.type === 'ganon' ? 340 : 290);
    boss = {
      type: bossCfg.type,
      x: Math.max(80, bx), y: 160,
      w: bossCfg.type === 'ganon' ? 56 : 48,
      h: bossCfg.type === 'ganon' ? 72 : 60,
      vx: -(bossCfg.speed || (bossCfg.type === 'ganon' ? 0.8 : 0.6)),
      vy: 0, onGround: false,
      hp: bossCfg.hp, maxHp: bossCfg.hp,
      alive: true, invincible: 0,
      speed:     bossCfg.speed     || (bossCfg.type === 'ganon' ? 0.8 : 0.6),
      jumpTimer: bossCfg.jumpDelay || 150,
      jumpDelay: bossCfg.jumpDelay || 150,
      shotTimer: bossCfg.shotDelay || 100,
      shotDelay: bossCfg.shotDelay || 100,
      shotSpeed: bossCfg.shotSpeed || 2,
      rage: false,
      bossProjectiles: [],
    };
  }

  player = {
    x:60, y:200, w:36, h:44, vx:0, vy:0,
    onGround:false, jumpHeld:false, weaponHeld:false, dir:1,
    frame:0, frameTimer:0, invincible:0, swordSwing:0,
    weapon:     player ? player.weapon     : null,
    superBoots: player ? (player.superBoots || false) : false,
    superCape:  player ? (player.superCape  || false) : false,
    capeFlutter: 240,
    mapWidth: cols * TILE,
  };
  camera.x = 0;
}

function makeEnemy(x, y, speed, lvl, type) {
  const wander = lvl >= 4 ? 80 + Math.random()*80 : 9999;
  const isR = type === 'R', isT = type === 'T', isZ = type === 'Z', isJ = type === 'J';
  const spd  = isR ? speed * 1.9 : isT ? speed * 0.55 : speed;
  return {
    x, y,
    w: isT ? 44 : isZ ? 38 : 34, h: isT ? 44 : isZ ? 30 : 36,
    vx: spd, vy: 0,
    alive: true, onGround: false,
    type,
    hp: isT ? 3 : 2,
    invincible: 0,
    jumper: isJ,
    flyer: isZ,
    flyY: y + 4,
    jumpTimer: 60 + Math.floor(Math.random()*80),
    wanderTimer: wander,
    chargeTimer: lvl >= 6 ? 120 + Math.floor(Math.random()*120) : 9999,
    speed: spd,
  };
}

// ── Collision ─────────────────────────────────────────────────────────────────
function rectOverlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function resolvePlayerTiles() {
  player.onGround = false;
  const toRemove = new Set();
  for (const t of tiles) {
    if (toRemove.has(t) || !rectOverlap(player, t)) continue;
    const ox = Math.min(player.x+player.w, t.x+t.w) - Math.max(player.x, t.x);
    const oy = Math.min(player.y+player.h, t.y+t.h) - Math.max(player.y, t.y);
    if (ox < oy) {
      player.x += player.x < t.x ? -ox : ox;
      player.vx = 0;
    } else {
      if (player.y < t.y) {
        player.y = t.y - player.h; player.vy = 0; player.onGround = true;
      } else if (t.type !== 'platform') {
        if (t.type === 'brick' && player.vy < 0) {
          toRemove.add(t);
          player.y = t.y + t.h; player.vy = 2;
          sfxCrash(); spawnBrickDebris(t.x + TILE/2, t.y, currentLevel);
        } else {
          player.y = t.y + t.h; player.vy = 0; sfxBump();
        }
      }
    }
  }
  if (toRemove.size > 0) tiles = tiles.filter(t => !toRemove.has(t));
}

// ── Particles ─────────────────────────────────────────────────────────────────
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    particles.push({ x, y, vx:Math.cos(a)*3, vy:Math.sin(a)*3-2, life:30, color, size:5 });
  }
}

function spawnConfetti() {
  const cols = ['#ffd700','#ff6b6b','#6bffb0','#6bb4ff','#ff6bff','#ffffa0','#ffffff'];
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: camera.x + Math.random() * W,
      y: -10 + Math.random() * H * 0.4,
      vx: (Math.random()-0.5)*4,
      vy: 1.5 + Math.random()*3,
      life: 80 + Math.random()*70,
      color: cols[Math.floor(Math.random()*cols.length)],
      size: 4 + Math.random()*7,
    });
  }
}

function spawnBrickDebris(x, y, lv) {
  const cols = [BRICK_COL[lv],'#e0a060','#c07830','#f0c080','#aa5020'];
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI + Math.random() * Math.PI, sp = 2.5 + Math.random() * 4;
    particles.push({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-2,
      life:28+Math.random()*14, color:cols[i%cols.length], size:3+Math.random()*4 });
  }
}

// ── Weapon throw ───────────────────────────────────────────────────────────────
function throwWeapon() {
  if (!player.weapon) return;
  const maxActive = player.weapon === 'sword' ? 3 : 1;
  if (projectiles.filter(p=>p.alive).length >= maxActive) return;
  sfxForkThrow();
  const px = player.dir === 1 ? player.x + player.w : player.x - 28;
  if (player.weapon === 'sword') {
    player.swordSwing = 16;
    projectiles.push({ x:px, y:player.y+10, w:30, h:8, vx:player.dir*5, life:58, alive:true, type:'sword', damage:2 });
    projectiles.push({ x:px, y:player.y+26, w:30, h:8, vx:player.dir*5, life:58, alive:true, type:'sword', damage:2 });
  } else {
    projectiles.push({ x:px, y:player.y+18, w:28, h:8, vx:player.dir*4,  life:54, alive:true, type:'fork',  damage:1 });
  }
}

// ── Boss logic ─────────────────────────────────────────────────────────────────
function updateBoss() {
  if (!boss || !boss.alive) return;

  // Gravity & movement
  boss.vy += GRAVITY;
  boss.x  += boss.vx;
  boss.y  += boss.vy;

  // Tile collision
  boss.onGround = false;
  for (const t of tiles) {
    if (!rectOverlap(boss, t)) continue;
    const ox = Math.min(boss.x+boss.w, t.x+t.w) - Math.max(boss.x, t.x);
    const oy = Math.min(boss.y+boss.h, t.y+t.h) - Math.max(boss.y, t.y);
    if (ox < oy) { boss.vx *= -1; boss.x += boss.vx * 2; }
    else if (boss.y < t.y) { boss.y = t.y - boss.h; boss.vy = 0; boss.onGround = true; }
  }

  // Reverse at world edges or near player start
  const goal = selma || flag;
  const minX = goal ? goal.x - 400 : 0;
  if (boss.x < Math.max(0, minX)) { boss.x = Math.max(0, minX); boss.vx =  Math.abs(boss.vx); }
  if (boss.x + boss.w > player.mapWidth) { boss.x = player.mapWidth - boss.w; boss.vx = -Math.abs(boss.vx); }

  // Respawn if boss somehow falls off
  if (boss.y > H + 120) { boss.y = 160; boss.vy = 0; }

  // Rage at half HP
  if (!boss.rage && boss.hp <= boss.maxHp / 2) {
    boss.rage = true;
    boss.vx = (boss.vx < 0 ? -1 : 1) * boss.speed * 1.6;
  }

  // Jump
  if (boss.onGround) {
    boss.jumpTimer--;
    if (boss.jumpTimer <= 0) {
      boss.vy = boss.type === 'ganon' ? -6.5 : -5.2;
      boss.jumpTimer = boss.rage
        ? Math.floor(boss.jumpDelay * 0.45) + Math.floor(Math.random() * 25)
        : boss.jumpDelay + Math.floor(Math.random() * 45);
    }
  }

  // Ganon fireballs
  if (boss.type === 'ganon') {
    boss.shotTimer--;
    if (boss.shotTimer <= 0) {
      const dir = player.x > boss.x ? 1 : -1;
      const spd = boss.shotSpeed;
      boss.bossProjectiles.push({
        x: boss.x + boss.w/2, y: boss.y + 24,
        vx: dir * (boss.rage ? spd * 1.4 : spd), vy: -0.75,
        life: 100, alive: true,
      });
      if (boss.rage) {
        // Second projectile arcing high — punishes jumping over first
        boss.bossProjectiles.push({
          x: boss.x + boss.w/2, y: boss.y + 24,
          vx: dir * spd * 1.1, vy: -3.0,
          life: 100, alive: true,
        });
      }
      boss.shotTimer = boss.rage ? Math.floor(boss.shotDelay * 0.5) : boss.shotDelay;
    }
  }

  // Update boss projectiles
  for (const bp of boss.bossProjectiles) {
    if (!bp.alive) continue;
    bp.x += bp.vx; bp.y += bp.vy; bp.vy += 0.08; bp.life--;
    if (bp.life <= 0) { bp.alive = false; continue; }
    // Hit tiles
    for (const t of tiles) {
      if (t.type !== 'platform' && rectOverlap({ x:bp.x-8, y:bp.y-8, w:16, h:16 }, t)) {
        bp.alive = false; break;
      }
    }
    if (!bp.alive) continue;
    if (player.invincible === 0 && rectOverlap(player, { x:bp.x-8, y:bp.y-8, w:16, h:16 })) {
      bp.alive = false; lives--;
      player.invincible = 120; player.vy = JUMP_FORCE * 0.5; sfxDieSad();
      if (lives <= 0) { endGame('gameover'); return; }
    }
  }
  boss.bossProjectiles = boss.bossProjectiles.filter(b => b.alive);

  // Invincibility frames
  if (boss.invincible > 0) boss.invincible--;

  // Player weapon hits boss
  for (const pr of projectiles) {
    if (!pr.alive || boss.invincible > 0) continue;
    if (rectOverlap(pr, boss)) {
      pr.alive = false; boss.hp -= pr.damage || 1; boss.invincible = 40;
      sfxStomp(); spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ff8800', 7);
      if (boss.hp <= 0) { defeatBoss(); return; }
    }
  }

  // Player stomps boss
  if (boss.invincible === 0 && player.invincible === 0 && rectOverlap(player, boss)) {
    const pBot = player.y + player.h;
    if (player.vy > 0 && pBot - player.vy <= boss.y + 14) {
      boss.hp -= 2; boss.invincible = 60;
      player.vy = JUMP_FORCE * 0.75;
      sfxStomp(); spawnParticles(boss.x + boss.w/2, boss.y, '#ff4444', 10);
      if (boss.hp <= 0) { defeatBoss(); return; }
    } else {
      lives--; player.invincible = 120; player.vy = JUMP_FORCE * 0.6; sfxDieSad();
      if (lives <= 0) { endGame('gameover'); return; }
    }
  }
}

function defeatBoss() {
  boss.alive = false; sfxLevel();
  for (let i = 0; i < 25; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
    particles.push({ x:boss.x+boss.w/2, y:boss.y+boss.h/2,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-3,
      life:40+Math.random()*20, color:['#ffd700','#ff8800','#ff4444','#ffffff'][Math.floor(Math.random()*4)], size:4+Math.random()*5 });
  }
  score += 1000;
}

// ── Update ─────────────────────────────────────────────────────────────────────
function update() {
  frameCount++;

  // Movement
  if      (isLeft())  { player.vx -= 1.5; player.dir = -1; }
  else if (isRight()) { player.vx += 1.5; player.dir =  1; }
  else                { player.vx *= 0.75; }
  const _spd = PLAYER_SPEED * (player.superBoots ? 1.3 : 1.0);
  player.vx = Math.max(-_spd, Math.min(_spd, player.vx));

  // Jump
  if (isJump() && player.onGround && !player.jumpHeld) {
    player.vy = JUMP_FORCE; player.jumpHeld = true; sfxJump();
  }
  if (!isJump()) player.jumpHeld = false;

  // Weapon throw
  if (isFork() && !player.weaponHeld) { player.weaponHeld = true; throwWeapon(); }
  if (!isFork()) player.weaponHeld = false;

  // Sword swing countdown
  if (player.swordSwing > 0) player.swordSwing--;

  // Reset cape flutter when grounded
  if (player.onGround) player.capeFlutter = 240;

  // Physics — variable gravity for Mario-style jump feel
  if (player.vy < 0 && isJump()) {
    player.vy += GRAVITY * 0.65;                                  // normal rising arc
  } else if (!player.onGround && player.superCape && player.capeFlutter > 0 && isJump()) {
    player.vy = Math.min(player.vy + GRAVITY * 0.10, 0.6);       // cape glide — slow drift
    player.capeFlutter--;
  } else if (player.vy < 0) {
    player.vy += GRAVITY * 2.5;
  } else {
    player.vy += GRAVITY * 1.6;
  }
  if (player.vy > 8) player.vy = 8;

  player.x += player.vx;
  player.x = Math.max(0, player.x);
  resolvePlayerTiles();
  player.y += player.vy;
  resolvePlayerTiles();
  if (player.x + player.w > player.mapWidth) player.x = player.mapWidth - player.w;

  // Camera
  const target = player.x - W/2 + player.w/2;
  camera.x += (target - camera.x) * 0.12;
  camera.x = Math.max(0, Math.min(camera.x, player.mapWidth - W));

  // Walk animation
  if (Math.abs(player.vx) > 0.3) {
    if (++player.frameTimer > 8) { player.frame = (player.frame+1)%4; player.frameTimer=0; }
  } else { player.frame = 0; }

  // Candy
  for (const c of candies) {
    if (!c.alive || !rectOverlap(player, c)) continue;
    c.alive = false; score += 100; sfxCoin();
    spawnParticles(c.x+12, c.y+12, '#ff69b4');
  }

  // Heart pickup
  for (const h of heartPickups) {
    if (!h.alive || !rectOverlap(player, h)) continue;
    h.alive = false;
    maxLives++; lives = Math.min(lives + 1, maxLives);
    sfxHeart(); spawnParticles(h.x+12, h.y+12, '#ff2244', 12);
  }

  // Weapon pickup
  for (const m of forkPickups) {
    if (!m.alive || !rectOverlap(player, m)) continue;
    m.alive = false;
    player.weapon = m.type;
    if (m.type === 'sword') sfxSwordGet(); else sfxForkGet();
    spawnParticles(m.x+12, m.y+14, m.type === 'sword' ? '#4488ff' : '#ffd700', 12);
  }

  // Power pickups (boots / cape) — permanent upgrades that persist across levels
  for (const p of powerPickups) {
    if (!p.alive || !rectOverlap(player, p)) continue;
    p.alive = false;
    if (p.type === 'boots') { player.superBoots = true; }
    else if (p.type === 'cape') { player.superCape = true; player.capeFlutter = 240; }
    sfxSwordGet();
    spawnParticles(p.x+12, p.y+12, p.type === 'boots' ? '#ffd700' : '#cc66ff', 20);
  }

  // Projectiles
  for (const pr of projectiles) {
    if (!pr.alive) continue;
    pr.x += pr.vx; pr.life--;
    if (pr.life <= 0) { pr.alive = false; continue; }
    for (const t of tiles) {
      if (t.type !== 'platform' && rectOverlap(pr, t)) { pr.alive = false; break; }
    }
    if (!pr.alive) continue;
    // enemy-projectile collision handled inside enemy loop below
  }
  // NOTE: projectiles.filter runs AFTER the enemy loop so kills made there are caught

  // Boss
  updateBoss();

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.invincible > 0) e.invincible--;

    e.onGround = false;
    e.x += e.vx;

    if (e.flyer) {
      // Flyers: float toward their home altitude, no gravity
      e.vy = (e.flyY - e.y) * 0.12;
      e.y += e.vy;
    } else {
      e.vy += GRAVITY; e.y += e.vy;
      for (const t of tiles) {
        if (!rectOverlap(e, t)) continue;
        const ox = Math.min(e.x+e.w,t.x+t.w) - Math.max(e.x,t.x);
        const oy = Math.min(e.y+e.h,t.y+t.h) - Math.max(e.y,t.y);
        if (ox < oy) { e.vx *= -1; e.x += e.vx; }
        else if (e.y < t.y) { e.y = t.y - e.h; e.vy = 0; e.onGround = true; }
      }
      if (e.y > H + 80) { e.alive = false; continue; }
    }

    if (e.x < 0 || e.x + e.w > player.mapWidth) e.vx *= -1;

    // Tile x-collision for flyers too
    if (e.flyer) {
      for (const t of tiles) {
        if (!rectOverlap(e, t)) continue;
        const ox = Math.min(e.x+e.w,t.x+t.w) - Math.max(e.x,t.x);
        const oy = Math.min(e.y+e.h,t.y+t.h) - Math.max(e.y,t.y);
        if (ox < oy) { e.vx *= -1; e.x += e.vx * 2; break; }
      }
    }

    // Jumping
    if (e.jumper && e.onGround) {
      e.jumpTimer--;
      if (e.jumpTimer <= 0) {
        e.vy = -(4 + Math.random() * 1.5);
        e.jumpTimer = 60 + Math.floor(Math.random() * 80);
      }
    }

    // Wandering
    if (e.onGround || e.flyer) {
      e.wanderTimer--;
      if (e.wanderTimer <= 0) {
        if (Math.random() < 0.35) e.vx *= -1;
        e.wanderTimer = 80 + Math.floor(Math.random() * 100);
      }
    }

    // Charging
    e.chargeTimer--;
    if (e.chargeTimer <= 0 && (e.onGround || e.flyer)) {
      const dir = player.x > e.x ? 1 : -1;
      e.vx = dir * e.speed * 2.2;
      e.chargeTimer = 200 + Math.floor(Math.random() * 120);
      setTimeout(() => { if (e.alive) e.vx = (e.vx > 0 ? 1 : -1) * e.speed; }, 700);
    }

    if (rectOverlap(player, e) && player.invincible === 0 && e.invincible === 0) {
      const pBot = player.y + player.h;
      const canStomp = !e.flyer && player.vy > 0 && pBot - player.vy <= e.y + 10;
      if (canStomp) {
        e.alive = false;
        score += (e.type === 'T' ? 350 : e.type === 'R' ? 250 : 200);
        sfxStomp(); spawnParticles(e.x+e.w/2, e.y+e.h/2, '#ff4444', 10);
        player.vy = JUMP_FORCE * 0.65;
      } else {
        player.invincible = 120; lives--;
        sfxDieSad();
        if (lives <= 0) { endGame('gameover'); return; }
        player.vy = JUMP_FORCE * 0.65;
      }
    }

    // Projectile hits enemy
    for (const pr of projectiles) {
      if (!pr.alive || !e.alive || e.invincible > 0) continue;
      if (rectOverlap(pr, e)) {
        pr.alive = false;
        e.hp -= pr.damage || 1;
        if (e.hp <= 0) {
          e.alive = false;
          score += (e.type === 'T' ? 350 : e.type === 'Z' ? 300 : e.type === 'R' ? 250 : 150);
          sfxStomp(); spawnParticles(e.x+e.w/2, e.y+e.h/2, '#ffaa00', 10);
        } else {
          e.invincible = 50;
          sfxBump(); spawnParticles(e.x+e.w/2, e.y+e.h/2, '#ff8844', 5);
        }
        break;
      }
    }
  }

  projectiles = projectiles.filter(p => p.alive);

  if (player.invincible > 0) player.invincible--;

  // Clouds
  for (const c of clouds) { c.x -= c.speed; if (c.x + c.w < 0) c.x = player.mapWidth; }

  // Particles
  for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; }
  particles = particles.filter(p => p.life > 0);

  // Flag / Selma goal
  const bossBlocking = boss && boss.alive;

  if (flag && !bossBlocking && rectOverlap(player, { x:flag.x, y:flag.y, w:flag.w, h:flag.h })) {
    score += 500; stopBGM(); sfxVictory();
    spawnConfetti(); spawnConfetti(); spawnConfetti();
    levelCompleteMsg = 'LEVEL COMPLETE!';
    levelCompleteTimer = 0;
    state = 'levelcomplete';
    onLevelCompleteEnd = () => {
      if (currentLevel < LEVELS.length - 1) {
        currentLevel++; buildLevel(currentLevel);
        levelStartTimer = 0; state = 'levelstart';
      } else { endGame('win'); }
    };
    return;
  }

  if (selma && !bossBlocking && rectOverlap(player, { x:selma.x, y:selma.y, w:selma.w, h:selma.h })) {
    score += 2000; stopBGM(); sfxVictory(); sfxHeart();
    spawnConfetti(); spawnConfetti(); spawnConfetti();
    levelCompleteMsg = 'SELMA SAVED!';
    levelCompleteTimer = 0;
    state = 'levelcomplete';
    onLevelCompleteEnd = () => endGame('win');
    return;
  }

  // Fall off world
  if (player.y > H + 60) {
    lives--; sfxDieSad();
    if (lives <= 0) { endGame('gameover'); return; }
    player.x = 60; player.y = 200; player.vx = 0; player.vy = 0;
    player.invincible = 90;
  }

  updateHUD();
}

// ── HUD ────────────────────────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
  document.getElementById('levelDisplay').textContent = `Level ${currentLevel+1}`;
  const bar = document.getElementById('livesBar');
  bar.innerHTML = '';
  for (let i = 0; i < lives; i++) {
    if (i === 0) {
      const wrap = document.createElement('span');
      wrap.style.cssText = 'position:relative;display:inline-block;';
      const h = document.createElement('span'); h.className = 'heart'; h.textContent = '❤️';
      wrap.appendChild(h);
      const badge = document.createElement('span');
      badge.style.cssText = 'position:absolute;top:-5px;left:50%;transform:translateX(-50%);' +
        'background:#cc0022;color:#fff;font-size:10px;font-weight:900;' +
        'border-radius:8px;padding:0 4px;line-height:14px;pointer-events:none;' +
        'text-shadow:none;border:1px solid #ff6688;';
      badge.textContent = lives;
      wrap.appendChild(badge);
      bar.appendChild(wrap);
    } else {
      const h = document.createElement('span'); h.className = 'heart'; h.textContent = '❤️';
      bar.appendChild(h);
    }
  }
  const fi = document.getElementById('forkHud');
  if (fi) {
    fi.style.display = player && player.weapon ? 'inline' : 'none';
    fi.textContent   = player && player.weapon === 'sword' ? '⚔️' : '🍴';
  }
}

// ── Highscores ─────────────────────────────────────────────────────────────────
function loadHS() {
  try { return JSON.parse(localStorage.getItem('supersam_hs') || '[]'); } catch { return []; }
}
function saveHS(name, sc, lvl) {
  const hs = loadHS();
  hs.push({ name, score: sc, level: lvl });
  hs.sort((a, b) => b.score - a.score);
  hs.splice(10);
  localStorage.setItem('supersam_hs', JSON.stringify(hs));
  return hs;
}

function showNameEntry(type) {
  const ol = document.getElementById('overlay');
  ol.innerHTML = ''; ol.style.display = 'flex';
  ol.style.background = 'radial-gradient(ellipse at center,#1a0838dd 0%,#000000bb 100%)';

  const h1 = document.createElement('h1');
  h1.textContent = type === 'win'
    ? (selma ? 'Selma Saved! 🐨🏆' : 'You Win! 🏆')
    : 'Game Over 💀';
  ol.appendChild(h1);

  const sp = document.createElement('p');
  sp.textContent = `Score: ${score}  ·  Level ${currentLevel + 1}`;
  ol.appendChild(sp);

  const np = document.createElement('p'); np.style.marginTop='10px';
  np.textContent = 'Enter your name for the high score list:';
  ol.appendChild(np);

  const inp = document.createElement('input');
  inp.id = 'nameInput'; inp.type = 'text'; inp.maxLength = 16;
  inp.placeholder = 'Your name…'; inp.autocomplete = 'off';
  ol.appendChild(inp);

  const btn = document.createElement('button');
  btn.className = 'btn'; btn.textContent = '💾 Save Score';
  btn.onclick = () => {
    const name = inp.value.trim() || 'Anonymous';
    showHighscores(saveHS(name, score, currentLevel + 1));
  };
  ol.appendChild(btn);
  setTimeout(() => inp.focus(), 120);
}

function showHighscores(hs) {
  const ol = document.getElementById('overlay');
  ol.innerHTML = ''; ol.style.display = 'flex';
  ol.style.background = 'radial-gradient(ellipse at center,#1a0838dd 0%,#000000bb 100%)';
  const h2 = document.createElement('h2'); h2.textContent = '🏆 High Scores';
  ol.appendChild(h2);
  const medals = ['gold','silver','bronze'];
  hs.slice(0, 8).forEach((e, i) => {
    const row = document.createElement('div');
    row.className = 'hs-row' + (medals[i] ? ' ' + medals[i] : '');
    row.textContent = `${i+1}.  ${e.name.padEnd(14)}  ${String(e.score).padStart(7)}  Lv${e.level}`;
    ol.appendChild(row);
  });
  if (hs.length === 0) {
    const row = document.createElement('div'); row.className = 'hs-row';
    row.textContent = '(no scores yet)'; ol.appendChild(row);
  }
  const btn = document.createElement('button');
  btn.className = 'btn'; btn.textContent = '▶ Play Again!';
  btn.onclick = () => startGame();
  ol.appendChild(btn);
}

function showStartMenu() {
  const ol = document.getElementById('overlay');
  ol.innerHTML = ''; ol.style.display = 'flex';
  // Canvas draws the background — overlay is transparent
  ol.style.background = 'none';

  // Push buttons down to the lower portion so the canvas art shows above
  const spacer = document.createElement('div');
  spacer.style.cssText = 'flex:1;min-height:0;';
  ol.appendChild(spacer);

  const hs = loadHS();
  if (hs.length > 0) {
    const ph = document.createElement('p');
    ph.style.cssText = 'color:#ffd700;font-size:13px;margin-bottom:2px;text-shadow:2px 2px 0 #000;';
    ph.textContent = '— Top scores —';
    ol.appendChild(ph);
    hs.slice(0,3).forEach((e,i) => {
      const row = document.createElement('div'); row.className = 'hs-preview';
      row.style.textShadow = '1px 1px 0 #000';
      row.textContent = `${i+1}. ${e.name}  ${e.score} pts`;
      ol.appendChild(row);
    });
  }

  const p2 = document.createElement('p'); p2.className = 'controls';
  p2.style.textShadow = '1px 1px 0 #000';
  p2.textContent = '← → move  ·  ↑ / Space jump  ·  F throw  ·  1-9 level  ·  🎮 D-pad/stick move  A jump  X/B throw  Start play';
  ol.appendChild(p2);

  const playBtn = document.createElement('button');
  playBtn.className = 'btn'; playBtn.textContent = '▶  Play!';
  playBtn.onclick = () => startGame();
  ol.appendChild(playBtn);

  const hsBtn = document.createElement('button');
  hsBtn.className = 'btn btn-hs'; hsBtn.textContent = '🏆 High Scores';
  hsBtn.onclick = () => showHighscores(loadHS());
  ol.appendChild(hsBtn);

  const cfgBtn = document.createElement('button');
  cfgBtn.className = 'btn';
  cfgBtn.style.cssText = 'margin-top:10px;margin-bottom:28px;' +
    'background:linear-gradient(180deg,#554488 0%,#332266 55%,#221144 100%);' +
    'box-shadow:0 7px 0 #110022,0 10px 28px #00000099,inset 0 1px 0 #ffffff55;';
  cfgBtn.textContent = '⚙ Settings';
  cfgBtn.onclick = () => showSettings();
  ol.appendChild(cfgBtn);
}

function showSettings() {
  const ol = document.getElementById('overlay');
  ol.innerHTML = ''; ol.style.display = 'flex';
  ol.style.background = 'none';

  const spacer = document.createElement('div');
  spacer.style.cssText = 'flex:1;';
  ol.appendChild(spacer);

  // Glass panel
  const panel = document.createElement('div');
  panel.style.cssText = [
    'background:rgba(8,4,40,0.90)',
    'border:3px solid #ffd700',
    'border-radius:20px',
    'padding:24px 36px',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'gap:18px',
    'margin-bottom:18px',
    'box-shadow:0 0 40px #ffd70033',
  ].join(';');
  ol.appendChild(panel);

  const title = document.createElement('h2');
  title.textContent = '⚙  Settings';
  title.style.cssText = 'color:#ffd700;text-shadow:2px 2px 0 #c00;margin:0;font-size:28px;';
  panel.appendChild(title);

  const sep = () => {
    const d = document.createElement('div');
    d.style.cssText = 'width:100%;height:2px;background:linear-gradient(90deg,transparent,#ffd70066,transparent);';
    panel.appendChild(d);
  };

  // ── Music row ──
  sep();
  const musicRow = document.createElement('div');
  musicRow.style.cssText = 'display:flex;align-items:center;gap:14px;';
  const musicLbl = document.createElement('span');
  musicLbl.textContent = '🎵 Music';
  musicLbl.style.cssText = 'color:#fff;font-size:18px;font-weight:900;min-width:110px;';
  musicRow.appendChild(musicLbl);

  const makeToggle = (label, active, onclick) => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = label;
    b.style.cssText = [
      'margin:0',
      'padding:10px 0',
      'width:90px',
      'font-size:15px',
      active
        ? 'background:linear-gradient(180deg,#88ffaa 0%,#22bb55 55%,#117733 100%);box-shadow:0 5px 0 #005522,0 0 16px #55ff8888,inset 0 1px 0 #ffffff55;'
        : 'background:linear-gradient(180deg,#776688 0%,#443355 55%,#221133 100%);box-shadow:0 5px 0 #110022;opacity:0.65;',
    ].join(';');
    b.onclick = onclick;
    return b;
  };

  musicRow.appendChild(makeToggle('🔊 ON',  musicEnabled,  () => {
    if (!musicEnabled) {
      musicEnabled = true; saveCfg();
      if (AC.state === 'suspended') AC.resume().then(startMenuBGM); else startMenuBGM();
    }
    showSettings();
  }));
  musicRow.appendChild(makeToggle('🔇 OFF', !musicEnabled, () => {
    if (musicEnabled) { musicEnabled = false; saveCfg(); stopBGM(); }
    showSettings();
  }));
  panel.appendChild(musicRow);

  // ── Difficulty row ──
  sep();
  const diffLbl = document.createElement('span');
  diffLbl.textContent = '⚔  Difficulty';
  diffLbl.style.cssText = 'color:#fff;font-size:18px;font-weight:900;';
  panel.appendChild(diffLbl);

  const diffRow = document.createElement('div');
  diffRow.style.cssText = 'display:flex;gap:12px;';

  const DIFF_META = {
    easy:   { label: '😊 Easy',   info: '~35% of enemies' },
    normal: { label: '😎 Normal', info: '~72% of enemies' },
    hard:   { label: '💀 Hard',   info: '100% of enemies' },
  };
  Object.entries(DIFF_META).forEach(([d, m]) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    const b = makeToggle(m.label, difficulty === d, () => {
      difficulty = d; saveCfg(); showSettings();
    });
    b.style.width = '112px';
    b.style.fontSize = '14px';
    const info = document.createElement('span');
    info.textContent = m.info;
    info.style.cssText = 'color:#aaa;font-size:11px;font-family:monospace;';
    wrap.appendChild(b); wrap.appendChild(info);
    diffRow.appendChild(wrap);
  });
  panel.appendChild(diffRow);

  // ── Back ──
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-hs';
  backBtn.textContent = '← Back';
  backBtn.style.marginBottom = '28px';
  backBtn.onclick = () => showStartMenu();
  ol.appendChild(backBtn);
}

function jumpToLevel(lvl) {
  if (AC.state === 'suspended') AC.resume();
  menuMusicArmed = true;
  if (lives <= 0 || state === 'menu') { score = 0; lives = 3; maxLives = 3; }
  currentLevel = lvl;
  buildLevel(lvl);
  updateHUD();
  document.getElementById('overlay').style.display = 'none';
  stopBGM();
  levelStartTimer = 0;
  state = 'levelstart';
}

function startGame() {
  if (AC.state === 'suspended') AC.resume();
  menuMusicArmed = true;
  score = 0; lives = 3; maxLives = 3; currentLevel = 0;
  if (player) { player.superBoots = false; player.superCape = false; }
  buildLevel(0);
  updateHUD();
  document.getElementById('overlay').style.display = 'none';
  stopBGM();
  levelStartTimer = 0;
  state = 'levelstart';
}

function endGame(s) {
  state = s; stopBGM(); startMenuBGM(); showNameEntry(s);
}

// ── Game Loop ──────────────────────────────────────────────────────────────────
function loop() {
  requestAnimationFrame(loop);
  pollGamepad();

  // Gamepad: A or Start navigates overlays / starts game
  if (gp.justStart || gp.justA) {
    const ol = document.getElementById('overlay');
    if (ol && ol.style.display !== 'none') {
      const btn = ol.querySelector('.btn');
      if (btn) btn.click();
    }
  }

  if (state === 'playing') {
    update(); draw();
  } else if (state === 'levelcomplete') {
    frameCount++;
    for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
    particles = particles.filter(p => p.life > 0);
    if (levelCompleteTimer % 18 === 0) spawnConfetti();
    levelCompleteTimer++;
    draw();
    if (levelCompleteTimer >= 480) onLevelCompleteEnd();
  } else if (state === 'levelstart') {
    frameCount++;
    const prev = Math.floor((levelStartTimer - 1) / 90);
    levelStartTimer++;
    const cur = Math.floor(levelStartTimer / 90);
    if (cur !== prev && levelStartTimer < 270) sfxCountdown();
    if (levelStartTimer === 271) sfxGo();
    draw();
    if (levelStartTimer >= 315) {
      state = 'playing';
      // 1 second of silence before the level music kicks in
      setTimeout(() => startBGM(currentLevel), 1000);
    }
  } else if (state === 'menu') {
    frameCount++;
    draw();
  }
}
// ── Touch controls setup ──────────────────────────────────────────────────────
function setupTouchControls() {
  // Only activate on real touch devices
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (!isTouchDevice) return;

  const tc = document.getElementById('touch-controls');
  if (tc) tc.style.display = 'flex';

  // Prevent page scroll/zoom from touch on the whole game area
  canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });

  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const on  = () => { touch[key] = true;  el.classList.add('pressed'); };
    const off = () => { touch[key] = false; el.classList.remove('pressed'); };
    el.addEventListener('pointerdown',   e => { el.setPointerCapture(e.pointerId); on();  e.preventDefault(); }, { passive: false });
    el.addEventListener('pointerup',     () => off());
    el.addEventListener('pointercancel', () => off());
    el.addEventListener('pointerleave',  () => off());
  };

  bind('tc-left',  'left');
  bind('tc-right', 'right');
  bind('tc-jump',  'jump');
  bind('tc-fire',  'fire');

  // Overlay buttons: fire click on touchend (bypasses synthesised-click suppression issues)
  document.addEventListener('touchend', e => {
    const btn = e.target.closest('#overlay button');
    if (!btn) return;
    e.preventDefault(); // stop browser synthesising a second click
    if (AC.state === 'suspended') AC.resume();
    btn.click();
  }, { passive: false });

  canvas.addEventListener('pointerdown', () => {
    if (AC.state === 'suspended') AC.resume();
  });
}

setupTouchControls();
showStartMenu();
loop();
