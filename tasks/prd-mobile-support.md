# PRD: Mobile Device Support

## Introduction

Make the Space Invaders game playable on mobile devices by adding responsive canvas scaling, on-screen touch controls, and touch-friendly UI adjustments. The game logic, scoring, auth, and leaderboard remain unchanged — this is purely a presentation and input layer addition.

## Goals

- The game canvas scales to fit any screen width without horizontal scrolling
- On-screen touch controls allow mobile users to move and shoot
- All overlays (start screen, game over, auth forms, leaderboard) are usable on small screens
- The page doesn't scroll or bounce while playing
- Desktop keyboard controls continue to work unchanged

## User Stories

### US-001: Responsive canvas scaling
**Description:** As a mobile user, I want the game to fit my screen so that I can see the full play area without scrolling.

**Acceptance Criteria:**
- [ ] The canvas element scales down to fit the viewport width on screens narrower than 800px
- [ ] Use CSS scaling (`max-width: 100%; height: auto`) on the canvas — the internal resolution stays 800x600
- [ ] The `.canvas-wrapper` and `.game-container` are responsive and don't cause horizontal overflow
- [ ] The page title "SPACE INVADERS" h1 scales down on small screens (smaller font-size via media query)
- [ ] Verify on a 375px-wide viewport (iPhone SE size) — no horizontal scrolling, canvas fully visible
- [ ] Verify in browser using dev-browser skill

### US-002: On-screen touch controls
**Description:** As a mobile user, I want on-screen buttons to move and shoot so that I can play without a keyboard.

**Acceptance Criteria:**
- [ ] A touch control overlay appears below or over the bottom of the canvas on touch-capable devices
- [ ] Left arrow button on the bottom-left, right arrow button on the bottom-right, fire button in the bottom-center
- [ ] Pressing (touchstart) a direction button sets the corresponding key in the `keys` object (same as keyboard)
- [ ] Releasing (touchend) a direction button clears the key — movement stops
- [ ] Tapping the fire button sets `keys[' ']` briefly to fire a shot
- [ ] Holding a direction button provides continuous movement (same as holding a keyboard key)
- [ ] Touch controls are only visible on devices that support touch (use media query or JS touch detection)
- [ ] Touch controls do not interfere with keyboard controls on desktop
- [ ] Buttons are large enough to tap comfortably (minimum 48x48px tap targets)
- [ ] Verify in browser using dev-browser skill with mobile emulation

### US-003: Touch-friendly UI and scroll prevention
**Description:** As a mobile user, I want the UI to be usable on a small screen and the page to not scroll while I'm playing.

**Acceptance Criteria:**
- [ ] During gameplay, `touchmove` events on the canvas and touch controls call `preventDefault()` to stop page scrolling/bouncing
- [ ] The viewport meta tag already exists (`width=device-width, initial-scale=1.0`) — verify it's present
- [ ] Add `touch-action: manipulation` on the body to prevent double-tap zoom
- [ ] Overlay buttons (Start Game, Register, Log In, etc.) have minimum 44px height for comfortable tapping
- [ ] Auth form inputs are at least 44px tall for easy tapping
- [ ] The game over screen with leaderboard is scrollable within the overlay if content overflows on small screens
- [ ] Verify in browser using dev-browser skill with mobile emulation

## Functional Requirements

- FR-1: Canvas CSS: `max-width: 100%; height: auto` to scale proportionally
- FR-2: Touch controls are HTML elements positioned over or below the canvas, using `position: fixed` or `absolute` at the bottom of the viewport
- FR-3: Touch controls use `touchstart`/`touchend` events (not `click`) for responsive, lag-free input
- FR-4: Touch controls set/clear the same `keys` object that keyboard input uses — no changes to game logic
- FR-5: Touch controls are hidden on devices without touch support (use `@media (hover: none) and (pointer: coarse)` or JS check for `'ontouchstart' in window`)
- FR-6: `document.body.style.touchAction = 'manipulation'` or CSS `touch-action: manipulation` on body
- FR-7: `touchmove` preventDefault on the game area during active gameplay to stop scroll
- FR-8: All media queries use `max-width: 840px` as the breakpoint (canvas is 800px + borders/padding)

## Non-Goals

- No landscape-lock or orientation-lock (users can play in any orientation)
- No gamepad/controller support
- No gesture controls (swipe to move, etc.) — buttons only
- No redesign of the profile page for mobile (it already uses a centered single-column layout)

## Design Considerations

- Touch controls should be semi-transparent so they don't fully obscure the game
- Use simple arrow icons (◀ ▶) and a fire icon (●) or text labels
- Controls should have a dark semi-transparent background with light borders, matching the game aesthetic
- Position controls at the very bottom of the viewport so thumbs can reach them naturally
- Consider a layout like: [◀] on left, [FIRE] in center, [▶] on right

## Technical Considerations

- All touch control logic should live in a new section at the bottom of `game.js` or in a small `touch.js` file
- Use passive event listeners where possible, non-passive only where `preventDefault()` is needed
- Test with Chrome DevTools device emulation (toggle device toolbar, select a phone like iPhone SE or Pixel)
- The canvas `width`/`height` attributes stay 800/600 — only CSS scales it visually. Game coordinates remain the same.
- `profile.html` already uses a responsive single-column layout so it should work on mobile without changes

## Success Metrics

- A user on a phone can play a complete game from start to game over using touch controls
- No horizontal scrolling on any screen 320px or wider
- Touch controls feel responsive with no noticeable input lag
- Desktop experience is completely unchanged

## Open Questions

- Should touch controls be visible during the start screen for discoverability, or only appear once the game starts?
- Should we add haptic feedback (vibration) on fire?
