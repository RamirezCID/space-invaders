# PRD: Registration & Login (UC-RAL-01 + UC-RAL-02)

## Introduction

Add user registration and login to the Space Invaders game so that players can create accounts and authenticate. Authenticated players will later have their scores recorded to the leaderboard. Registration and login controls live on the existing game start screen. The backend is Supabase Auth with email/password, and player profiles are stored in the `profiles` table (already created via migration). Email confirmation is disabled for instant registration.

## Goals

- Allow guests to register with a username, email, and password from the start screen
- Allow returning players to log in with email and password from the start screen
- Validate that username and email are unique before submitting registration
- On successful registration or login, return to the game screen in an authenticated state
- Show the logged-in player's username on the start screen so they know they're authenticated
- Provide a way to log out

## User Stories

### US-001: Add Supabase client library
**Description:** As a developer, I need the Supabase JS client available in the app so that I can call auth and database APIs.

**Acceptance Criteria:**
- [ ] Load the Supabase JS client via CDN `<script>` tag in `index.html` (no build step)
- [ ] Create a `supabase` client instance using `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `config.js`
- [ ] Verify `supabase.auth.getSession()` returns successfully (no errors in console)
- [ ] Verify in browser using dev-browser skill

### US-002: Registration form UI
**Description:** As a guest, I want to see a registration form on the start screen so that I can create an account.

**Acceptance Criteria:**
- [ ] A "Register" link/button is visible on the start screen overlay
- [ ] Clicking it reveals a registration form with fields: username, email, password
- [ ] The form has a "Create Account" submit button
- [ ] A "Back" or "Cancel" link returns to the main start screen
- [ ] A link to switch to the login form is visible (e.g., "Already have an account? Log in")
- [ ] Form styling matches the existing clean modern look (dark background, same fonts, blue button)
- [ ] Verify in browser using dev-browser skill

### US-003: Registration logic with validation
**Description:** As a guest, I want to register with a unique username and email so that I can have my own player account.

**Acceptance Criteria:**
- [ ] Before submitting, the app checks if the username already exists in the `profiles` table and shows "Username is already taken" if so
- [ ] On submit, calls `supabase.auth.signUp()` with email, password, and `options.data.username`
- [ ] If the email is already registered, Supabase returns an error and the form displays "Email is already registered"
- [ ] If password is too short (Supabase enforces minimum 6 chars), the form displays the error
- [ ] On success, the user is automatically logged in and the start screen shows their username
- [ ] The registration form is hidden and the start screen returns to the game-ready state
- [ ] Verify in browser using dev-browser skill

### US-004: Login form UI
**Description:** As a returning player, I want to see a login form so that I can access my account.

**Acceptance Criteria:**
- [ ] A "Log In" link/button is visible on the start screen overlay
- [ ] Clicking it reveals a login form with fields: email, password
- [ ] The form has a "Log In" submit button
- [ ] A "Back" or "Cancel" link returns to the main start screen
- [ ] A link to switch to the registration form is visible (e.g., "Don't have an account? Register")
- [ ] Form styling matches the existing clean modern look
- [ ] Verify in browser using dev-browser skill

### US-005: Login logic
**Description:** As a returning player, I want to log in with my email and password so that my scores are recorded to my account.

**Acceptance Criteria:**
- [ ] On submit, calls `supabase.auth.signInWithPassword()` with email and password
- [ ] If credentials are invalid, the form displays "Invalid email or password"
- [ ] On success, the login form is hidden and the start screen shows the player's username
- [ ] The start screen returns to the game-ready state
- [ ] Verify in browser using dev-browser skill

### US-006: Auth state persistence and logout
**Description:** As a player, I want to stay logged in when I refresh the page, and be able to log out.

**Acceptance Criteria:**
- [ ] On page load, check `supabase.auth.getSession()` — if a session exists, show the username on the start screen
- [ ] A "Log Out" button is visible on the start screen when the user is authenticated
- [ ] Clicking "Log Out" calls `supabase.auth.signOut()`, clears the displayed username, and shows the Register/Log In buttons again
- [ ] After logout, the Register and Log In buttons reappear
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Load the Supabase JS client from CDN (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`) and initialize with credentials from `config.js`
- FR-2: The start screen overlay has three states: (a) unauthenticated — shows Start Game, Register, and Log In buttons; (b) registration form; (c) login form; (d) authenticated — shows Start Game, welcome message with username, and Log Out button
- FR-3: Registration requires username, email, and password. Username uniqueness is checked against the `profiles` table before calling `signUp`
- FR-4: Registration calls `supabase.auth.signUp()` with `options.data.username` so the `handle_new_user` trigger creates the profile row automatically
- FR-5: Login calls `supabase.auth.signInWithPassword()` with email and password
- FR-6: All auth errors are displayed inline on the form — no browser alerts
- FR-7: On page load, `supabase.auth.getSession()` determines whether to show authenticated or unauthenticated start screen state
- FR-8: Log out calls `supabase.auth.signOut()` and resets the start screen to unauthenticated state
- FR-9: The game itself (Start Game button, canvas, gameplay) continues to work identically whether the user is authenticated or not — guests can still play, they just won't have scores recorded (that's a future PRD)

## Non-Goals

- No score recording on game over (future PRD — leaderboard integration)
- No player profile page (future PRD — UC-RAL-06)
- No password reset / forgot password flow
- No social login (Google, GitHub, etc.)
- No email confirmation step

## Design Considerations

- Registration and login forms should be rendered as HTML inside the existing start screen overlay, not separate pages
- Forms appear in place of the start screen content; "Back" returns to the main start screen
- Error messages appear directly below the relevant form field or at the top of the form in red/error color
- When authenticated, the start screen shows "Welcome, [username]" above the Start Game button
- Keep the same dark background, sans-serif font, and blue button style from the existing UI

## Technical Considerations

- Supabase JS client loaded via CDN `<script>` tag — no npm or build step
- The `supabase` client instance should be created in a new file `auth.js` that is loaded after `config.js` and before `game.js`
- All auth UI and logic lives in `auth.js` — keep `game.js` focused on gameplay
- The `profiles` table and `handle_new_user` trigger already exist from migrations — no database changes needed
- Username uniqueness check: query `profiles` table with `.select('id').eq('username', value).single()` before calling `signUp`

## Success Metrics

- A guest can register and be playing the game within 30 seconds
- A returning player can log in and see their username on the start screen
- Auth state persists across page refreshes
- Invalid inputs show clear, specific error messages

## Open Questions

- Should we add password strength requirements beyond Supabase's 6-char minimum?
- Should the username have character/length constraints (e.g., 3-20 chars, alphanumeric only)?
