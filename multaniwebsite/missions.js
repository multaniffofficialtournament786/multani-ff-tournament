import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export function getTodayKey() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })).toDateString();
}

export async function checkTodayTournamentJoined() {
  if (!state.currentUser) return false;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const fetchPromise = sbClient
      .from('tournament_entries')
      .select('created_at')
      .eq('user_id', state.currentUser.id)
      .gte('created_at', `${todayStr}T00:00:00Z`);

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 2500));
    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (!error && data && data.length > 0) {
      return true;
    }
  } catch (err) {
    console.error("Tournament check error:", err);
  }
  return false;
}

export async function loadUserMissionState(skipNetworkCheck = false) {
  const todayKey = getTodayKey();
  const storageKey = `ff_missions_verified_${state.currentUser ? state.currentUser.id : 'guest'}`;
  const localData = localStorage.getItem(storageKey);
  
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      if (parsed.lastDate === todayKey) {
        state.userMissionState = parsed;
        if (!Array.isArray(state.userMissionState.playedGamesList)) state.userMissionState.playedGamesList = [];
        if (!state.userMissionState.claimed) state.userMissionState.claimed = {};
      } else {
        resetMissionState(todayKey);
      }
    } catch(e) {
      resetMissionState(todayKey);
    }
  } else {
    resetMissionState(todayKey);
  }

  state.userMissionState.login = true;
  
  if (!skipNetworkCheck && state.currentUser) {
    const hasTodayMatch = await checkTodayTournamentJoined();
    if (hasTodayMatch) {
      state.userMissionState.joinedTournament = true;
    }
  }

  saveUserMissionState();
}

export function resetMissionState(todayKey) {
  state.userMissionState = {
    login: true,
    playedGamesList: [],
    playedSeconds: 0,
    joinedTournament: false,
    claimed: {},
    lastDate: todayKey
  };
}

export function saveUserMissionState() {
  const storageKey = `ff_missions_verified_${state.currentUser ? state.currentUser.id : 'guest'}`;
  localStorage.setItem(storageKey, JSON.stringify(state.userMissionState));
}

export async function openDailyMissionsModal() {
  Loader.show("Checking missions...");
  await loadUserMissionState(false);
  await renderMissionsUI();
  Loader.hide();
  document.getElementById('daily-missions-modal-overlay').classList.remove('hidden');
}

export function closeDailyMissionsModal() {
  document.getElementById('daily-missions-modal-overlay').classList.add('hidden');
}

export function toggleMissionsRulesDropdown() {
  const content = document.getElementById('missions-rules-content');
  const arrow = document.getElementById('missions-rules-arrow');
  if (content && arrow) {
    if (content.style.display === 'none' || content.style.display === '') {
      content.style.display = 'block';
      arrow.style.transform = 'rotate(180deg)';
    } else {
      content.style.display = 'none';
      arrow.style.transform = 'rotate(0deg)';
    }
  }
}

export async function renderMissionsUI() {
  const wrap = document.getElementById('daily-missions-cards-wrap');
  if (!wrap) return;

  wrap.innerHTML = `<p style="color:var(--text-dim); text-align:center; padding:10px; font-size:12px;">Loading live daily missions...</p>`;

  let dbMissions = [];
  try {
    const { data, error } = await sbClient
      .from('daily_missions')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      dbMissions = data;
    }
  } catch (err) {
    console.error("Missions fetch error:", err);
  }

  const playedMinutes = Math.floor(state.userMissionState.playedSeconds / 60);
  const uniqueGamesCount = (state.userMissionState.playedGamesList || []).length;

  if (!dbMissions.length) {
    dbMissions = [
      { id: 1, title: 'روزانہ ایپ میں لاگ اِن کرنا', description: 'Daily login bonus', reward_coins: 1, target_count: 1, action_type: 'login' },
      { id: 2, title: '10 الگ الگ گیمز کھیلنا', description: 'Play 10 different games', reward_coins: 1, target_count: 10, action_type: 'play_games' },
      { id: 3, title: '1 گھنٹہ گیمز کھیلنا', description: 'Play for 60 minutes', reward_coins: 5, target_count: 60, action_type: 'game_time' },
      { id: 4, title: 'ایک ٹورنامنٹ کھیلنا', description: 'Join 1 tournament match', reward_coins: 1, target_count: 1, action_type: 'tournament' }
    ];
  }

  let allDone = true;

  let html = dbMissions.map(m => {
    let isReady = false;
    let progressText = '';
    const claimKey = `m_${m.id}`;
    const isClaimed = !!state.userMissionState.claimed[claimKey];

    if (m.action_type === 'login') {
      isReady = state.userMissionState.login;
      progressText = isReady ? '1 / 1 مکمل' : '0 / 1 لاگ اِن کریں';
    } else if (m.action_type === 'play_games') {
      isReady = uniqueGamesCount >= (m.target_count || 10);
      progressText = `${Math.min(m.target_count || 10, uniqueGamesCount)} / ${m.target_count || 10} الگ گیمز`;
    } else if (m.action_type === 'game_time') {
      const reqMinutes = m.target_count || 60;
      isReady = playedMinutes >= reqMinutes;
      progressText = `${playedMinutes} / ${reqMinutes} منٹ کھیل لیا`;
    } else if (m.action_type === 'tournament') {
      isReady = state.userMissionState.joinedTournament;
      progressText = isReady ? '1 / 1 مکمل' : '0 / 1 جوائن کریں';
    } else {
      isReady = state.userMissionState.login;
      progressText = 'ٹاسک مکمل کریں';
    }

    if (!isClaimed) allDone = false;

    let actionBtn = '';
    if (isClaimed) {
      actionBtn = `<button class="btn btn-secondary btn-sm" style="background:#1b2434; color:var(--success); border-color:#00e67655; cursor:default;" disabled><i class="fa-solid fa-check"></i> کلیم ہو چکا</button>`;
    } else if (isReady) {
      actionBtn = `<button onclick="window.claimMissionReward('${claimKey}', ${m.reward_coins}, '${escapeHTML(m.title)}')" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #00e676, #00c853); color:#000; font-weight:800; box-shadow:0 0 10px rgba(0,230,118,0.5);"><i class="fa-solid fa-gift"></i> CLAIM</button>`;
    } else {
      actionBtn = `<button class="btn btn-secondary btn-sm" style="background:#262f40; color:var(--text-dim); cursor:default;" disabled>نامکمل</button>`;
    }

    return `
      <div class="tx-item" style="padding:12px; border-left:3px solid ${isClaimed ? 'var(--success)' : (isReady ? 'var(--accent-gold)' : 'var(--border-color)')}; display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:13px; font-weight:700; color:#fff;">${escapeHTML(m.title)}</span>
            <span style="font-family:var(--font-gaming); font-size:11px; font-weight:bold; color:var(--accent-gold); background:rgba(255,190,0,0.15); padding:2px 6px; border-radius:4px;">+${m.reward_coins} Coin${m.reward_coins > 1 ? 's' : ''}</span>
          </div>
          <span style="font-size:11px; color:var(--accent-cyan); display:block; margin-top:2px;">پراگریس: ${progressText}</span>
        </div>
        <div>${actionBtn}</div>
      </div>
    `;
  }).join('');

  let allBonusBtn = '';
  if (state.userMissionState.claimed.allBonus) {
    allBonusBtn = `<button class="btn btn-secondary btn-sm" style="background:#1b2434; color:var(--success); border-color:#00e67655; cursor:default;" disabled><i class="fa-solid fa-check"></i> وصول ہو گیا</button>`;
  } else if (allDone && dbMissions.length > 0) {
    allBonusBtn = `<button onclick="window.claimMissionReward('allBonus', 2, 'تمام مشنز مکمل بونس')" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #ffbe00, #ff7700); color:#000; font-weight:800; box-shadow:0 0 14px rgba(255,190,0,0.6);"><i class="fa-solid fa-crown"></i> CLAIM +2</button>`;
  } else {
    allBonusBtn = `<button class="btn btn-secondary btn-sm" style="background:#262f40; color:var(--text-dim); cursor:default;" disabled>لاک ہے</button>`;
  }

  html += `
    <div class="tx-item" style="padding:14px; border:1.5px solid #ffbe00; background:linear-gradient(135deg, rgba(255,190,0,0.1), #151922); border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:4px;">
      <div style="flex:1;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:14px; font-weight:800; color:var(--accent-gold);">تمام ڈیلی مشنز مکمل کرنا</span>
          <span style="font-family:var(--font-gaming); font-size:11px; font-weight:bold; color:#00e676; background:rgba(0,230,118,0.15); padding:2px 6px; border-radius:4px;">+2 Extra Coins</span>
        </div>
        <span style="font-size:11px; color:#c7cbd1; display:block; margin-top:2px;">تمام ایکٹو مشنز کلیم کرنے پر 2 اضافی کوائنز ملیں گے</span>
      </div>
      <div>${allBonusBtn}</div>
    </div>
  `;

  wrap.innerHTML = html;
}

export async function claimMissionReward(missionKey, coinAmount, desc) {
  if (!state.currentUser) {
    Toast.show("Pehle apna account login karein!", "info");
    window.Router.navigate('login');
    return;
  }

  Loader.show("Coins wallet mein transfer ho rahe hain...");
  try {
    const { data, error } = await sbClient.rpc('claim_daily_mission', {
      p_mission_id: missionKey,
      p_coins: coinAmount,
      p_desc: desc
    });

    if (error) {
      const currentBal = Number(state.currentProfile?.wallet_balance || 0);
      const newBal = currentBal + Number(coinAmount);
      const [pErr, tErr] = await Promise.all([
        sbClient.from('profiles').update({ wallet_balance: newBal }).eq('id', state.currentUser.id),
        sbClient.from('wallet_transactions').insert([{
          user_id: state.currentUser.id,
          amount: coinAmount,
          transaction_type: 'daily_mission',
          description: `Daily Mission (${desc})`
        }])
      ]);
      if (pErr.error) throw pErr.error;
    }

    state.userMissionState.claimed[missionKey] = true;
    saveUserMissionState();

    Sound.playRewardVoice();
    Loader.hide();
    Toast.show(`Mubarak! +${coinAmount} Coins wallet me transfer ho gaye!`, "success");
    await syncAuthAndProfile();
    renderMissionsUI();
  } catch (err) {
    Loader.hide();
    Toast.show("Transfer failed: " + (err.message || "Dubara koshish karein"), "error");
  }
}
