import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export function filterTournaments(status) {
  state.currentTournamentFilter = status;
  ['all', 'today', 'upcoming', 'live', 'completed'].forEach(s => {
    const btn = document.getElementById(`filter-btn-${s}`);
    if (btn) {
      btn.classList.toggle('active', s === status);
    }
  });
  renderTournamentsListUI();
}

export function renderTournamentsListUI() {
  const container = document.getElementById('tournaments-cards-container');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = state.activeTournaments.filter(t => {
    const currentStatus = (t.status || 'upcoming').toLowerCase();
    const tDateStr = t.match_date ? new Date(t.match_date).toISOString().split('T')[0] : '';

    if (state.currentTournamentFilter === 'all') return true;
    if (state.currentTournamentFilter === 'today') return tDateStr === todayStr;
    return currentStatus === state.currentTournamentFilter;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>No matches found for '${state.currentTournamentFilter}'.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const isJoined = state.userJoinedTournamentIds.has(t.id);
    const imgUrl = t.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80';
    const currentStatus = (t.status || 'upcoming').toUpperCase();

    let dateStr = 'TBA';
    let timeStr = '';
    let dayStr = '';
    if (t.match_date) {
      const dObj = new Date(t.match_date);
      if (!isNaN(dObj.getTime())) {
        dateStr = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        timeStr = dObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dayStr = dObj.toLocaleDateString(undefined, { weekday: 'short' });
      }
    }

    const p1 = t.prize_pool ? `1st: PKR ${t.prize_pool}` : '';
    const p2 = t.prize_2 ? `2nd: PKR ${t.prize_2}` : '';
    const p3 = t.prize_3 ? `3rd: PKR ${t.prize_3}` : '';
    const p4 = t.prize_4 ? `4th: PKR ${t.prize_4}` : '';
    const prizeSubText = [p1, p2, p3, p4].filter(Boolean).join(' • ');

    return `
      <div class="t-card-as8-large">
        <div class="t-card-thumb-large" onclick="window.Router.navigate('tournament_detail', '${t.id}')">
          <img src="${imgUrl}" alt="${escapeHTML(t.title)}" />
          <div style="position:absolute; top:8px; left:8px; display:flex; gap:6px;">
            <span style="background:${currentStatus === 'LIVE' ? '#ff1744' : (currentStatus === 'COMPLETED' ? '#4b5563' : '#00f0ff')}; color:${currentStatus === 'LIVE' ? '#fff' : '#000'}; font-size:10px; font-weight:800; padding:3px 8px; border-radius:4px; font-family:var(--font-gaming); text-transform:uppercase;">
              ${currentStatus}
            </span>
            ${isJoined ? `<span style="background:#00e676; color:#000; font-size:10px; font-weight:800; padding:3px 8px; border-radius:4px; font-family:var(--font-gaming);">JOINED</span>` : ''}
          </div>
        </div>
        <div class="t-card-info-large">
          <h4 class="t-card-title-large" onclick="window.Router.navigate('tournament_detail', '${t.id}')">${escapeHTML(t.title)}</h4>
          <div class="t-card-meta-large">
            <span style="color:var(--accent-cyan); font-weight:600;">${escapeHTML(t.mode)} • ${escapeHTML(t.map)}</span>
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);"><strong style="font-family:var(--font-gaming); font-size:13px; color:var(--accent-gold);">${prizeSubText}</strong></span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-dim); border-top:1px solid #1f2636; padding-top:6px; margin-top:2px;">
            <span>Slots: <strong style="color:#fff;">${t.joined_players || 0}/${t.max_players}</strong> &nbsp;|&nbsp; <span style="color:var(--accent-gold);">${dayStr ? dayStr + ', ' : ''}${dateStr} ${timeStr ? '• ' + timeStr : ''}</span></span>
            <span style="font-weight:700; color:${t.entry_fee == 0 ? 'var(--accent-cyan)' : 'var(--accent-gold)'};">Entry Fee: <strong style="color:#fff;">${t.entry_fee == 0 ? 'FREE' : t.entry_fee + ' PKR'}</strong></span>
          </div>
          <div style="margin-top: 6px;">
            ${isJoined ? `
              <button class="btn btn-secondary btn-sm" style="width: 100%; padding: 8px; font-size: 12px; background: rgba(0,230,118,0.2); color: var(--success); border-color: rgba(0,230,118,0.4); cursor: default;" disabled>
                <i class="fa-solid fa-check"></i> YOU ARE IN
              </button>
            ` : `
              <button onclick="window.Router.navigate('tournament_detail', '${t.id}')" class="btn btn-primary btn-sm" style="width: 100%; padding: 8px; font-size: 12px; background: linear-gradient(135deg, #00f0ff, #0077ff); color: #000; font-weight: 800;">
                JOIN NOW
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderTournamentsHTMLBlock() {
  return `
    <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-3" style="scrollbar-width:none;">
      <button onclick="window.filterTournaments('all')" id="filter-btn-all" class="filter-tab-btn active">All Matches</button>
      <button onclick="window.filterTournaments('today')" id="filter-btn-today" class="filter-tab-btn">Today</button>
      <button onclick="window.filterTournaments('upcoming')" id="filter-btn-upcoming" class="filter-tab-btn">Upcoming</button>
      <button onclick="window.filterTournaments('live')" id="filter-btn-live" class="filter-tab-btn">Live</button>
      <button onclick="window.filterTournaments('completed')" id="filter-btn-completed" class="filter-tab-btn">Completed</button>
    </div>
    <div id="tournaments-cards-container" class="tournaments-stack-as8">
      <p class="text-gray-500 text-xs text-center py-4">Loading tournaments...</p>
    </div>
  `;
}

export async function renderTournaments() {
  try {
    const { data } = await sbClient.from('tournaments').select('*').order('created_at', { ascending: false });
    state.activeTournaments = data || [];
  } catch (e) {
    console.error(e);
  }

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title"><span><i class="fa-solid fa-trophy text-gold"></i> Active Tournaments & Rooms</span></div>
      <div>${renderTournamentsHTMLBlock()}</div>
    </div>
  `;

  state.currentTournamentFilter = 'all';
  renderTournamentsListUI();
}

export async function renderTournamentDetail(id) {
  await syncAuthAndProfile();

  let t = null;
  let entries = [];
  let winData = [];
  try {
    const [tRes, entriesRes, winRes] = await Promise.all([
      sbClient.from('tournaments').select('*').eq('id', id).single(),
      sbClient.from('tournament_entries').select('slot_number, user_id, profiles(free_fire_name, free_fire_uid)').eq('tournament_id', id),
      sbClient.from('winners').select('position, prize_amount, profiles(free_fire_name, free_fire_uid)').eq('tournament_id', id)
    ]);
    t = tRes.data;
    entries = entriesRes.data || [];
    winData = winRes.data || [];
  } catch (e) {
    console.error(e);
  }

  if (!t) {
    document.getElementById('app-view').innerHTML = `<div class="view-container empty-state"><p>Tournament not found.</p></div>`;
    return;
  }

  const isCompleted = (t.status || '').toLowerCase() === 'completed';
  const occupiedSlots = {};
  let mySlotNumber = null;

  entries.forEach(e => {
    occupiedSlots[e.slot_number] = e.profiles?.free_fire_name || 'Gamer';
    if (state.currentUser && e.user_id === state.currentUser.id) {
      mySlotNumber = e.slot_number;
    }
  });

  const isJoined = mySlotNumber !== null || state.userJoinedTournamentIds.has(t.id);
  const imgUrl = t.thumbnail_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80';

  let slotsHTML = '';
  const totalSlots = t.max_players || 12;
  for (let i = 1; i <= totalSlots; i++) {
    const isOccupied = !!occupiedSlots[i];
    const isMine = (mySlotNumber === i);
    const name = isMine ? (state.currentProfile?.free_fire_name || 'YOU') : (occupiedSlots[i] || 'Empty Slot');

    slotsHTML += `
      <div class="slot-card ${isOccupied ? 'occupied' : ''} ${isMine ? 'my-slot' : ''}">
        <span class="slot-num">${i}</span>
        <i class="fa-solid ${isOccupied ? 'fa-user' : 'fa-plus'} text-[10px]" style="color:${isMine ? 'var(--primary)' : (isOccupied ? 'var(--accent-cyan)' : 'var(--text-dim)')}"></i>
        <span class="slot-name">${escapeHTML(name)}</span>
      </div>
    `;
  }

  let winnerInfoHTML = '';
  if (isCompleted && winData.length > 0) {
    winnerInfoHTML = `
      <div style="background:rgba(255,190,0,0.1); border:1px solid var(--accent-gold); border-radius: var(--radius-sm); padding:12px; margin-bottom:12px;">
        <div style="font-size:11px; text-transform:uppercase; color:var(--accent-gold); font-weight:bold; margin-bottom:4px;"><i class="fa-solid fa-crown"></i> Match Winners Declared</div>
        ${winData.map(w => `
          <div style="font-size:13px; font-weight:bold; color:#fff; margin-top: 4px;">
            ${escapeHTML(w.profiles?.free_fire_name || 'Winner')} (UID: ${escapeHTML(w.profiles?.free_fire_uid || '--')}) - ${escapeHTML(w.position)} [PKR ${w.prize_amount}]
          </div>
        `).join('')}
      </div>
    `;
  }

  const p1 = t.prize_pool ? `1st: PKR ${t.prize_pool}` : '';
  const p2 = t.prize_2 ? `2nd: PKR ${t.prize_2}` : '';
  const p3 = t.prize_3 ? `3rd: PKR ${t.prize_3}` : '';
  const p4 = t.prize_4 ? `4th: PKR ${t.prize_4}` : '';
  const prizeDetailsFull = [p1, p2, p3, p4].filter(Boolean).join(' • ');

  const view = document.getElementById('app-view');
  view.innerHTML = `
    <div class="view-container">
      <div class="player-hero-card" style="margin-bottom: 12px; padding: 12px; text-align: center;">
        <img src="${imgUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />
        <h2 style="font-family: var(--font-gaming); font-size: 20px; font-weight: 800; margin-bottom: 4px; word-break: break-word; overflow-wrap: break-word; line-height: 1.2;">${escapeHTML(t.title)}</h2>
        <div style="font-size: 13px; font-weight: 700; color: var(--accent-gold); margin: 6px 0;">🏆 ${prizeDetailsFull}</div>
        <div class="hero-stats-grid" style="padding:6px; background:rgba(0,0,0,0.5); margin-top: 8px;">
          <div class="stat-box"><span class="stat-label">Entry Fee</span><span class="stat-val ${t.entry_fee == 0 ? 'green' : 'gold'}" style="font-size:14px;">${t.entry_fee == 0 ? 'FREE' : t.entry_fee + ' PKR'}</span></div>
          <div class="stat-box"><span class="stat-label">1st Prize</span><span class="stat-val green" style="font-size:14px;">PKR ${t.prize_pool}</span></div>
          <div class="stat-box"><span class="stat-label">Slots</span><span class="stat-val" style="font-size:14px;">${t.joined_players || 0}/${t.max_players}</span></div>
        </div>
      </div>

      <div class="rules-dropdown-container">
        <div class="rules-dropdown-header" onclick="window.toggleRulesDropdown(this)">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:14px;">🏆</span>
            <span style="font-family:var(--font-gaming); font-size:13px; font-weight:700; color:var(--accent-gold);">MATCH & MATCH JOINING RULES</span>
          </div>
          <span class="rules-arrow">&#9660;</span>
        </div>
        <div class="rules-dropdown-content">
          <div style="color:var(--accent-gold); font-weight:bold; margin:10px 0 6px 0;">🎮 1. MATCH JOINING RULES</div>
          <p><strong>1. 💰 Entry Fee:</strong> The required entry fee must be available in the player's tournament wallet before joining a match.</p>
          <p><strong>2. ✅ Match Joining:</strong> Players must check match details carefully before joining.</p>
          <p><strong>3. ⏰ Be On Time:</strong> Present in room before match start.</p>
          <p><strong>4. 🚫 No Show = No Refund:</strong> Missing the match means no refund.</p>
        </div>
      </div>

      ${winnerInfoHTML}

      ${isJoined && !isCompleted ? `
        <div style="background:#0c1017; border:1px solid var(--accent-gold); border-radius: var(--radius-sm); padding:12px; margin-bottom: 12px;">
          <div style="font-size:10px; text-transform:uppercase; color:var(--accent-gold); font-weight:700; margin-bottom: 8px;">
            Custom Room Credentials ${mySlotNumber ? '(SLOT #' + mySlotNumber + ')' : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
            <div style="background: #131722; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; text-align: center;">
              <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Room ID</div>
              <div style="font-family: monospace; font-size: 14px; font-weight: bold; color: var(--accent-cyan); margin-top: 2px;">
                ${escapeHTML(t.room_id || 'Pending')}
              </div>
            </div>
            <div style="background: #131722; border: 1px solid var(--border-color); border-radius: 6px; padding: 8px; text-align: center;">
              <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase;">Password</div>
              <div style="font-family: monospace; font-size: 14px; font-weight: bold; color: var(--accent-cyan); margin-top: 2px;">
                ${escapeHTML(t.room_password || '••••••••')}
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="room-slots-container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #1f2636; padding-bottom:6px;">
          <span style="font-family:var(--font-gaming); font-size:12px; font-weight:bold; color:var(--accent-gold); text-transform:uppercase;">
            <i class="fa-solid fa-gamepad mr-1"></i> Room Slots (${t.joined_players || 0}/${t.max_players})
          </span>
          <span style="font-size:10px; color:var(--text-dim);">Map: ${escapeHTML(t.map)}</span>
        </div>
        <div class="room-slots-grid">${slotsHTML}</div>
      </div>

      <div style="position: sticky; bottom: 10px;">
        ${isCompleted ? `
          <button class="btn btn-secondary" style="background:#262f40; color:#aaa; cursor:default;" disabled>
            <i class="fa-solid fa-lock"></i> MATCH COMPLETED (LOCKED)
          </button>
        ` : (isJoined ? `
          <button class="btn btn-secondary" style="cursor: default;" disabled>
            <i class="fa-solid fa-check-double text-green-400"></i> YOU ARE IN! ${mySlotNumber ? 'SLOT #' + mySlotNumber : ''}
          </button>
        ` : `
          <button id="btn-join-match" class="btn btn-primary">
            <i class="fa-solid fa-shield-virus"></i> JOIN MATCH (${t.entry_fee} PKR)
          </button>
        `)}
      </div>
    </div>
  `;

  if (!isJoined && !isCompleted) {
    document.getElementById('btn-join-match').onclick = async () => {
      if (!state.currentUser) {
        Toast.show("Please login first", "info");
        window.Router.navigate('login');
        return;
      }

      if (!confirm(`Join match? PKR ${t.entry_fee} will be deducted from your wallet.`)) return;

      Loader.show("Reserving slot...");
      const { data, error } = await sbClient.rpc('join_tournament', { p_tournament_id: t.id });
      Loader.hide();

      if (error) {
        Toast.show(error.message, "error");
      } else {
        Sound.playMatchVoice();
        Toast.show("Slot booked successfully!", "success");
        await syncAuthAndProfile();
        renderTournamentDetail(t.id);
      }
    };
  }
}

export function toggleRulesDropdown(headerEl) {
  const container = headerEl.closest('.rules-dropdown-container');
  if (container) {
    container.classList.toggle('open');
  }
}
