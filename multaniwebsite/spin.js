import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export async function renderDailySpin() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }
  
  let slots = [];
  let userHistory = null;
  
  try {
    const [slotsRes, historyRes] = await Promise.all([
      sbClient.from('daily_spin_rewards').select('*').order('slot_number', { ascending: true }),
      sbClient.from('daily_spin_history').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false }).limit(1)
    ]);
    slots = slotsRes.data || [];
    
    const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
    const todayDateOnly = new Date(todayStr).toDateString();
    
    if (historyRes.data && historyRes.data.length > 0) {
      const lastSpin = historyRes.data[0];
      const lastSpinDateOnly = new Date(new Date(lastSpin.spin_date || lastSpin.created_at).toLocaleString("en-US", { timeZone: "Asia/Karachi" })).toDateString();
      if (lastSpinDateOnly === todayDateOnly) {
        userHistory = lastSpin;
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (!slots.length) {
    slots = [
      { slot_number: 1, reward_name: "1 COIN", reward_value: 1 },
      { slot_number: 2, reward_name: "EMPTY — 0 COINS", reward_value: 0 },
      { slot_number: 3, reward_name: "3 COINS", reward_value: 3 },
      { slot_number: 4, reward_name: "8 COINS", reward_value: 8 },
      { slot_number: 5, reward_name: "TRY AGAIN", reward_value: 0 },
      { slot_number: 6, reward_name: "2 COINS", reward_value: 2 },
      { slot_number: 7, reward_name: "EMPTY — 0 COINS", reward_value: 0 },
      { slot_number: 8, reward_name: "5 COINS", reward_value: 5 }
    ];
  }

  let initialRotation = 0;
  if (userHistory) {
    const matchedSlot = slots.find(s => s.id === userHistory.reward_id || s.reward_name === userHistory.reward_name);
    if (matchedSlot) {
      const slotNum = matchedSlot.slot_number || 1;
      const degreesPerSlot = 360 / 8;
      initialRotation = (slotNum - 1) * degreesPerSlot + (degreesPerSlot / 2);
    }
  }

  const rewardWonText = userHistory ? `You won: ${userHistory.reward_name}` : 'SPIN & WIN FREE COINS';

  const view = document.getElementById('app-view');
  view.innerHTML = `
    <div class="view-container" style="text-align:center;">
      <div style="margin-bottom:8px;">
        <span style="font-family:var(--font-gaming); font-size:11px; letter-spacing:3px; color:var(--primary); font-weight:700;">MULTANI FF OFFICIAL TOURNAMENT</span>
        <h2 style="font-family:var(--font-gaming); font-size:24px; font-weight:800; color:#ffaa00; text-transform:uppercase; text-shadow:0 2px 6px rgba(0,0,0,0.8); margin-top:2px;">DAILY SPIN</h2>
        <p style="font-size:11px; font-weight:700; color:#00e676; text-transform:uppercase; letter-spacing:1px;" id="won-reward-subtitle">${rewardWonText}</p>
      </div>

      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:8px 10px; margin-bottom:10px; text-align:left; font-size:11px; color:var(--text-muted);">
        <div style="color:var(--accent-gold); font-weight:bold; margin-bottom:3px;">🎯 DAILY REWARD INFORMATION:</div>
        <div>• <strong>8 COINS</strong> — ONLY 2 PLAYERS PER DAY</div>
        <div>• <strong>5 COINS</strong> — ONLY 2–3 PLAYERS PER DAY</div>
        <div>• <strong>1 FREE SPIN DAILY</strong></div>
        <div id="countdown-timer-text">• <strong>NEXT SPIN: 12:00 AM — PAKISTAN TIME</strong></div>
      </div>

      <div style="position:relative; width:280px; height:280px; margin:0 auto 12px auto; display:flex; align-items:center; justify-content:center;">
        <div id="spin-pointer" style="position:absolute; top:-8px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:10px solid transparent; border-right:10px solid transparent; border-top:20px solid var(--accent-cyan); z-index:50; filter:drop-shadow(0 0 6px var(--accent-cyan));"></div>
        
        <div id="wheel-element" style="width:100%; height:100%; border-radius:50%; border:4px solid var(--accent-gold); position:relative; overflow:hidden; box-shadow:0 0 30px rgba(255,190,0,0.4), inset 0 0 20px rgba(0,0,0,0.8); transition: transform 4s cubic-bezier(0.15, 0.95, 0.15, 1); background:#151922; transform: rotate(${initialRotation}deg);">
          <svg viewBox="0 0 200 200" style="width:100%; height:100%; transform:rotate(-22.5deg);">
            ${slots.map((s, idx) => {
              const colors = ['#ff4624', '#00f0ff', '#833ab4', '#00e676', '#ffbe00', '#ff1744', '#5c687a', '#ff9800'];
              const color = colors[idx % colors.length];
              const startAngle = idx * 45;
              const endAngle = (idx + 1) * 45;
              
              const x1 = 100 + 100 * Math.cos(Math.PI * startAngle / 180);
              const y1 = 100 + 100 * Math.sin(Math.PI * startAngle / 180);
              const x2 = 100 + 100 * Math.cos(Math.PI * endAngle / 180);
              const y2 = 100 + 100 * Math.sin(Math.PI * endAngle / 180);

              const midAngle = startAngle + 22.5;
              const tx = 100 + 62 * Math.cos(Math.PI * midAngle / 180);
              const ty = 100 + 62 * Math.sin(Math.PI * midAngle / 180);

              return `
                <g>
                  <path d="M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z" fill="${color}" stroke="#111" stroke-width="1.5"/>
                  <text x="${tx}" y="${ty}" fill="#fff" font-size="9" font-weight="bold" font-family="sans-serif" text-anchor="middle" dominant-baseline="middle" transform="rotate(${midAngle}, ${tx}, ${ty})">${escapeHTML(s.reward_name)}</text>
                </g>
              `;
            }).join('')}
          </svg>
        </div>

        <button ${userHistory ? 'disabled' : 'onclick="window.triggerDailySpin()"'} id="wheel-center-btn" style="position:absolute; width:58px; height:58px; border-radius:50%; background:${userHistory ? '#333' : 'radial-gradient(circle, #ffbe00, #ff7700)'}; border:3px solid #fff; color:${userHistory ? '#888' : '#000'}; font-family:var(--font-gaming); font-weight:800; font-size:15px; cursor:${userHistory ? 'default' : 'pointer'}; box-shadow:0 0 15px rgba(255,190,0,0.8); z-index:40;">
          ${userHistory ? 'DONE' : 'SPIN'}
        </button>
      </div>

      <button ${userHistory ? 'disabled' : 'onclick="window.triggerDailySpin()"'} id="btn-spin-now" class="btn btn-primary" style="background:${userHistory ? '#262f40' : 'linear-gradient(135deg, #ff7700, #ff4624)'}; color:${userHistory ? '#00e676' : '#fff'}; padding:12px; font-size:14px; box-shadow:${userHistory ? 'none' : '0 4px 20px var(--primary-glow)'}; cursor:${userHistory ? 'default' : 'pointer'};">
        ${userHistory ? '✓ ' + escapeHTML(userHistory.reward_name) + ' CLAIMED TODAY' : 'SPIN NOW'}
      </button>
    </div>
  `;

  if (userHistory) {
    startCountdownTimer();
  }
}

export function startCountdownTimer() {
  if (window._spinCountdownInterval) clearInterval(window._spinCountdownInterval);
  
  window._spinCountdownInterval = setInterval(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    
    const diff = tomorrow - now;
    if (diff <= 0) {
      clearInterval(window._spinCountdownInterval);
      const el = document.getElementById('countdown-timer-text');
      if (el) el.innerHTML = `• <strong>NEXT SPIN AVAILABLE NOW!</strong>`;
      return;
    }
    
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const el = document.getElementById('countdown-timer-text');
    if (el) {
      el.innerHTML = `• <strong>NEXT SPIN IN: ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s</strong>`;
    }
  }, 1000);
}

export async function triggerDailySpin() {
  const btn = document.getElementById('wheel-center-btn');
  const btnNow = document.getElementById('btn-spin-now');
  if (btn) btn.disabled = true;
  if (btnNow) btnNow.disabled = true;

  Sound.playSpinVoice();
  Loader.show("Processing spin securely...");
  
  let res;
  try {
    res = await sbClient.rpc('spin_daily_reward');
  } catch (err) {
    Loader.hide();
    Toast.show("Connection error during spin.", "error");
    if (btn) btn.disabled = false;
    if (btnNow) btnNow.disabled = false;
    return;
  }
  
  Loader.hide();

  const data = res.data;
  const error = res.error;

  if (error) {
    Toast.show(error.message || "Spin error occurred.", "error");
    if (btn) btn.disabled = false;
    if (btnNow) btnNow.disabled = false;
    return;
  }

  if (!data || !data.success) {
    Toast.show(data?.message || "You have already spun today!", "info");
    renderDailySpin();
    return;
  }

  const slotNum = data.slot_number || 1;
  const degreesPerSlot = 360 / 8;
  const slotIndex = slotNum - 1;

  const segmentCenterAngle = (slotIndex * degreesPerSlot) + 22.5;
  const svgOffset = -22.5;
  const normalizedTarget = ((270 - segmentCenterAngle - svgOffset) % 360 + 360) % 360;
  
  const currentRot = window._currentWheelRotation || 0;
  const fullSpans = 360 * 5;
  const extra = (normalizedTarget - (currentRot % 360) + 360) % 360;
  const targetDegree = currentRot + fullSpans + extra;
  window._currentWheelRotation = targetDegree;
  
  const wheel = document.getElementById('wheel-element');
  const successMessage = data.message || "Reward claimed successfully!";

  if (wheel) {
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${currentRot}deg)`;
    void wheel.offsetWidth;
    
    wheel.style.transition = 'transform 4s cubic-bezier(0.15, 0.95, 0.15, 1)';
    wheel.style.transform = `rotate(${targetDegree}deg)`;

    setTimeout(async () => {
      Sound.playRewardVoice();
      Toast.show(successMessage, "success");
      await syncAuthAndProfile();
      renderDailySpin();
    }, 4200);
  } else {
    Sound.playRewardVoice();
    Toast.show(successMessage, "success");
    await syncAuthAndProfile();
    renderDailySpin();
  }
}
