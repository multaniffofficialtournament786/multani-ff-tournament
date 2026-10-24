import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

// ==========================================
// 1. WINNERS LIST PAGE
// ==========================================
export async function renderWinners() {
  Loader.show("Loading winners...");
  let winners = [];
  try {
    const { data } = await sbClient
      .from('winners')
      .select('position, prize_amount, created_at, profiles(free_fire_name, free_fire_uid, avatar_url), tournaments(title)')
      .order('created_at', { ascending: false })
      .limit(30);
    winners = data || [];
  } catch (e) {
    console.error("Winners load error:", e);
  }
  Loader.hide();

  const winnersListHtml = winners.length ? winners.map((w, index) => {
    const avatar = w.profiles?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
    return `
      <div class="tx-item" style="border-left: 3px solid var(--accent-gold); display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${avatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid var(--accent-gold);" />
          <div>
            <h4 style="color:#fff; font-size:13px; font-weight:700;">${escapeHTML(w.profiles?.free_fire_name || 'Soldier')}</h4>
            <span style="font-size:10px; color:var(--text-muted);">UID: ${escapeHTML(w.profiles?.free_fire_uid || '--')} • ${escapeHTML(w.tournaments?.title || 'Custom Room')}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:11px; font-weight:bold; color:var(--accent-cyan); display:block;">${escapeHTML(w.position)}</span>
          <span style="font-family:var(--font-gaming); font-size:13px; color:var(--success); font-weight:800;">+PKR ${w.prize_amount}</span>
        </div>
      </div>
    `;
  }).join('') : '<p style="text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">No tournament winners declared yet.</p>';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title"><span>🏆 Champion Hall of Fame</span></div>
      <div style="margin-top:10px;">${winnersListHtml}</div>
    </div>
  `;
}

// ==========================================
// 2. LEADERBOARD PAGE
// ==========================================
export async function renderLeaderboard() {
  Loader.show("Loading rankings...");
  let topPlayers = [];
  try {
    const { data } = await sbClient
      .from('profiles')
      .select('free_fire_name, free_fire_uid, total_won, avatar_url')
      .gt('total_won', 0)
      .order('total_won', { ascending: false })
      .limit(20);
    topPlayers = data || [];
  } catch (e) {
    console.error("Leaderboard load error:", e);
  }
  Loader.hide();

  const rankRows = topPlayers.length ? topPlayers.map((p, i) => {
    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const rankColor = rankColors[i] || 'var(--accent-cyan)';
    return `
      <div class="tx-item" style="border-left: 3px solid ${rankColor}; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-family:var(--font-gaming); font-size:16px; font-weight:800; color:${rankColor}; width:20px; text-align:center;">#${i + 1}</span>
          <div>
            <h4 style="color:#fff; font-size:13px;">${escapeHTML(p.free_fire_name || 'Warrior')}</h4>
            <span style="font-size:10px; color:var(--text-dim);">UID: ${escapeHTML(p.free_fire_uid || '--')}</span>
          </div>
        </div>
        <div style="font-family:var(--font-gaming); font-size:14px; color:var(--accent-gold); font-weight:bold;">
          PKR ${p.total_won || 0}
        </div>
      </div>
    `;
  }).join('') : '<p style="text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">No ranked players yet.</p>';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title"><span>🎖 Top Winning Players</span></div>
      <div style="margin-top:10px;">${rankRows}</div>
    </div>
  `;
}

// ==========================================
// 3. NOTIFICATIONS PAGE
// ==========================================
export async function renderNotifications() {
  if (!state.currentUser) { window.Router.navigate('login'); return; }

  Loader.show("Loading alerts...");
  let notifications = [];
  try {
    const { data } = await sbClient
      .from('notifications')
      .select('*')
      .eq('user_id', state.currentUser.id)
      .order('created_at', { ascending: false })
      .limit(30);
    notifications = data || [];

    await sbClient.from('notifications').update({ is_read: true }).eq('user_id', state.currentUser.id).eq('is_read', false);
    state.unreadNotifCount = 0;
    const badge = document.getElementById('header-notif-badge');
    if (badge) badge.classList.add('hidden');
  } catch (e) {
    console.error("Notif error:", e);
  }
  Loader.hide();

  const notifRows = notifications.length ? notifications.map(n => `
    <div class="tx-item" style="border-left: 3px solid ${n.is_read ? 'var(--border-color)' : 'var(--accent-cyan)'};">
      <div class="tx-info">
        <h4 style="color:#fff;">${escapeHTML(n.title || 'Notification')}</h4>
        <p style="font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHTML(n.message || '')}</p>
        <span style="font-size:10px; color:var(--text-dim); margin-top:4px; display:block;">${new Date(n.created_at).toLocaleString()}</span>
      </div>
    </div>
  `).join('') : '<p style="text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">No alerts or notifications.</p>';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title"><span>🔔 Inbox & Alerts</span></div>
      <div style="margin-top:10px;">${notifRows}</div>
    </div>
  `;
}

// ==========================================
// 4. INVITE & EARN (REFERRAL) PAGE
// ==========================================
export async function renderInvite() {
  if (!state.currentUser) { window.Router.navigate('login'); return; }
  await syncAuthAndProfile();

  const p = state.currentProfile || {};
  const myUid = p.free_fire_uid || '--';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container" style="text-align:center;">
      <div class="player-hero-card" style="padding:18px;">
        <i class="fa-solid fa-users" style="font-size:36px; color:var(--accent-gold); margin-bottom:8px;"></i>
        <h2 style="font-family:var(--font-gaming); font-size:20px; margin-bottom:4px;">INVITE & WIN REWARDS</h2>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Apne Free Fire doston ko invite karein aur unke register hone par rewards hasil karein!</p>

        <div style="background:#0a0e16; border:1px solid var(--accent-gold); border-radius:8px; padding:12px; margin-bottom:14px;">
          <div style="font-size:10px; color:var(--text-dim); text-transform:uppercase;">Your Referral Code (UID)</div>
          <div id="ref-code-val" style="font-family:var(--font-gaming); font-size:22px; font-weight:800; color:var(--accent-cyan); letter-spacing:2px; margin:4px 0;">${escapeHTML(myUid)}</div>
          <button onclick="navigator.clipboard.writeText('${escapeHTML(myUid)}'); Toast.show('Referral Code Copied!', 'success');" class="btn btn-primary btn-sm" style="margin-top:6px; font-size:11px;">
            <i class="fa-solid fa-copy"></i> COPY CODE
          </button>
        </div>

        <div style="font-size:11px; text-align:left; color:var(--text-muted); background:rgba(0,0,0,0.3); padding:10px; border-radius:6px;">
          <strong>Rules:</strong><br>
          • Dost sign up karte waqt referral box mein aapki UID dalein.<br>
          • Matches mein participate karne par referral commission activate hoga.
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 5. RULES & ABOUT US
// ==========================================
export function renderRules() {
  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="player-hero-card">
        <h3 style="font-family:var(--font-gaming); font-size:16px; color:var(--accent-gold); margin-bottom:10px;">🏆 TOURNAMENT RULES</h3>
        <p style="font-size:12px; color:#fff; line-height:1.6; margin-bottom:8px;">1. <strong>Fair Play:</strong> Kisi qisam ke hacks, scripts, ya config files ka istemal sakht mana hai. Pakde jane par account foran ban hoga.</p>
        <p style="font-size:12px; color:#fff; line-height:1.6; margin-bottom:8px;">2. <strong>Room Time:</strong> Match shuru hone se 10 minute pehle ID aur Password diya jata hai. Time par room join karein.</p>
        <p style="font-size:12px; color:#fff; line-height:1.6;">3. <strong>Prizes:</strong> Match mukammal hone ke 15-30 minute ke andar result update ho jata hai aur balance wallet mein add ho jata hai.</p>
      </div>
    </div>
  `;
}

export function renderAbout() {
  document.getElementById('app-view').innerHTML = `
    <div class="view-container" style="text-align:center;">
      <div class="player-hero-card" style="padding:18px;">
        <h2 style="font-family:var(--font-gaming); font-size:22px; color:var(--accent-cyan); margin-bottom:6px;">MULTANI FF OFFICIAL</h2>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">The leading esports tournament platform for Free Fire players in Pakistan.</p>
        <div style="font-size:11px; color:#aaa; line-height:1.6;">
          Developed with precision for instant payouts, secure automated verification, and high-performance gaming rooms.
        </div>
      </div>
    </div>
  `;
}
