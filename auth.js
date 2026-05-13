// ============================================================
// Space Invaders — auth.js
// Supabase Auth: registration, login, session management
// ============================================================

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current authenticated user info (null if guest)
let currentUser = null;

// --- DOM Elements ---
const startScreen = document.getElementById('startScreen');

// --- Auth State ---

async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await setLoggedInState(session.user);
    } else {
        setLoggedOutState();
    }
}

async function setLoggedInState(user) {
    // Fetch username from profiles table
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    currentUser = {
        id: user.id,
        username: profile?.username || user.user_metadata?.username || 'Player',
    };

    updateStartScreenAuth();
}

function setLoggedOutState() {
    currentUser = null;
    updateStartScreenAuth();
}

function updateStartScreenAuth() {
    const welcomeEl = document.getElementById('authWelcome');
    const authBtnsEl = document.getElementById('authButtons');
    const logoutBtnEl = document.getElementById('logoutBtn');
    const gameOverLogoutBtn = document.getElementById('gameOverLogoutBtn');

    if (currentUser) {
        welcomeEl.textContent = `Welcome, ${currentUser.username}`;
        welcomeEl.classList.remove('hidden');
        authBtnsEl.classList.add('hidden');
        logoutBtnEl.classList.remove('hidden');
        gameOverLogoutBtn.classList.remove('hidden');
    } else {
        welcomeEl.classList.add('hidden');
        authBtnsEl.classList.remove('hidden');
        logoutBtnEl.classList.add('hidden');
        gameOverLogoutBtn.classList.add('hidden');
    }
}

// --- Registration ---

function showRegisterForm() {
    document.getElementById('startMain').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    clearFormErrors();
}

async function handleRegister(e) {
    e.preventDefault();
    clearFormErrors();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!username || !email || !password) {
        showFormError('registerForm', 'All fields are required');
        return;
    }

    // Check username uniqueness
    const { data: existing } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

    if (existing) {
        showFormError('registerForm', 'Username is already taken');
        return;
    }

    // Sign up
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });

    if (error) {
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already been registered')) {
            showFormError('registerForm', 'Email is already registered');
        } else if (error.message.toLowerCase().includes('database error')) {
            // Trigger may have failed — try manual profile insert as fallback
            const { data: session } = await supabaseClient.auth.getSession();
            if (session?.session?.user) {
                await supabaseClient.from('profiles').upsert({
                    id: session.session.user.id,
                    username: username,
                });
                await setLoggedInState(session.session.user);
                showStartMain();
                return;
            }
            showFormError('registerForm', error.message);
        } else {
            showFormError('registerForm', error.message);
        }
        return;
    }

    // Success — user is logged in automatically
    await setLoggedInState(data.user);
    showStartMain();
}

// --- Login ---

function showLoginForm() {
    document.getElementById('startMain').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    clearFormErrors();
}

async function handleLogin(e) {
    e.preventDefault();
    clearFormErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showFormError('loginForm', 'All fields are required');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        showFormError('loginForm', 'Invalid email or password');
        return;
    }

    await setLoggedInState(data.user);
    showStartMain();
}

// --- Logout ---

async function handleLogout() {
    await supabaseClient.auth.signOut();
    setLoggedOutState();
}

function showGameOverLoggedOut() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    showStartMain();
}

function gameOverGoToSignIn() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    showLoginForm();
}

// --- UI Helpers ---

function showStartMain() {
    document.getElementById('startMain').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.add('hidden');
}

function showFormError(formId, message) {
    const errorEl = document.querySelector(`#${formId} .form-error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

// --- Init on load ---
initAuth();
