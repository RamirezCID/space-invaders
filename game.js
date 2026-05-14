// ============================================================
// Space Invaders — game.js
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// startScreen is declared in auth.js
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');

// --- Constants ---
const CANVAS_W = canvas.width;   // 800
const CANVAS_H = canvas.height;  // 600

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 320; // px per second
const PLAYER_Y = CANVAS_H - 50;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 14;
const BULLET_SPEED = 480; // px per second

const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const ALIEN_WIDTH = 36;
const ALIEN_HEIGHT = 26;
const ALIEN_PAD_X = 14;
const ALIEN_PAD_Y = 12;
const ALIEN_TOP_OFFSET = 60;
const ALIEN_BASE_SPEED = 40; // px per second
const ALIEN_DROP = 20;

const ALIEN_BULLET_WIDTH = 4;
const ALIEN_BULLET_HEIGHT = 12;
const ALIEN_BULLET_SPEED = 220; // px per second
const ALIEN_FIRE_BASE_INTERVAL = 1.2; // seconds (min time between shots)

const INVULN_DURATION = 2; // seconds

const SCORE_BY_ROW = [30, 30, 20, 20, 10]; // top to bottom

const ALIEN_COLORS = ['#ff4466', '#ff4466', '#ffaa22', '#ffaa22', '#44dd66'];

// --- Game State ---
let state = null; // will be initialised in startGame()

// --- Input ---
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'Enter' && !startScreen.classList.contains('hidden')) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// --- Entity Helpers ---

function createPlayer() {
    return {
        x: CANVAS_W / 2 - PLAYER_WIDTH / 2,
        y: PLAYER_Y,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT,
        invulnTimer: 0,
    };
}

function createAlienGrid(wave) {
    const aliens = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
        for (let c = 0; c < ALIEN_COLS; c++) {
            aliens.push({
                row: r,
                col: c,
                x: c * (ALIEN_WIDTH + ALIEN_PAD_X) + 40,
                y: r * (ALIEN_HEIGHT + ALIEN_PAD_Y) + ALIEN_TOP_OFFSET,
                w: ALIEN_WIDTH,
                h: ALIEN_HEIGHT,
                alive: true,
                flashTimer: 0,
            });
        }
    }
    return aliens;
}

// --- Collision (AABB) ---
function aabb(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// --- Game lifecycle ---

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    clearPendingScore();

    state = {
        running: true,
        score: 0,
        lives: 3,
        wave: 1,
        player: createPlayer(),
        aliens: createAlienGrid(1),
        alienDir: 1, // 1 = right, -1 = left
        alienBullets: [],
        playerBullet: null,
        alienFireCooldown: ALIEN_FIRE_BASE_INTERVAL,
        effects: [],
        lastTime: performance.now(),
    };

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.running = false;
    finalScoreEl.textContent = state.score;
    gameOverScreen.classList.remove('hidden');

    // Show/hide auth buttons and guest prompt based on auth state
    const goLogout = document.getElementById('gameOverLogoutBtn');
    const goSignIn = document.getElementById('gameOverSignInBtn');
    const goProfile = document.getElementById('gameOverProfileLink');
    const guestPrompt = document.getElementById('guestScorePrompt');
    if (goLogout) goLogout.classList.toggle('hidden', !currentUser);
    if (goProfile) goProfile.classList.toggle('hidden', !currentUser);
    if (goSignIn) goSignIn.classList.toggle('hidden', !!currentUser);
    if (guestPrompt) guestPrompt.classList.toggle('hidden', !!currentUser);

    // Record score or set pending for guests, then load leaderboard
    const goLbContainer = document.getElementById('goLbContainer');
    const loadLb = () => {
        if (goLbContainer) {
            loadLeaderboard(goLbContainer, 'alltime');
            const tabs = document.querySelectorAll('#gameOverScreen .lb-tab');
            tabs.forEach(t => t.classList.remove('active'));
            if (tabs[0]) tabs[0].classList.add('active');
        }
    };

    if (currentUser) {
        recordScore(state.score, state.wave).then(loadLb);
    } else {
        setPendingScore(state.score, state.wave);
        loadLb();
    }

    // Expose score event
    const event = new CustomEvent('gameOver', { detail: { score: state.score, wave: state.wave } });
    document.dispatchEvent(event);
}

function spawnNextWave() {
    state.wave++;
    state.aliens = createAlienGrid(state.wave);
    state.alienDir = 1;
    state.alienBullets = [];
    state.alienFireCooldown = ALIEN_FIRE_BASE_INTERVAL;
}

// --- Update ---

function update(dt) {
    if (!state.running) return;

    updatePlayer(dt);
    updatePlayerBullet(dt);
    updateAliens(dt);
    updateAlienBullets(dt);
    updateEffects(dt);
    checkAlienReachPlayer();
}

function updatePlayer(dt) {
    const p = state.player;

    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        p.x -= PLAYER_SPEED * dt;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        p.x += PLAYER_SPEED * dt;
    }
    p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));

    // Invulnerability timer
    if (p.invulnTimer > 0) {
        p.invulnTimer -= dt;
    }

    // Shooting
    if (keys[' '] && !state.playerBullet) {
        state.playerBullet = {
            x: p.x + p.w / 2 - BULLET_WIDTH / 2,
            y: p.y - BULLET_HEIGHT,
            w: BULLET_WIDTH,
            h: BULLET_HEIGHT,
        };
    }
}

function updatePlayerBullet(dt) {
    const b = state.playerBullet;
    if (!b) return;

    b.y -= BULLET_SPEED * dt;

    // Off screen
    if (b.y + b.h < 0) {
        state.playerBullet = null;
        return;
    }

    // Check collision with aliens
    for (const alien of state.aliens) {
        if (!alien.alive) continue;
        if (aabb(b, alien)) {
            alien.alive = false;
            alien.flashTimer = 0.15;
            state.playerBullet = null;
            state.score += SCORE_BY_ROW[alien.row] || 10;
            state.effects.push({ x: alien.x, y: alien.y, w: alien.w, h: alien.h, timer: 0.15 });
            break;
        }
    }

    // Check wave clear
    if (state.aliens.every(a => !a.alive)) {
        spawnNextWave();
    }
}

function updateAliens(dt) {
    const alive = state.aliens.filter(a => a.alive);
    if (alive.length === 0) return;

    // Speed scales with how many aliens are destroyed
    const totalAliens = ALIEN_ROWS * ALIEN_COLS;
    const speedMultiplier = 1 + (totalAliens - alive.length) / totalAliens * 3 + (state.wave - 1) * 0.3;
    const speed = ALIEN_BASE_SPEED * speedMultiplier;

    // Move horizontally
    let needDrop = false;
    for (const a of alive) {
        a.x += speed * state.alienDir * dt;
        if (a.x + a.w > CANVAS_W - 10 || a.x < 10) {
            needDrop = true;
        }
    }

    if (needDrop) {
        state.alienDir *= -1;
        for (const a of alive) {
            a.y += ALIEN_DROP;
        }
    }

    // Alien shooting
    state.alienFireCooldown -= dt;
    if (state.alienFireCooldown <= 0) {
        fireAlienBullet(alive);
        // Faster fire when fewer aliens remain
        const fireInterval = ALIEN_FIRE_BASE_INTERVAL * (alive.length / totalAliens) + 0.2;
        state.alienFireCooldown = fireInterval * (0.5 + Math.random() * 0.5);
    }
}

function fireAlienBullet(aliveAliens) {
    // Find bottom-most alien per column
    const bottomAliens = new Map();
    for (const a of aliveAliens) {
        const existing = bottomAliens.get(a.col);
        if (!existing || a.row > existing.row) {
            bottomAliens.set(a.col, a);
        }
    }

    const candidates = Array.from(bottomAliens.values());
    if (candidates.length === 0) return;

    const shooter = candidates[Math.floor(Math.random() * candidates.length)];
    state.alienBullets.push({
        x: shooter.x + shooter.w / 2 - ALIEN_BULLET_WIDTH / 2,
        y: shooter.y + shooter.h,
        w: ALIEN_BULLET_WIDTH,
        h: ALIEN_BULLET_HEIGHT,
    });
}

function updateAlienBullets(dt) {
    const p = state.player;

    for (let i = state.alienBullets.length - 1; i >= 0; i--) {
        const b = state.alienBullets[i];
        b.y += ALIEN_BULLET_SPEED * dt;

        // Off screen
        if (b.y > CANVAS_H) {
            state.alienBullets.splice(i, 1);
            continue;
        }

        // Hit player
        if (p.invulnTimer <= 0 && aabb(b, p)) {
            state.alienBullets.splice(i, 1);
            state.lives--;
            p.invulnTimer = INVULN_DURATION;
            state.effects.push({ x: p.x, y: p.y, w: p.w, h: p.h, timer: 0.3 });
            if (state.lives <= 0) {
                gameOver();
                return;
            }
        }
    }
}

function checkAlienReachPlayer() {
    for (const a of state.aliens) {
        if (a.alive && a.y + a.h >= state.player.y) {
            gameOver();
            return;
        }
    }
}

function updateEffects(dt) {
    for (let i = state.effects.length - 1; i >= 0; i--) {
        state.effects[i].timer -= dt;
        if (state.effects[i].timer <= 0) {
            state.effects.splice(i, 1);
        }
    }
}

// --- Draw ---

function draw() {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (!state) return;

    drawHUD();
    drawPlayer();
    drawPlayerBullet();
    drawAliens();
    drawAlienBullets();
    drawEffects();
}

function drawHUD() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 16, 30);

    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${state.wave}`, CANVAS_W / 2, 30);

    ctx.textAlign = 'right';
    ctx.fillText(`Lives: ${state.lives}`, CANVAS_W - 16, 30);
}

function drawPlayer() {
    const p = state.player;

    // Blink when invulnerable
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 8) % 2 === 0) return;

    ctx.fillStyle = '#4a9eff';
    // Ship body
    ctx.fillRect(p.x, p.y + 6, p.w, p.h - 6);
    // Ship nose
    ctx.fillRect(p.x + p.w / 2 - 4, p.y, 8, 8);
}

function drawPlayerBullet() {
    if (!state.playerBullet) return;
    const b = state.playerBullet;
    ctx.fillStyle = '#4aff88';
    ctx.fillRect(b.x, b.y, b.w, b.h);
}

function drawAliens() {
    for (const a of state.aliens) {
        if (!a.alive) continue;

        ctx.fillStyle = ALIEN_COLORS[a.row] || '#ffffff';

        // Different shapes per row type
        if (a.row <= 1) {
            // Top rows: diamond-ish shape
            ctx.beginPath();
            ctx.moveTo(a.x + a.w / 2, a.y);
            ctx.lineTo(a.x + a.w, a.y + a.h / 2);
            ctx.lineTo(a.x + a.w / 2, a.y + a.h);
            ctx.lineTo(a.x, a.y + a.h / 2);
            ctx.closePath();
            ctx.fill();
        } else if (a.row <= 3) {
            // Middle rows: rounded rectangle
            const r = 5;
            ctx.beginPath();
            ctx.moveTo(a.x + r, a.y);
            ctx.lineTo(a.x + a.w - r, a.y);
            ctx.quadraticCurveTo(a.x + a.w, a.y, a.x + a.w, a.y + r);
            ctx.lineTo(a.x + a.w, a.y + a.h - r);
            ctx.quadraticCurveTo(a.x + a.w, a.y + a.h, a.x + a.w - r, a.y + a.h);
            ctx.lineTo(a.x + r, a.y + a.h);
            ctx.quadraticCurveTo(a.x, a.y + a.h, a.x, a.y + a.h - r);
            ctx.lineTo(a.x, a.y + r);
            ctx.quadraticCurveTo(a.x, a.y, a.x + r, a.y);
            ctx.closePath();
            ctx.fill();
        } else {
            // Bottom row: simple rectangle
            ctx.fillRect(a.x, a.y, a.w, a.h);
        }
    }
}

function drawAlienBullets() {
    ctx.fillStyle = '#ff6666';
    for (const b of state.alienBullets) {
        ctx.fillRect(b.x, b.y, b.w, b.h);
    }
}

function drawEffects() {
    for (const e of state.effects) {
        ctx.fillStyle = `rgba(255, 255, 255, ${e.timer * 4})`;
        ctx.fillRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
    }
}

// --- Game Loop ---

function gameLoop(timestamp) {
    if (!state || !state.running) return;

    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05); // cap dt to avoid spiral
    state.lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// --- Touch Controls ---

(function initTouchControls() {
    const touchLeft = document.getElementById('touchLeft');
    const touchRight = document.getElementById('touchRight');
    const touchFire = document.getElementById('touchFire');

    if (!touchLeft || !touchRight || !touchFire) return;

    // Prevent scrolling on touch controls and canvas
    document.getElementById('touchControls').addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        if (state && state.running) e.preventDefault();
    }, { passive: false });

    // Direction buttons
    function bindDirection(el, key) {
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            keys[key] = true;
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[key] = false;
        }, { passive: false });

        el.addEventListener('touchcancel', () => {
            keys[key] = false;
        });
    }

    bindDirection(touchLeft, 'ArrowLeft');
    bindDirection(touchRight, 'ArrowRight');

    // Fire button
    touchFire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[' '] = true;
        setTimeout(() => { keys[' '] = false; }, 100);
    }, { passive: false });

    touchFire.addEventListener('touchend', (e) => {
        e.preventDefault();
    }, { passive: false });
})();
