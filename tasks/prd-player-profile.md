# PRD: Player Profile (UC-RAL-06)

## Introduction

Add a player profile page where authenticated players can view their personal game history and statistics. The profile is accessed by clicking the player's username on the start screen, which navigates to a separate `profile.html` page. The profile displays the player's all-time high score, daily high score, average score, highest wave reached, total games played, and a history of their last 20 scores in reverse chronological order.

## Goals

- Provide a dedicated profile page at `profile.html` for authenticated players
- Display key stats: all-time high score, daily high score, average score, highest wave reached, total games played
- Show the player's last 20 scores in reverse chronological order with score, wave, and date
- Make the profile accessible by clicking the player's username on the start screen
- Allow navigation back to the game from the profile page

## User Stories

### US-001: Create profile.html page shell
**Description:** As a player, I want a dedicated profile page so that I can view my personal stats and history.

**Acceptance Criteria:**
- [ ] Create `profile.html` that loads `style.css`, Supabase CDN, `config.js`, and a new `profile.js`
- [ ] Page has the same dark background and clean modern styling as the game page
- [ ] Page displays a centered title with the player's username
- [ ] A "Back to Game" link navigates back to `index.html`
- [ ] If the user is not authenticated, redirect to `index.html`
- [ ] Verify in browser using dev-browser skill

### US-002: Display player stats
**Description:** As a player, I want to see my key statistics so that I can track my overall performance.

**Acceptance Criteria:**
- [ ] Profile page shows a stats section with: All-Time High Score, Today's High Score, Average Score, Highest Wave, Total Games Played
- [ ] Stats are fetched from the `scores` table filtered by the current player's ID
- [ ] All-time high uses `score.max()` aggregate on all player scores
- [ ] Today's high uses `score.max()` aggregate filtered to today's date (UTC)
- [ ] Average score is computed from all player scores (use `score.avg()` aggregate, rounded to nearest integer)
- [ ] Highest wave uses `wave.max()` aggregate
- [ ] Total games uses `score.count()` aggregate
- [ ] If the player has no scores, stats show 0 or "—" for each field
- [ ] Stats are displayed in a clean grid or card layout
- [ ] Verify in browser using dev-browser skill

### US-003: Display recent score history
**Description:** As a player, I want to see my recent scores so that I can track my improvement over time.

**Acceptance Criteria:**
- [ ] Profile page shows a "Recent Games" section below the stats
- [ ] Displays the player's last 20 scores in reverse chronological order (newest first)
- [ ] Each entry shows: score, wave reached, and date/time played (formatted like "May 14, 2:30 PM")
- [ ] Scores are fetched from the `scores` table filtered by player ID, ordered by `played_at` descending, limit 20
- [ ] If the player has no scores, show "No games played yet"
- [ ] Table/list styling matches the leaderboard table style (same font, colors, alignment)
- [ ] Verify in browser using dev-browser skill

### US-004: Link username to profile page
**Description:** As a player, I want to click my username on the start screen to view my profile.

**Acceptance Criteria:**
- [ ] The "Welcome, [username]" text on the start screen is a clickable link
- [ ] Clicking it navigates to `profile.html`
- [ ] The link is styled subtly (underline on hover, same blue color) so it looks clickable but not intrusive
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Create `profile.html` and `profile.js` as separate files — same pattern as the game page (separate HTML, CSS, JS)
- FR-2: `profile.js` initializes Supabase client, checks auth session, and redirects to `index.html` if not authenticated
- FR-3: Stats query uses PostgREST aggregates: `score.max()`, `score.avg()`, `score.count()`, `wave.max()` on the `scores` table filtered by `player_id`
- FR-4: Daily high score query adds filter `played_at >= start of today (UTC)`
- FR-5: Recent games query: `SELECT score, wave, played_at FROM scores WHERE player_id = ? ORDER BY played_at DESC LIMIT 20`
- FR-6: Username is fetched from the `profiles` table using the authenticated user's ID
- FR-7: The "Welcome, [username]" text on the start screen in `index.html` becomes an `<a>` link to `profile.html`
- FR-8: `profile.html` includes a "Back to Game" link to `index.html`
- FR-9: `profile.html` reuses `style.css` for consistent styling — add profile-specific styles to the same file

## Non-Goals

- No ability to edit profile (change username, email, password)
- No public profiles — only the authenticated player can view their own profile
- No avatar or profile picture
- No achievements or badges
- No ability to delete scores or account

## Design Considerations

- Profile page should feel like a natural extension of the game UI — same dark background, sans-serif fonts, centered layout
- Stats displayed in a grid of cards (2-3 per row) with the stat label above and value below, using the same blue accent color (#4a9eff) for values
- Recent games table reuses `.lb-table` styles from the leaderboard
- "Back to Game" link positioned at the top or bottom of the page, styled as a subtle link

## Technical Considerations

- `profile.html` is a separate page (not an overlay) since it was requested as a separate route
- `profile.js` handles all profile logic — Supabase client init, auth check, data fetching, rendering
- Reuse `style.css` from the game page — add profile-specific classes there
- PostgREST aggregates are already enabled on the Supabase project
- The `scores` and `profiles` tables and their RLS policies already exist

## Success Metrics

- An authenticated player can view their profile within 1 click from the start screen
- All 5 stats load and display correctly
- Recent games show the last 20 scores in correct order
- Unauthenticated visitors are redirected to the game

## Open Questions

- Should the profile show the player's current leaderboard rank?
- Should we add a "Share profile" feature later?
