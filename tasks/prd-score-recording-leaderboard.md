# PRD: Score Recording & Leaderboard (UC-RAL-04 + UC-RAL-05)

## Introduction

Automatically record scores for authenticated players when a game ends, and provide a global leaderboard accessible from the start screen and the game over screen. The leaderboard supports all-time (default) and daily views, shows the top 10 scores, and highlights the current player's rank even if they fall outside the top 10. Guests are prompted to sign in to save their score but can skip and play again.

## Goals

- Automatically record the player's score to Supabase on game over (no manual action)
- Prompt guests to sign in to save their score, with the option to skip
- Display a global leaderboard showing top 10 scores with username, score, and date
- Support toggling between all-time (default) and daily leaderboard views
- Show the leaderboard on both the start screen (via a button) and the game over screen
- Highlight the current player's personal best and show their rank if outside the top 10

## User Stories

### US-001: Record score automatically on game over
**Description:** As an authenticated player, I want my score recorded automatically when the game ends so that I can compete on the leaderboard without extra steps.

**Acceptance Criteria:**
- [ ] When the game ends and the player is authenticated, insert a row into the `scores` table with `player_id`, `score`, `wave`, and `played_at`
- [ ] The insert uses the authenticated user's ID from the current Supabase session
- [ ] No UI prompt or button is needed — the score is saved silently
- [ ] If the insert fails (e.g., network error), show a brief error message on the game over screen but don't block the user
- [ ] Verify by checking the Supabase `scores` table after a game ends
- [ ] Verify in browser using dev-browser skill

### US-002: Prompt guests to sign in on game over
**Description:** As a guest, I want to be told I can sign in to save my score so that I'm aware of the benefit, but I can skip and play again.

**Acceptance Criteria:**
- [ ] When the game ends and the user is NOT authenticated, the game over screen shows a message: "Sign in to save your score to the leaderboard"
- [ ] The existing "Sign In" button remains visible below this message
- [ ] The "Play Again" button is always visible — guests can skip signing in and just play again
- [ ] If the guest signs in or registers from the game over screen, the score from the just-finished game IS saved automatically after successful authentication
- [ ] The pending score (score + wave) is stored in a JS variable until auth completes, then inserted into the `scores` table
- [ ] Verify in browser using dev-browser skill

### US-003: Leaderboard overlay UI on start screen
**Description:** As a user, I want to open a leaderboard from the start screen so that I can see top scores before playing.

**Acceptance Criteria:**
- [ ] A "Leaderboard" button is visible on the start screen alongside Start Game, Register, and Log In
- [ ] Clicking it shows a leaderboard overlay within the start screen area (replaces main content, like the auth forms do)
- [ ] The leaderboard has a "Back" link to return to the main start screen
- [ ] The leaderboard displays a table/list with columns: Rank, Username, Score, Date
- [ ] The leaderboard shows the top 10 scores by default (all-time view)
- [ ] Styling matches existing dark background, sans-serif font, clean modern look
- [ ] Verify in browser using dev-browser skill

### US-004: Leaderboard on game over screen
**Description:** As a player, I want to see the leaderboard on the game over screen so that I can immediately see how I rank.

**Acceptance Criteria:**
- [ ] The game over screen shows a compact leaderboard below the final score and Play Again button
- [ ] The leaderboard shows the top 10 scores (all-time by default)
- [ ] Each entry shows rank, username, score, and date
- [ ] The leaderboard loads automatically when the game over screen appears
- [ ] If there are no scores yet, show "No scores recorded yet"
- [ ] Verify in browser using dev-browser skill

### US-005: All-time and daily leaderboard toggle
**Description:** As a user, I want to switch between all-time and daily leaderboard views so that I can see who is performing best today.

**Acceptance Criteria:**
- [ ] A toggle or tab control is visible above the leaderboard with two options: "All Time" and "Today"
- [ ] "All Time" is selected by default and shows top 10 scores across all dates
- [ ] "Today" shows top 10 scores from the current calendar day only (based on `played_at`)
- [ ] Switching tabs re-fetches and updates the leaderboard immediately
- [ ] Both views rank scores from highest to lowest
- [ ] The toggle works on both the start screen leaderboard and the game over leaderboard
- [ ] Verify in browser using dev-browser skill

### US-006: Highlight current player and show rank
**Description:** As an authenticated player, I want my personal best highlighted on the leaderboard and my rank shown even if I'm not in the top 10.

**Acceptance Criteria:**
- [ ] If the current player has a score in the top 10, their row is visually highlighted (e.g., different background color or border)
- [ ] If the current player is NOT in the top 10, an additional row is shown at the bottom of the leaderboard with their rank, username, score, and date, separated by a visual divider (e.g., "...")
- [ ] The player's rank is calculated as their position among all scores (all-time or daily, matching the current view)
- [ ] If the player has no scores, no extra row is shown
- [ ] Works on both start screen and game over leaderboard views
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: On game over, if `currentUser` is not null, insert into `scores` table: `{ player_id: currentUser.id, score: finalScore, wave: finalWave }`
- FR-2: On game over, if `currentUser` is null, store the score and wave in a `pendingScore` variable and display "Sign in to save your score to the leaderboard" on the game over screen
- FR-3: The "Play Again" button is always visible on game over regardless of auth state. Clicking Play Again clears any pending score
- FR-3b: After successful login or registration (from game over or any auth flow), check if `pendingScore` exists. If so, insert it into the `scores` table using the now-authenticated user's ID, then clear `pendingScore`
- FR-4: Add a "Leaderboard" button to the start screen that opens a leaderboard overlay
- FR-5: The game over screen includes an inline leaderboard that loads automatically
- FR-6: Leaderboard query for all-time: `SELECT scores.score, scores.wave, scores.played_at, profiles.username FROM scores JOIN profiles ON scores.player_id = profiles.id ORDER BY scores.score DESC LIMIT 10`
- FR-7: Leaderboard query for daily: same as FR-6 but with `WHERE scores.played_at >= start of today (UTC)`
- FR-8: A toggle control switches between "All Time" and "Today" views on both leaderboard locations
- FR-9: If the authenticated player's best score is not in the top 10, fetch their best score and rank separately and display it below the leaderboard with a divider
- FR-10: Player rank query: count of distinct scores higher than the player's best score, plus 1

## Non-Goals

- No retroactive score saving for games played before the current session (only the most recent game's pending score is saved on sign-in)
- No player profile page (future PRD — UC-RAL-06)
- No pagination or "load more" on the leaderboard
- No real-time updates (leaderboard refreshes on load, not via websocket)
- No score editing or deletion by players

## Design Considerations

- Leaderboard on start screen: full overlay replacing start screen content (same pattern as auth forms), with a Back link
- Leaderboard on game over: compact inline table below Play Again, no overlay needed
- Table styling: alternating row backgrounds or subtle borders for readability, monospace or tabular numbers for scores
- Highlighted player row: subtle blue background or left border matching the player ship color (#4a9eff)
- Divider between top 10 and player rank: a row with "..." or a horizontal rule
- Toggle tabs: two buttons/links styled like tabs, active tab highlighted with underline or background

## Technical Considerations

- All leaderboard logic should live in a new file `leaderboard.js`, loaded after `auth.js` and before `game.js`
- Leaderboard queries use the Supabase JS client (`supabaseClient.from('scores')...`)
- The `scores` table and RLS policies already exist from migrations
- For the daily view, filter by `played_at >= new Date().toISOString().split('T')[0]` (start of today in UTC)
- The game over score recording should hook into the existing `gameOver()` function in `game.js` — call a function from `leaderboard.js` like `recordScore(score, wave)`
- Use the Chrome DevTools MCP server to verify leaderboard rendering in the browser

## Success Metrics

- An authenticated player's score appears in the leaderboard within seconds of game over
- The leaderboard loads and displays in under 1 second
- A guest sees the "sign in to save" prompt but can always play again without friction
- The daily leaderboard correctly resets to show only today's scores

## Open Questions

- Should we show the player's rank change (e.g., "You moved up 3 spots")?
- Should the game over screen auto-scroll to the player's position if they're in the top 10?
