import { sbClient, state, APK_DOWNLOAD_LINK, escapeHTML } from './config.js';

let autoScrollInterval = null;

// Cache Helper Functions
function getCachedHomeData() {
  try {
    const raw = localStorage.getItem('mff_home_cache');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCachedHomeData(tutorials, ticker) {
  try {
    localStorage.setItem('mff_home_cache', JSON.stringify({
      tutorials: tutorials || [],
      ticker: ticker || "",
      cachedAt: Date.now()
    }));
  } catch (e) {}
}

export async function renderHome() {
  // 1. Local Cache check karein
  const cached = getCachedHomeData();
  let siteTutorialsList = cached ? cached.tutorials : [];
  
  if (cached && cached.ticker && !state.siteSettings.announcement_ticker) {
    state.siteSettings.announcement_ticker = cached.ticker;
  }

  // 2. FORAN RENDER KAREIN (Screen bilkul black/blank nahi rahegi)
  drawHomeUI(siteTutorialsList);

  // 3. BACKGROUND FETCH (Slow internet par screen rokay baghair naya data laye ga)
  fetchFreshHomeData();
}

async function fetchFreshHomeData() {
  try {
    const [settingsRes, tourRes, tutRes] = await Promise.all([
      sbClient.from('site_settings').select('*'),
      sbClient.from('tournaments').select('*').order('created_at', { ascending: false }),
      sbClient.from('site_tutorials').select('*').order('created_at', { ascending: false })
    ]);

    let updatedTicker = state.siteSettings.announcement_ticker;
    if (settingsRes.data && settingsRes.data.length > 0) {
      const sRow = settingsRes.data[0];
      updatedTicker = sRow.ticker_text || "";
      state.siteSettings.announcement_ticker = updatedTicker;
    }

    state.activeTournaments = tourRes.data || [];
    const freshTutorials = tutRes.data || [];

    // Cache save karein future ke liye
    setCachedHomeData(freshTutorials, updatedTicker);

    // Agar user abhi bhi Home page par hai to smoothly UI sync kar dein
    const view = document.getElementById('app-view');
    if (view && window.location.hash === '#home' || !window.location.hash || window.location.hash === '#') {
      drawHomeUI(freshTutorials);
    }
  } catch (e) {
    console.error("Home background fetch error:", e);
  }
}

function drawHomeUI(siteTutorialsList = []) {
  const p = state.currentProfile || { free_fire_name: "Guest Player", free_fire_uid: "Tap to Login", wallet_balance: 0, total_won: 0, total_matches: 0, phone: "" };
  const displayName = p.free_fire_name || p.full_name || (state.currentUser ? 'Soldier' : 'Guest Player');
  const displayUid = p.free_fire_uid || (state.currentUser ? 'Not Set' : 'Tap to Login');
  const displayPhone = p.phone || 'No WhatsApp added';

  const tickerText = state.siteSettings.announcement_ticker || "🔥 WELCOME TO MULTANI FF OFFICIAL TOURNAMENT • BOOYAH PRIZES APPLIED • FAIR PLAY MANDATORY • DAILY MATCHES & INSTANT CASHOUTS!";

  let tutorialsHtml = '';
  if (siteTutorialsList.length > 0) {
    tutorialsHtml = `
      <div id="tutorials-scroll-box" style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; margin-bottom: 14px; scroll-behavior: smooth;">
        ${siteTutorialsList.map(item => {
          const platformName = item.platform || 'YouTube';
          let btnText = "WATCH";
          let btnBg = "linear-gradient(135deg, #ff5733, #e62200)";
          let platformIconClass = "fa-brands fa-youtube";
          let platformColor = "#ff1744";

          if (platformName === 'TikTok') { 
            btnText = "WATCH"; 
            btnBg = "linear-gradient(135deg, #00f0ff, #0077ff)"; 
            platformIconClass = "fa-brands fa-tiktok";
            platformColor = "#00f0ff";
          } else if (platformName === 'Facebook') { 
            btnText = "WATCH"; 
            btnBg = "linear-gradient(135deg, #1877f2, #0d53c7)"; 
            platformIconClass = "fa-brands fa-facebook-f";
            platformColor = "#1877f2";
          } else if (platformName === 'Instagram') { 
            btnText = "WATCH"; 
            btnBg = "linear-gradient(135deg, #833ab4, #fd1d1d)"; 
            platformIconClass = "fa-brands fa-instagram";
            platformColor = "#fd1d1d";
          } else if (platformName === 'WhatsApp') {
            platformIconClass = "fa-brands fa-whatsapp";
            platformColor = "#00e676";
          }

          const bgImgStyle = item.photo_url ? `background-image: url('${item.photo_url}');` : '';
          const line1 = item.line_1 || 'COMPLETE STEP-BY-STEP WEBSITE GUIDE';
          const line2 = item.line_2 || 'Tap below to watch complete step-by-step guidance.';

          return `
            <div class="screenshot-card" style="min-width: 310px; flex: 1; margin-bottom: 0; ${bgImgStyle}">
              <div class="screenshot-card-header">
                <div class="screenshot-card-logo" style="background:${platformColor};"><i class="${platformIconClass}"></i></div>
                <span class="screenshot-brand-text">MULTANI FF TOURNAMENT APP</span>
              </div>
              <div class="screenshot-title">${escapeHTML(item.title)}</div>
              <div class="screenshot-subtitle">${escapeHTML(line1)}</div>
              
              <div style="margin-bottom: 14px;">
                <p style="font-size:11px; color:#ffffff; font-weight:700; line-height:1.4; text-shadow: 0 1px 4px rgba(0,0,0,0.98);">${escapeHTML(line2)}</p>
              </div>

              <a href="${item.link || '#'}" target="_blank" class="btn btn-primary" style="background: ${btnBg}; padding: 11px; font-size: 14px;">
                <i class="fa-solid fa-play"></i> ${btnText}
              </a>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const view = document.getElementById('app-view');
  if (!view) return;

  view.innerHTML = `
    <div class="view-container">
      <div class="led-signboard">
        <i class="fa-solid fa-bolt"></i>
        <div class="ticker-viewport">
          <div class="ticker-content">${escapeHTML(tickerText)}</div>
        </div>
      </div>

      <!-- PROFILE CARD ON TOP -->
      ${!state.currentUser ? `
        <div class="player-hero-card" style="border: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="color:var(--text-main); font-family:var(--font-gaming); font-size:18px;">JOIN THE BATTLE</h3>
            <p style="font-size:11px; color:var(--text-muted);">Sign up to participate & win real cash prizes</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window.Router.navigate('login')">LOGIN</button>
        </div>
      ` : `
        <div class="player-hero-card">
          <div class="hero-profile-row">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="${p.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80'}" class="hero-avatar" />
              <div class="hero-details">
                <h2>${escapeHTML(displayName)}</h2>
                <span class="uid-tag"><i class="fa-solid fa-gamepad"></i> UID: ${escapeHTML(displayUid)}</span>
                <div style="font-size: 11px; color: var(--success); margin-top: 2px; font-weight: 600;">
                  <i class="fa-brands fa-whatsapp"></i> ${escapeHTML(displayPhone)}
                </div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button onclick="window.hardRefreshApp()" title="Refresh App" style="width:34px; height:34px; border-radius:50%; background:rgba(0,240,255,0.15); border:1px solid var(--accent-cyan); color:var(--accent-cyan); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:var(--transition);">
                <i class="fa-solid fa-rotate text-xs"></i>
              </button>
            </div>
          </div>
          <div class="hero-stats-grid">
            <div class="stat-box"><span class="stat-label">Balance</span><span class="stat-val gold">PKR ${p.wallet_balance || 0}</span></div>
            <div class="stat-box"><span class="stat-label">Won</span><span class="stat-val green">PKR ${p.total_won || 0}</span></div>
            <div class="stat-box"><span class="stat-label">Matches</span><span class="stat-val">${p.total_matches || 0}</span></div>
          </div>
        </div>
      `}

      <!-- DOWNLOAD OFFICIAL APP BUTTON -->
      <div style="margin-bottom: 16px;">
        <a href="${APK_DOWNLOAD_LINK}" target="_blank" class="btn btn-primary" style="padding: 12px 16px; font-size: 15px; background: linear-gradient(135deg, #00f0ff, #0077ff); color: #000; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 240, 255, 0.3);">
          <i class="fa-solid fa-cloud-arrow-down" style="font-size: 18px;"></i> DOWNLOAD OFFICIAL APP
        </a>
      </div>

      <!-- CATEGORY CIRCLES -->
      <div class="category-scroll-container">
        <div class="cat-item" onclick="window.Router.navigate('spin')">
          <div class="cat-circle" style="border-color:var(--accent-gold);"><i class="fa-solid fa-dharmachakra" style="color:var(--accent-gold)"></i></div>
          <span class="cat-label">Daily Spin</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('tournaments')">
          <div class="cat-circle"><i class="fa-solid fa-trophy"></i></div>
          <span class="cat-label">Matches</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('withdrawal')">
          <div class="cat-circle" style="border-color:var(--accent-cyan);"><i class="fa-solid fa-money-bill-transfer" style="color:var(--accent-cyan)"></i></div>
          <span class="cat-label">Withdraw</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('deposit')">
          <div class="cat-circle"><i class="fa-solid fa-circle-arrow-down" style="color:var(--accent-cyan)"></i></div>
          <span class="cat-label">Add Cash</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('diamonds')">
          <div class="cat-circle" style="border-color:var(--accent-gold);"><i class="fa-solid fa-gem" style="color:var(--accent-gold)"></i></div>
          <span class="cat-label">Diamonds</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('winners')">
          <div class="cat-circle" style="border-color:var(--accent-gold);"><i class="fa-solid fa-medal" style="color:var(--accent-gold)"></i></div>
          <span class="cat-label">Winners</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('wallet')">
          <div class="cat-circle"><i class="fa-solid fa-wallet" style="color:var(--primary)"></i></div>
          <span class="cat-label">Wallet</span>
        </div>
        <div class="cat-item" onclick="window.Router.navigate('leaderboard')">
          <div class="cat-circle"><i class="fa-solid fa-ranking-star" style="color:#ff0055"></i></div>
          <span class="cat-label">Top List</span>
        </div>
      </div>

      <!-- CAROUSEL / ADS -->
      ${tutorialsHtml}

      <div class="social-footer">
        <p>Connect With Us</p>
        <div class="social-icons-row">
          <a href="https://whatsapp.com/channel/0029Vb9CdLqHbFV9Q7mBEB1v" target="_blank" class="social-icon-btn whatsapp">
            <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp
          </a>
          <a href="https://www.tiktok.com/@multani.ff.gaming" target="_blank" class="social-icon-btn tiktok">
            <i class="fa-brands fa-tiktok text-sm"></i> TikTok
          </a>
          <a href="https://youtube.com/@multaniff-b2k?si=ZSI9KImSRvDH8U17" target="_blank" class="social-icon-btn youtube">
            <i class="fa-brands fa-youtube text-sm"></i> YouTube
          </a>
        </div>
      </div>
    </div>
  `;

  startAnnouncementTicker();
  setupTutorialsAutoScroll();
}

export function startAnnouncementTicker() {
  setTimeout(() => {
    const content = document.querySelector('.ticker-content');
    if (content) {
      const textLength = content.innerText.length;
      const duration = Math.max(15, textLength * 0.18);
      content.style.animationDuration = duration + 's';
      content.classList.add('active');
    }
  }, 2000);
}

export function setupTutorialsAutoScroll() {
  if (autoScrollInterval) clearInterval(autoScrollInterval);
  const container = document.getElementById('tutorials-scroll-box');
  if (!container) return;

  autoScrollInterval = setInterval(() => {
    if (!document.body.contains(container)) {
      clearInterval(autoScrollInterval);
      return;
    }
    const cardWidth = container.querySelector('.screenshot-card')?.offsetWidth || 320;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    
    if (container.scrollLeft >= maxScrollLeft - 10) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: cardWidth + 12, behavior: 'smooth' });
    }
  }, 4500);
}
