// ============================================================
// Space Invaders — profile.js
// Player profile: stats and score history
// ============================================================

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initProfile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    const userId = session.user.id;

    // Fetch username
    const { data: profile } = await sb
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

    const username = profile?.username || session.user.user_metadata?.username || 'Player';
    document.getElementById('profileTitle').textContent = username;
    document.title = `${username} — Space Invaders`;

    // Load stats and history in parallel
    await Promise.all([
        loadStats(userId),
        loadHistory(userId),
    ]);
}

// --- Stats ---

async function loadStats(userId) {
    const container = document.getElementById('profileStats');

    // All-time stats (single aggregate query)
    const { data: allTime } = await sb
        .from('scores')
        .select('high_score:score.max(), avg_score:score.avg(), best_wave:wave.max(), total_games:score.count()')
        .eq('player_id', userId);

    // Today's high score
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: daily } = await sb
        .from('scores')
        .select('daily_high:score.max()')
        .eq('player_id', userId)
        .gte('played_at', todayStart.toISOString());

    const stats = allTime?.[0] || {};
    const dailyStats = daily?.[0] || {};

    const items = [
        { label: 'All-Time High', value: stats.high_score ?? '—' },
        { label: "Today's High", value: dailyStats.daily_high ?? '—' },
        { label: 'Average Score', value: stats.avg_score ? Math.round(stats.avg_score) : '—' },
        { label: 'Highest Wave', value: stats.best_wave ?? '—' },
        { label: 'Total Games', value: stats.total_games ?? 0 },
    ];

    container.innerHTML = items.map(item => `
        <div class="stat-card">
            <div class="stat-label">${item.label}</div>
            <div class="stat-value">${typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
        </div>
    `).join('');
}

// --- Recent Games ---

async function loadHistory(userId) {
    const container = document.getElementById('profileHistory');

    const { data, error } = await sb
        .from('scores')
        .select('score, wave, played_at')
        .eq('player_id', userId)
        .order('played_at', { ascending: false })
        .limit(20);

    if (error || !data || data.length === 0) {
        container.innerHTML = '<p class="lb-empty">No games played yet</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'lb-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Score</th><th>Wave</th><th>Date</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of data) {
        const tr = document.createElement('tr');
        const d = new Date(row.played_at);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        tr.innerHTML = `<td>${row.score.toLocaleString()}</td><td>${row.wave}</td><td>${dateStr}</td>`;
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
}

// --- Change Password ---

async function handleChangePassword(e) {
    e.preventDefault();

    const errorEl = document.querySelector('#changePasswordForm .form-error');
    const successEl = document.querySelector('#changePasswordForm .form-success');
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.classList.remove('hidden');
        return;
    }

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.remove('hidden');
        return;
    }

    const { error } = await sb.auth.updateUser({ password: newPassword });

    if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        return;
    }

    successEl.textContent = 'Password updated successfully';
    successEl.classList.remove('hidden');
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// --- Init ---
initProfile();
