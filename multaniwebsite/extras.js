import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

const APK_DOWNLOAD_URL = "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

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

  const winnersListHtml = winners.length ? winners.map((w) => {
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
// 2. LEADERBOARD PAGE (PODIUM + NO DEPOSIT SHOWN)
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
      .limit(30);
    topPlayers = data || [];
  } catch (e) {
    console.error("Leaderboard load error:", e);
  }
  Loader.hide();

  const p1 = topPlayers[0] || null;
  const p2 = topPlayers[1] || null;
  const p3 = topPlayers[2] || null;

  const defaultAvatar = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';

  let podiumHtml = '';
  if (p1 || p2 || p3) {
    podiumHtml = `
      <div style="background:linear-gradient(180deg, rgba(25, 30, 42, 0.95), rgba(13, 16, 24, 0.95)); border:1px solid #232c3d; border-radius:18px; padding:20px 10px 16px 10px; margin-bottom:18px; position:relative;">
        <div style="font-family:var(--font-gaming); font-size:15px; font-weight:800; color:#ffb703; text-transform:uppercase; letter-spacing:1px; margin-bottom:18px; display:flex; align-items:center; gap:6px;">
          <span>👑</span> HALL OF FAME LEADERBOARD
        </div>

        <div style="display:flex; justify-content:space-around; align-items:flex-end; gap:8px;">
          <!-- RANK #2 (LEFT) -->
          <div style="display:flex; flex-direction:column; align-items:center; width:30%; text-align:center;">
            <div style="position:relative; margin-bottom:6px;">
              <img src="${p2?.avatar_url || defaultAvatar}" class="vip-frame-2" style="width:58px; height:58px; object-fit:cover;" />
              <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#00f0ff; color:#000; font-family:var(--font-gaming); font-size:10px; font-weight:800; padding:1px 6px; border-radius:10px; box-shadow:0 0 8px #00f0ff;">#2</span>
            </div>
            <div style="font-family:var(--font-gaming); font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90px;">${escapeHTML(p2?.free_fire_name || 'Runner Up')}</div>
            <div style="font-family:var(--font-gaming); font-size:11px; font-weight:800; color:#00f0ff;">PKR ${p2?.total_won ? Number(p2.total_won).toLocaleString() : '0'}</div>
          </div>

          <!-- RANK #1 (CENTER - ELEVATED) -->
          <div style="display:flex; flex-direction:column; align-items:center; width:36%; text-align:center; transform:translateY(-10px);">
            <div style="position:relative; margin-bottom:6px;">
              <div style="font-size:22px; line-height:1; filter:drop-shadow(0 0 6px #ffbe00);">👑</div>
              <img src="${p1?.avatar_url || defaultAvatar}" class="vip-frame-1" style="width:72px; height:72px; object-fit:cover;" />
              <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#ffbe00; color:#000; font-family:var(--font-gaming); font-size:11px; font-weight:800; padding:1px 8px; border-radius:10px; box-shadow:0 0 10px #ffbe00;">#1</span>
            </div>
            <div style="font-family:var(--font-gaming); font-size:14px; font-weight:800; color:#ffbe00; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${escapeHTML(p1?.free_fire_name || 'Champion')}</div>
            <div style="font-family:var(--font-gaming); font-size:13px; font-weight:800; color:#ffea75;">PKR ${p1?.total_won ? Number(p1.total_won).toLocaleString() : '0'}</div>
          </div>

          <!-- RANK #3 (RIGHT) -->
          <div style="display:flex; flex-direction:column; align-items:center; width:30%; text-align:center;">
            <div style="position:relative; margin-bottom:6px;">
              <img src="${p3?.avatar_url || defaultAvatar}" class="vip-frame-3" style="width:58px; height:58px; object-fit:cover;" />
              <span style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); background:#ff7700; color:#fff; font-family:var(--font-gaming); font-size:10px; font-weight:800; padding:1px 6px; border-radius:10px; box-shadow:0 0 8px #ff7700;">#3</span>
            </div>
            <div style="font-family:var(--font-gaming); font-size:12px; font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:90px;">${escapeHTML(p3?.free_fire_name || 'Elite')}</div>
            <div style="font-family:var(--font-gaming); font-size:11px; font-weight:800; color:#ff9800;">PKR ${p3?.total_won ? Number(p3.total_won).toLocaleString() : '0'}</div>
          </div>
        </div>
      </div>
    `;
  }

  const rankRows = topPlayers.length ? topPlayers.map((p, i) => {
    const avatar = p.avatar_url || defaultAvatar;
    let rankColor = '#8e9bb0';
    if (i === 0) rankColor = '#ffbe00';
    else if (i === 1) rankColor = '#00f0ff';
    else if (i === 2) rankColor = '#ff7700';

    return `
      <div class="tx-item" style="border:1px solid #1f2737; background:#121622; border-radius:12px; padding:10px 14px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-family:var(--font-gaming); font-size:16px; font-weight:800; color:${rankColor}; width:28px; text-align:left;">#${i + 1}</span>
          <img src="${avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:1.5px solid ${rankColor};" />
          <div>
            <h4 style="color:#fff; font-size:13px; font-weight:700; line-height:1.2;">${escapeHTML(p.free_fire_name || 'Warrior')}</h4>
            <span style="font-size:10px; color:#6b788e;">UID: ${escapeHTML(p.free_fire_uid || '--')}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px; font-family:var(--font-gaming); font-weight:800; color:#00e676;">Won: PKR ${Number(p.total_won || 0).toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('') : '<p style="text-align:center; color:var(--text-dim); padding:20px; font-size:12px;">No ranked players yet.</p>';

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      ${podiumHtml}
      <div class="section-title" style="margin-bottom:12px;">
        <span>ALL PLAYER RANKINGS (${topPlayers.length})</span>
      </div>
      <div>${rankRows}</div>
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
// 4. INVITE & EARN (EXACT DESIGN MATCH)
// ==========================================
export async function renderInvite() {
  if (!state.currentUser) { window.Router.navigate('login'); return; }
  await syncAuthAndProfile();

  const p = state.currentProfile || {};
  const myUid = p.free_fire_uid || state.currentUser.id.slice(0, 8);

  // Referral counts (Safe fallbacks)
  let referralCount = 0;
  try {
    const { count } = await sbClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', myUid);
    referralCount = count || 0;
  } catch (err) {
    console.warn("Referral count fetch:", err);
  }

  const shareText = `🔥 Join Multani FF Tournaments & Win Real Cash! Download App: ${APK_DOWNLOAD_URL}\n\nUse my Referral UID: *${myUid}* when registering!`;

  window.toggleInvitedListDropdown = () => {
    const list = document.getElementById('invited-list-body');
    const arrow = document.getElementById('invited-list-arrow');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  };

  window.shareInviteAppNative = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Multani FF Tournament App',
        text: shareText,
        url: APK_DOWNLOAD_URL
      }).catch(() => {});
    } else {
      window.openShareModal();
    }
  };

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <!-- TOP INCOME & STATS CARD -->
      <div style="background:#121622; border:1px solid #232c3d; border-radius:16px; padding:20px 16px; text-align:center; margin-bottom:14px;">
        <div style="font-family:var(--font-gaming); font-size:11px; font-weight:800; color:#ffbe00; letter-spacing:1px; text-transform:uppercase;">TODAY'S INCOME</div>
        <div style="font-family:var(--font-gaming); font-size:36px; font-weight:800; color:#fff; margin:4px 0 16px 0;">Rs 0.00</div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div style="background:#0c0f17; border:1px solid #1c2333; border-radius:10px; padding:10px;">
            <div style="font-size:11px; color:#8e9bb0;">Registers</div>
            <div style="font-family:var(--font-gaming); font-size:20px; font-weight:800; color:#00e676; margin-top:2px;">${referralCount}</div>
          </div>
          <div style="background:#0c0f17; border:1px solid #1c2333; border-radius:10px; padding:10px;">
            <div style="font-size:11px; color:#8e9bb0;">Valid Referral</div>
            <div style="font-family:var(--font-gaming); font-size:20px; font-weight:800; color:#00e676; margin-top:2px;">0</div>
          </div>
        </div>
      </div>

      <!-- SHARE APP WITH FRIENDS CARD -->
      <div style="background:#121622; border:1px solid #232c3d; border-radius:16px; padding:16px; margin-bottom:14px;">
        <div style="font-family:var(--font-gaming); font-size:13px; font-weight:800; color:#fff; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px;">SHARE APP WITH FRIENDS</div>

        <div style="background:#0c0f17; border:1px solid #1c2333; border-radius:10px; padding:6px 8px 6px 12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:8px;">
          <div style="font-size:11px; color:#8e9bb0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${APK_DOWNLOAD_URL}</div>
          <button onclick="navigator.clipboard.writeText('${APK_DOWNLOAD_URL}'); Toast.show('Download link copied!', 'success');" style="background:#ff4624; border:none; color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; flex-shrink:0;">
            <i class="fa-solid fa-copy"></i>
          </button>
        </div>

        <button onclick="window.shareInviteAppNative()" style="width:100%; background:#00c853; color:#fff; border:none; padding:13px; border-radius:10px; font-family:var(--font-gaming); font-size:15px; font-weight:800; letter-spacing:0.5px; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; box-shadow:0 4px 15px rgba(0, 200, 83, 0.35);">
          <i class="fa-solid fa-share-nodes"></i> SHARE APP CHOOSE APP
        </button>
      </div>

      <!-- INVITED LIST ACCORDION -->
      <div style="background:#121622; border:1px solid #232c3d; border-radius:12px; margin-bottom:16px; overflow:hidden;">
        <div onclick="window.toggleInvitedListDropdown()" style="padding:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <div style="font-family:var(--font-gaming); font-size:13px; font-weight:800; color:#ffbe00; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-users"></i> INVITED LIST (${referralCount})
          </div>
          <i id="invited-list-arrow" class="fa-solid fa-chevron-down" style="color:#ffbe00; font-size:12px; transition:transform 0.3s ease;"></i>
        </div>
        <div id="invited-list-body" style="display:none; padding:12px 14px; border-top:1px solid #1c2333; font-size:12px; color:#8e9bb0; background:#0c0f17;">
          ${referralCount === 0 ? 'No players registered with your UID yet.' : `Total ${referralCount} player(s) joined.`}
        </div>
      </div>

      <!-- REFERRAL MILESTONE REWARDS -->
      <div style="margin-bottom:18px;">
        <div style="font-family:var(--font-gaming); font-size:14px; font-weight:800; color:#ffbe00; display:flex; align-items:center; gap:6px; margin-bottom:12px;">
          <span>🎁</span> REFERRAL MILESTONE REWARDS
        </div>

        <!-- ELITE MEMBERSHIP CARD -->
        <div style="background:#121622; border:1px solid #232c3d; border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div>
            <h4 style="color:#fff; font-size:13px; font-weight:700;">Elite Membership - Weekly</h4>
            <div style="font-size:11px; color:#00f0ff; margin-top:2px;">Required: <strong style="color:#fff;">20</strong> Referrals</div>
          </div>
          <button disabled style="background:#1b2333; color:#78869e; border:1px solid #29344c; padding:8px 14px; border-radius:8px; font-family:var(--font-gaming); font-size:12px; font-weight:800; text-align:center;">
            LOCKED<br><span style="font-size:10px; font-weight:500;">(${referralCount}/20)</span>
          </button>
        </div>

        <!-- WEEKLY MEMBERSHIP CARD -->
        <div style="background:#121622; border:1px solid #232c3d; border-radius:14px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h4 style="color:#fff; font-size:13px; font-weight:700;">Weekly Membership</h4>
            <div style="font-size:11px; color:#00f0ff; margin-top:2px;">Required: <strong style="color:#fff;">40</strong> Referrals</div>
          </div>
          <button disabled style="background:#1b2333; color:#78869e; border:1px solid #29344c; padding:8px 14px; border-radius:8px; font-family:var(--font-gaming); font-size:12px; font-weight:800; text-align:center;">
            LOCKED<br><span style="font-size:10px; font-weight:500;">(${referralCount}/40)</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 5. RULES (A TO Z) - 10 ACCORDION DROPDOWNS
// ==========================================
export function renderRules() {
  window.toggleAppRuleItem = (id) => {
    const item = document.getElementById(`rule-item-${id}`);
    const arrow = document.getElementById(`rule-arrow-${id}`);
    if (!item) return;

    const isOpen = item.style.display === 'block';
    item.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  };

  const rulesData = [
    {
      id: 1,
      title: "1. Free Fire Tournament & Custom Room Rules",
      icon: "🏆",
      points: [
        "Room ID aur Password match shuru hone se theek 10 se 15 minute pehle match details page par show hoga.",
        "Kisi bhi qisam ke Hacks, Auto-Aim, Config files, Panel ya PC/Emulator ka istemal 100% mana hai. Pakde jane par prize cancel aur permanent ban lagega.",
        "Custom room mein slot exchange karna, teaming karna ya match chhod kar bhagna sakht mana hai.",
        "Match jeetne ke foran baad Booyah aur Total Kills ka clear screenshot Support Chat par bhejna lazmi hai."
      ]
    },
    {
      id: 2,
      title: "2. Mini Games & Gameplay Rules",
      icon: "🎮",
      points: [
        "Tamam mini games ko genuine tareeqe se khelna lazmi hai. Auto-clicker ya bot software use karna mana hai.",
        "Games ke scores aur active playtime aapke profile dashboard par automatically record hote hain.",
        "Game khelte waqt phone screen active aur internet stable hona chahiye taake points save ho sakein."
      ]
    },
    {
      id: 3,
      title: "3. Daily Missions & Rewards Rules",
      icon: "🎯",
      points: [
        "Tamam daily missions rozana raat 12:00 AM (Pakistan Standard Time) par reset ho jate hain.",
        "10 alag alag games khelna aur har game ko kam az kam 30 second tak active khelna lazmi hai.",
        "Pura 1 ghanta (60 minutes) games khelne ka timer tabhi count hoga jab screen on aur game active rahegi.",
        "Jab chaaron basic missions claim ho jayenge tabhi 2 Coins ka Extra Bonus button unlock hoga."
      ]
    },
    {
      id: 4,
      title: "4. Daily Spin Wheel Rules (Non-Withdrawable Coins)",
      icon: "🎡",
      points: [
        "Har user ko har 24 ghante baad sirf 1 muft (free) spin wheel chance diya jata hai.",
        "Spin Wheel se jeete gaye coins ko DIRECT CASHOUT YA WITHDRAW NAHI KIYA JA SAKTA.",
        "Spin coins sirf Free Fire Diamonds khareedne ya Tournament matches ki entry fee ada karne ke liye use honge.",
        "Multiple fake accounts bana kar spin karne par device permanently block kar di jayegi."
      ]
    },
    {
      id: 5,
      title: "5. Community Chat Room Rules (Strict Anti-Abuse)",
      icon: "💬",
      points: [
        "No Abuse Policy: Chat room mein kisi bhi player ya admin ke khilaf gaali galoch, badtameezi ya behooda baatein sakhti se mana hain.",
        "Pehli dafa gaali dene par 24 ghante ka chat mute/ban aur doosri dafa direct permanent account ban hoga.",
        "Chat mein kisi doosri app, website, WhatsApp group ya social media ki link/promotion share karna strictly prohibited hai.",
        "Room ID, match issue ya payment dispute ke liye public chat mein behas karne ke bajaye direct Support Desk (🎧) par contact karein."
      ]
    },
    {
      id: 6,
      title: "6. Deposit & Wallet Money Rules",
      icon: "💳",
      points: [
        "Sirf app ke Deposit page par diye gaye official Easypaisa, JazzCash ya SadaPay number par raqam transfer karein.",
        "Payment bhejte hi Transaction ID (TID) aur clear receipt ka screenshot form mein upload karna lazmi hai.",
        "Fake, edited ya duplicate screenshot submit karne par account foran freeze kar diya jayega.",
        "Payment confirmation aur wallet balance add hone ka normal time 5 se 15 minute hai."
      ]
    },
    {
      id: 7,
      title: "7. Withdrawal / Cashout Rules",
      icon: "💸",
      points: [
        "Cashout sirf tournaments ki winnings aur genuine balance ka hoga (Spin wheel coins withdraw nahi honge).",
        "Minimum withdrawal limit poori hona lazmi hai aur account holder ka naam aur number 100% sahi hona chahiye.",
        "Ek waqt mein ek hi withdrawal request process hoti hai. Purani request complete hone ke baad doosri lagayein.",
        "Withdrawal aam taur par 1 se 6 ghante ke andar direct Easypaisa/JazzCash account mein send kar diya jata hai."
      ]
    },
    {
      id: 8,
      title: "8. Buy Free Fire Diamonds Rules",
      icon: "💎",
      points: [
        "Diamonds khareedte waqt apna Free Fire Player UID bilkul sahi darj karein.",
        "Ghalat UID daalne ki soorat mein kisi doosre account mein diamond chale jane par administration zimmedar nahi hogi.",
        "Diamonds order verify hone ke 10 se 30 minute ke andar direct game account mein top-up deliver ho jata hai."
      ]
    },
    {
      id: 9,
      title: "9. Invite Friends & Referral Rewards Rules",
      icon: "👥",
      points: [
        "Dost ko sign up karwate waqt referral box mein aapka UID darj karwana zaroori hai.",
        "Referral commission tab activate hoga jab aapka invite kiya gaya player kam az kam ek paid tournament match join karega.",
        "Fake referral accounts banane par commission cancel aur account restrict kar diya jayega.",
        "Elite Membership (20 referrals) aur Weekly Membership (40 referrals) complete hote hi reward claim kar sakte hain."
      ]
    },
    {
      id: 10,
      title: "10. Fair Play Policy & VIP Protocol",
      icon: "🛡️",
      points: [
        "Ek device par sirf ek hi genuine player account allowed hai.",
        "App ke andar kisi bhi bug ya glitch ka faida uthana strict ban ka sabab banega.",
        "VIP Glowing Frames aur badges un players ko diye jaate hain jo fair play ke sath top tournament rankings maintain rakhte hain."
      ]
    }
  ];

  const rulesListHtml = rulesData.map(r => `
    <div style="background:#121622; border:1px solid #232c3d; border-radius:12px; margin-bottom:10px; overflow:hidden;">
      <div onclick="window.toggleAppRuleItem(${r.id})" style="padding:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#161c2b;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">${r.icon}</span>
          <span style="font-family:var(--font-gaming); font-size:13px; font-weight:800; color:#ffbe00; letter-spacing:0.5px;">${r.title}</span>
        </div>
        <i id="rule-arrow-${r.id}" class="fa-solid fa-chevron-down" style="color:#ffbe00; font-size:12px; transition:transform 0.3s ease;"></i>
      </div>
      <div id="rule-item-${r.id}" style="display:none; padding:14px; background:#0c0f17; border-top:1px solid #1c2333;">
        <ul style="padding-left:18px; margin:0; font-size:12px; color:#c7cbd1; line-height:1.7;">
          ${r.points.map(p => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="section-title" style="margin-bottom:14px;">
        <span>📜 RULES & REGULATIONS (A TO Z)</span>
      </div>
      <div>${rulesListHtml}</div>
    </div>
  `;
}

// ==========================================
// 6. ABOUT US PAGE
// ==========================================
export function renderAbout() {
  document.getElementById('app-view').innerHTML = `
    <div class="view-container" style="text-align:center;">
      <div class="player-hero-card" style="padding:20px;">
        <h2 style="font-family:var(--font-gaming); font-size:24px; color:var(--accent-cyan); margin-bottom:6px;">MULTANI FF OFFICIAL</h2>
        <p style="font-size:12px; color:var(--text-muted); margin-bottom:14px;">Pakistan's #1 Free Fire Esports & Custom Room Platform.</p>
        <div style="font-size:12px; color:#c7cbd1; line-height:1.7; text-align:left; background:rgba(0,0,0,0.3); padding:12px; border-radius:10px;">
          Multani FF Official delivers a fair, automated, and secure competitive environment for Free Fire players across Pakistan. Experience instant automated payouts, transparent leaderboard rankings, verified custom rooms, and daily rewards directly on your smartphone.
        </div>
      </div>
    </div>
  `;
}
