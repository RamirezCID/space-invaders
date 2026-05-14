// ============================================================
// Space Invaders — leaderboard.js
// Score recording and leaderboard display
// ============================================================

// Pending score for guests who sign in after playing
let pendingScore = null;

// --- Score Recording ---

async function recordScore(score, wave) {
    if (!currentUser) return;

    const { error } = await supabaseClient
        .from('scores')
        .insert({
            player_id: currentUser.id,
            score: score,
            wave: wave,
        });

    if (error) {
        console.error('Failed to record score:', error.message);
    }
}

function setPendingScore(score, wave) {
    pendingScore = { score, wave };
}

function clearPendingScore() {
    pendingScore = null;
}

async function savePendingScore() {
    if (pendingScore && currentUser) {
        await recordScore(pendingScore.score, pendingScore.wave);
        clearPendingScore();
    }
}

// --- Leaderboard Fetching ---

async function fetchLeaderboard(period) {
    period = period || 'alltime';

    // Use PostgREST aggregate: max score per player, grouped by player_id
    let query = supabaseClient
        .from('scores')
        .select('player_id, best_score:score.max(), best_played_at:played_at.max(), profiles(username)');

    if (period === 'daily') {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        query = query.gte('played_at', todayStart.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Failed to fetch leaderboard:', error.message);
        return [];
    }

    // Sort by best score descending and take top 10
    const sorted = (data || [])
        .sort((a, b) => b.best_score - a.best_score)
        .slice(0, 10);

    return sorted.map((row, i) => ({
        rank: i + 1,
        username: row.profiles?.username || 'Unknown',
        score: row.best_score,
        played_at: row.best_played_at,
        player_id: row.player_id,
    }));
}

async function fetchPlayerRank(playerId, period) {
    if (!playerId) return null;

    period = period || 'alltime';

    // Use aggregate to get best score per player, then find this player's rank
    let query = supabaseClient
        .from('scores')
        .select('player_id, best_score:score.max(), best_played_at:played_at.max()');

    if (period === 'daily') {
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        query = query.gte('played_at', todayStart.toISOString());
    }

    const { data } = await query;
    if (!data) return null;

    // Sort by best score descending to determine rank
    data.sort((a, b) => b.best_score - a.best_score);

    const rankIndex = data.findIndex(r => r.player_id === playerId);
    if (rankIndex === -1) return null;

    const playerRow = data[rankIndex];

    return {
        rank: rankIndex + 1,
        username: currentUser?.username || 'You',
        score: playerRow.best_score,
        played_at: playerRow.best_played_at,
        player_id: playerId,
    };
}

// --- Leaderboard Rendering ---

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderLeaderboard(containerEl, scores, currentUserId, playerRank) {
    containerEl.innerHTML = '';

    if (!scores || scores.length === 0) {
        containerEl.innerHTML = '<p class="lb-empty">No scores recorded yet</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'lb-table';

    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Player</th><th>Score</th><th>Date</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    const playerInTop = scores.some(s => s.player_id === currentUserId);

    for (const entry of scores) {
        const tr = document.createElement('tr');
        if (entry.player_id === currentUserId) {
            tr.className = 'lb-highlight';
        }
        tr.innerHTML = `<td>${entry.rank}</td><td>${entry.username}</td><td>${entry.score.toLocaleString()}</td><td>${formatDate(entry.played_at)}</td>`;
        tbody.appendChild(tr);
    }

    // If player is not in top 10 but has a rank, show it
    if (!playerInTop && playerRank) {
        const dividerTr = document.createElement('tr');
        dividerTr.className = 'lb-divider';
        dividerTr.innerHTML = '<td colspan="4">...</td>';
        tbody.appendChild(dividerTr);

        const playerTr = document.createElement('tr');
        playerTr.className = 'lb-highlight';
        playerTr.innerHTML = `<td>${playerRank.rank}</td><td>${playerRank.username}</td><td>${playerRank.score.toLocaleString()}</td><td>${formatDate(playerRank.played_at)}</td>`;
        tbody.appendChild(playerTr);
    }

    table.appendChild(tbody);
    containerEl.appendChild(table);
}

// --- Load and display leaderboard into a container ---

async function loadLeaderboard(containerEl, period) {
    period = period || 'alltime';
    containerEl.innerHTML = '<p class="lb-loading">Loading...</p>';

    const scores = await fetchLeaderboard(period);
    const userId = currentUser?.id || null;

    let playerRank = null;
    if (userId) {
        const inTop = scores.some(s => s.player_id === userId);
        if (!inTop) {
            playerRank = await fetchPlayerRank(userId, period);
        }
    }

    renderLeaderboard(containerEl, scores, userId, playerRank);
}

// --- Start screen leaderboard ---

function showStartLeaderboard() {
    document.getElementById('startMain').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('startLeaderboard').classList.remove('hidden');

    // Reset toggle to All Time
    const tabs = document.querySelectorAll('#startLeaderboard .lb-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (tabs[0]) tabs[0].classList.add('active');

    loadLeaderboard(document.getElementById('startLbContainer'), 'alltime');
}

function switchStartLbTab(period, btnEl) {
    document.querySelectorAll('#startLeaderboard .lb-tab').forEach(t => t.classList.remove('active'));
    btnEl.classList.add('active');
    loadLeaderboard(document.getElementById('startLbContainer'), period);
}

function switchGoLbTab(period, btnEl) {
    document.querySelectorAll('#gameOverScreen .lb-tab').forEach(t => t.classList.remove('active'));
    btnEl.classList.add('active');
    loadLeaderboard(document.getElementById('goLbContainer'), period);
}
