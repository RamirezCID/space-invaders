# PRD: Space Invaders — Browser Arcade Game (UC-RAL-03)

## Introduction

Build a browser-based Space Invaders game using vanilla HTML, CSS, and JavaScript. The player controls a ship at the bottom of the screen, shoots at rows of descending alien invaders, and tries to survive as long as possible. The game features progressive difficulty, lives, scoring, and a clean modern UI. This is the core gameplay module for a larger Retro Arcade Leaderboard application — auth, leaderboard, and profiles will be added in future PRDs.

## Goals

- Deliver a fully playable Space Invaders game that runs in any modern browser with no dependencies
- Implement classic Space Invaders mechanics: player movement, shooting, alien grid movement, alien shooting, collisions, lives, and scoring
- Progressively increase difficulty as the game advances (aliens speed up, shoot more frequently)
- Display a clear game-over screen with the final score
- Use a clean, modern visual style
- Keep the codebase simple and well-structured for future integration with auth and leaderboard systems

## User Stories

### US-001: Launch the game page
**Description:** As a user, I want to open the game in my browser so that I can start playing immediately.

**Acceptance Criteria:**
- [ ] A single `index.html` file loads the game page
- [ ] The page displays a title, a canvas/game area, and a "Start Game" button
- [ ] No downloads, plugins, or build steps are required
- [ ] The page is styled with a clean modern look (centered layout, readable fonts, good contrast)
- [ ] Verify in browser using dev-browser skill

### US-002: Start a new game
**Description:** As a user, I want to press a button or key to start a new game so that I can begin playing.

**Acceptance Criteria:**
- [ ] Clicking "Start Game" or pressing Enter begins the game
- [ ] The game canvas displays the player ship, alien grid, and score/lives HUD
- [ ] The score starts at 0 and lives start at 3
- [ ] The "Start Game" button is hidden or disabled while the game is running
- [ ] Verify in browser using dev-browser skill

### US-003: Move the player ship
**Description:** As a user, I want to move my ship left and right using the keyboard so that I can dodge enemy fire and aim my shots.

**Acceptance Criteria:**
- [ ] Left arrow key (or A) moves the ship left
- [ ] Right arrow key (or D) moves the ship right
- [ ] The ship cannot move beyond the left or right edge of the play area
- [ ] Movement is smooth and responsive (frame-rate independent)
- [ ] Verify in browser using dev-browser skill

### US-004: Shoot projectiles
**Description:** As a user, I want to fire projectiles upward so that I can destroy aliens.

**Acceptance Criteria:**
- [ ] Pressing Space fires a projectile from the ship's position
- [ ] The projectile travels upward at a consistent speed
- [ ] Only one player projectile can be on screen at a time (classic behavior)
- [ ] The projectile disappears when it hits an alien or leaves the top of the screen
- [ ] Verify in browser using dev-browser skill

### US-005: Alien grid formation and movement
**Description:** As a user, I want to see a grid of alien invaders that move across and down the screen so that there is a threat to respond to.

**Acceptance Criteria:**
- [ ] Aliens are arranged in a grid (e.g., 5 rows x 11 columns)
- [ ] The grid moves horizontally; when any alien reaches a screen edge, the entire grid drops down one row and reverses direction
- [ ] Different rows have visually distinct alien types (at least 2-3 types)
- [ ] Aliens are rendered clearly against the background
- [ ] Verify in browser using dev-browser skill

### US-006: Alien shooting
**Description:** As a user, I want aliens to shoot back at me so that the game presents a challenge.

**Acceptance Criteria:**
- [ ] Aliens fire projectiles downward at random intervals
- [ ] Only bottom-row aliens (those with no alien below them in their column) can fire
- [ ] Alien projectiles are visually distinct from player projectiles
- [ ] The rate of alien fire increases as fewer aliens remain
- [ ] Verify in browser using dev-browser skill

### US-007: Collision detection — player shots hit aliens
**Description:** As a user, I want my shots to destroy aliens so that I can earn points and clear the screen.

**Acceptance Criteria:**
- [ ] When a player projectile overlaps an alien, the alien is removed from the grid
- [ ] The player's score increases based on the alien type (top rows worth more)
- [ ] A brief visual effect (flash or small animation) plays on alien destruction
- [ ] The score display updates immediately
- [ ] Verify in browser using dev-browser skill

### US-008: Collision detection — alien shots hit the player
**Description:** As a user, I want to lose a life when an alien projectile hits my ship so that the game has stakes.

**Acceptance Criteria:**
- [ ] When an alien projectile overlaps the player ship, the player loses one life
- [ ] The lives display updates immediately
- [ ] A brief visual effect plays on the player ship when hit
- [ ] The player has a short invulnerability period after being hit (about 2 seconds)
- [ ] The game continues until all lives are lost
- [ ] Verify in browser using dev-browser skill

### US-009: Progressive difficulty
**Description:** As a user, I want the game to get harder as I play so that it stays challenging and exciting.

**Acceptance Criteria:**
- [ ] Alien movement speed increases as aliens are destroyed (fewer aliens = faster movement)
- [ ] Alien fire rate increases as the game progresses
- [ ] When all aliens are destroyed, a new wave spawns that starts slightly faster/harder than the previous wave
- [ ] Wave number is tracked and displayed
- [ ] Verify in browser using dev-browser skill

### US-010: Game over
**Description:** As a user, I want a clear game-over screen when I lose all my lives so that I know the game has ended and can see my score.

**Acceptance Criteria:**
- [ ] The game stops when lives reach 0 or when aliens reach the player's row
- [ ] A game-over overlay displays "Game Over" and the final score
- [ ] The overlay includes a "Play Again" button that resets and starts a new game
- [ ] The game loop stops completely (no lingering animations or processing)
- [ ] Verify in browser using dev-browser skill

### US-011: Score and HUD display
**Description:** As a user, I want to see my score, lives, and wave number during gameplay so that I can track my progress.

**Acceptance Criteria:**
- [ ] Score is displayed at the top-left of the game area
- [ ] Lives remaining are displayed at the top-right (as a number or ship icons)
- [ ] Current wave number is displayed
- [ ] HUD text is readable and does not overlap with gameplay elements
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: The game runs on a single HTML page using an HTML5 `<canvas>` element for rendering
- FR-2: All game logic is written in vanilla JavaScript — no libraries or frameworks
- FR-3: CSS is used for page layout and the start/game-over UI overlays; the canvas handles in-game rendering
- FR-4: The game loop uses `requestAnimationFrame` with delta-time for frame-rate independent updates
- FR-5: Player input is handled via `keydown`/`keyup` event listeners for smooth movement
- FR-6: Aliens are stored in a 2D array; destroyed aliens are marked as inactive
- FR-7: Collision detection uses axis-aligned bounding box (AABB) checks
- FR-8: Scoring: top-row aliens = 30 pts, middle rows = 20 pts, bottom rows = 10 pts
- FR-9: Player starts with 3 lives; no extra lives are awarded
- FR-10: When all aliens are cleared, a new wave spawns with a higher base speed multiplier
- FR-11: The game ends when lives reach 0 OR when any alien reaches the player's vertical position
- FR-12: The final score is exposed via a JavaScript function or event so that future leaderboard integration can read it without modifying game code

## Non-Goals

- No user registration or authentication (future PRD)
- No leaderboard or score persistence (future PRD)
- No player profile (future PRD)
- No sound effects or music
- No mobile/touch controls (keyboard only for now)
- No pause functionality
- No mystery/bonus UFO ship
- No destructible shields/barriers

## Design Considerations

- Use a dark background (e.g., near-black or dark navy) for the game canvas
- Player ship, aliens, and projectiles should use simple geometric shapes or basic sprite-style drawing (no image assets required)
- Use a clean sans-serif font for the HUD and overlays
- The game area should be centered on the page with reasonable max-width (~800px)
- Start screen and game-over screen are HTML/CSS overlays positioned over the canvas

## Technical Considerations

- File structure: `index.html`, `style.css`, `game.js` — these must be separate files (no inline `<style>` or `<script>` blocks in the HTML). `index.html` links to `style.css` and `game.js` via `<link>` and `<script>` tags
- Serve locally using Python's built-in HTTP server (`python -m http.server`) to avoid CORS/module issues with file:// protocol
- The canvas should be a fixed size (e.g., 800x600) for predictable gameplay
- All game entities (player, aliens, projectiles) should be objects/classes with `update()` and `draw()` methods for clean separation
- FR-12 is important: expose a hook (callback or custom event) that fires with the final score on game over, so leaderboard integration is straightforward later
- **Testing:** Use the Chrome DevTools MCP server (chrome-devtools skill) to visually verify UI stories in the browser. Navigate to the local server URL, take screenshots, inspect elements, and evaluate scripts to confirm acceptance criteria. Do not rely solely on code review — verify rendered output in Chrome

## Success Metrics

- A user can play a full game of Space Invaders from start to game-over in the browser
- The game feels responsive — no noticeable input lag or frame drops
- Difficulty progression is noticeable: later waves feel harder than earlier ones
- The game-over screen clearly shows the final score and allows restarting

## Open Questions

- Should we add destructible barriers/shields in a later iteration?
- Should we add a mystery UFO bonus ship later?
- What exact canvas size works best for the clean modern aesthetic?
