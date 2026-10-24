import { sbClient, state, Toast, Sound, escapeHTML } from './config.js';
import { loadUserMissionState, saveUserMissionState } from './missions.js';

export async function renderGamesList() {
  loadUserMissionState(true);
  const view = document.getElementById('app-view');

  view.innerHTML = `
    <div class="view-container">
      <div style="margin-bottom:14px;">
        <button onclick="window.openDailyMissionsModal()" class="btn btn-primary" style="background:linear-gradient(135deg, #ff9800, #ff5722); color:#fff; font-size:15px; font-weight:800; border:1.5px solid #ffbe00; box-shadow:0 0 16px rgba(255,152,0,0.5); padding:12px; display:flex; justify-content:space-between; align-items:center;">
          <span style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-bullseye" style="font-size:18px; color:var(--accent-gold);"></i> 
            <span>🎯 DAILY MISSIONS (کھیلیں اور کوائنز کمائیں)</span>
          </span>
          <span style="font-size:11px; background:#000; color:var(--accent-gold); padding:3px 8px; border-radius:12px; font-family:var(--font-gaming);">OPEN REWARDS</span>
        </button>
      </div>

      <div class="section-title">
        <span><i class="fa-solid fa-gamepad text-gold"></i> Play Multani FF Games</span>
      </div>
      <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Bina download kiye direct web par play karein!</p>

      <div id="dynamic-games-container" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px;">
        <p style="grid-column: span 2; text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">Loading games from Admin Panel...</p>
      </div>
    </div>
  `;

  const container = document.getElementById('dynamic-games-container');

  try {
    // Seedha Admin Panel wale database table se games uthayega
    const { data: dbGames, error } = await sbClient
      .from('site_games')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) throw error;

    if (!dbGames || dbGames.length === 0) {
      container.innerHTML = `<p style="grid-column: span 2; text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">No active games available right now.</p>`;
      return;
    }

    container.innerHTML = dbGames.map(g => `
      <div class="player-hero-card" style="margin-bottom:0; padding:12px; display:flex; flex-direction:column; align-items:center; text-align:center; justify-content:space-between; gap:10px;">
        <div style="width:100%; display:flex; flex-direction:column; align-items:center;">
          <img src="${g.logo_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80'}" style="width:72px; height:72px; border-radius:12px; object-fit:cover; border:1.5px solid var(--border-color); margin-bottom:8px;" />
          <h4 style="font-size:13px; font-weight:700; color:#fff; width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(g.title)}</h4>
          <span style="font-size:10px; color:var(--accent-cyan); display:block; margin-top:2px;">${escapeHTML(g.category || 'Arcade')}</span>
        </div>

        <button onclick="window.launchGame('${g.game_url}', '${escapeHTML(g.title)}')" class="btn btn-primary btn-sm" style="width:100%; padding:8px 6px; font-size:11px; background:linear-gradient(135deg, #00f0ff, #0077ff); color:#000; font-weight:800; border-radius:6px;">
          <i class="fa-solid fa-play"></i> PLAY
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="grid-column: span 2; text-align:center; color:red; padding:20px; font-size:12px;">Error loading games: ${escapeHTML(err.message)}</p>`;
  }
}

export function launchGame(gameUrl, title) {
  Sound.playBrandName();

  const modal = document.getElementById('game-player-modal');
  const iframe = document.getElementById('game-iframe');
  const titleEl = document.getElementById('active-game-title');
  
  if (modal && iframe) {
    iframe.src = gameUrl;
    if (titleEl) titleEl.innerText = title;
    modal.classList.remove('hidden');

    loadUserMissionState(true);
    state.currentGameSessionStart = Date.now();
    state.currentGamePlayingUrl = gameUrl;

    if (state.activeGamePlayTimer) clearInterval(state.activeGamePlayTimer);
    state.activeGamePlayTimer = setInterval(() => {
      if (state.isWindowActive && document.visibilityState === 'visible') {
        state.userMissionState.playedSeconds += 1;
        if (state.userMissionState.playedSeconds % 10 === 0) {
          saveUserMissionState();
        }
      }
    }, 1000);
  }
}

export function closeGamePlayer() {
  const modal = document.getElementById('game-player-modal');
  const iframe = document.getElementById('game-iframe');
  if (modal && iframe) {
    iframe.src = "";
    modal.classList.add('hidden');
  }

  if (state.activeGamePlayTimer) {
    clearInterval(state.activeGamePlayTimer);
    state.activeGamePlayTimer = null;
  }

  if (state.currentGameSessionStart && state.currentGamePlayingUrl) {
    const sessionDurationSeconds = (Date.now() - state.currentGameSessionStart) / 1000;
    
    if (sessionDurationSeconds >= 30) {
      if (!state.userMissionState.playedGamesList.includes(state.currentGamePlayingUrl)) {
        state.userMissionState.playedGamesList.push(state.currentGamePlayingUrl);
        Toast.show(`Nayi game verify ho gayi! (${state.userMissionState.playedGamesList.length}/10)`, "success");
      } else {
        Toast.show("Yeh game pehle se count ho chuki hai. Koi doosri nayi game khelein!", "info");
      }
    } else {
      Toast.show("Game 30 seconds se kam kheli gayi, is liye count nahi hui!", "info");
    }
  }

  state.currentGameSessionStart = null;
  state.currentGamePlayingUrl = null;
  saveUserMissionState();
}
