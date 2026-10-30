// Supabase Configuration
export const SUPABASE_URL = "https://yzirjidgdxhljbhhjfqp.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_-dPl2eQV4afRDarZOR3QGA_RoDvmsX5";
export const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const APK_DOWNLOAD_LINK = "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

// Multani FF Official Logo Path
export const MULTANI_FF_LOGO = "https://raw.githubusercontent.com/multaniffofficialtournament786/multani-ff-tournament/main/multaniwebsite/1793357792725.png";

// Global Shared State
export const state = {
  currentUser: null,
  currentProfile: null,
  siteSettings: {},
  activeTournaments: [],
  userJoinedTournamentIds: new Set(),
  unreadNotifCount: 0,
  unreadChatCount: 0,
  currentTournamentFilter: 'all',
  currentWalletFilter: 'all',
  userMissionState: {
    login: false,
    playedGamesList: [],
    playedSeconds: 0,
    joinedTournament: false,
    claimed: {},
    lastDate: ''
  },
  activeGamePlayTimer: null,
  currentGameSessionStart: null,
  currentGamePlayingUrl: null,
  isWindowActive: true
};

// ==========================================
// VOICE ANNOUNCER: صرف نام بولے گا
// ==========================================
class VoiceAnnouncer {
  speakName(extraText = "") {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // پرانی آواز روک دے

    const textToSpeak = extraText ? `Multani FF Official, ${extraText}` : "Multani FF Official";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    utterance.rate = 1.0;   // بولنے کی رفتار
    utterance.pitch = 1.1;  // آواز کا لہجہ
    utterance.volume = 1.0; // فل والیم
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  }

  playBrandName() {
    this.speakName();
  }

  playSpinVoice() {
    this.speakName("Spin the Wheel");
  }

  playRewardVoice() {
    this.speakName("Reward Claimed");
  }

  playMatchVoice() {
    this.speakName("Match Joined");
  }
}

export const Sound = new VoiceAnnouncer();

// UI Toast Engine
export const Toast = {
  show(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast-msg toast-${type}`;
    t.innerText = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
};

// ==========================================
// VIP GAMING SPLASH LOADER (MULTANI FF ARENA)
// ==========================================
function injectVIPLoaderStyles() {
  if (document.getElementById('mff-loader-styles')) return;
  const style = document.createElement('style');
  style.id = 'mff-loader-styles';
  style.innerHTML = `
    .mff-splash-overlay {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #26170d 0%, #0d0907 60%, #050404 100%);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Rajdhani', sans-serif, system-ui;
      color: #ffffff;
      overflow: hidden;
    }
    .mff-corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #ff6a00;
      border-style: solid;
      pointer-events: none;
    }
    .mff-corner.top-left { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
    .mff-corner.top-right { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
    .mff-corner.bottom-left { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
    .mff-corner.bottom-right { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }

    .mff-dp-wrapper {
      position: relative;
      width: 130px;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 25px;
    }
    .mff-rotate-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid rgba(255, 106, 0, 0.15);
      border-top: 4px solid #ff7b00;
      border-right: 4px solid #ff3c00;
      box-shadow: 0 0 25px rgba(255, 106, 0, 0.45);
      animation: mffSpinDP 2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
    }
    @keyframes mffSpinDP {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .mff-user-dp {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #1a1614;
      background: #111;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
      z-index: 2;
    }
    .mff-loader-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 3px;
      color: #ffffff;
      margin: 0;
      text-transform: uppercase;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
    }
    .mff-loader-subtitle {
      font-size: 11px;
      letter-spacing: 2px;
      color: #ff914d;
      font-weight: 700;
      margin-top: 6px;
      margin-bottom: 50px;
      text-transform: uppercase;
    }
    .mff-loader-bottom {
      position: absolute;
      bottom: 50px;
      width: 80%;
      max-width: 260px;
      text-align: center;
    }
    .mff-loader-status {
      font-size: 12px;
      color: #a8a09b;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    .mff-progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      overflow: hidden;
      position: relative;
    }
    .mff-progress-bar {
      width: 45%;
      height: 100%;
      background: linear-gradient(90deg, #ff3c00, #ff8c00);
      box-shadow: 0 0 10px #ff6a00;
      border-radius: 6px;
      animation: mffProgressAnim 1.6s ease-in-out infinite alternate;
    }
    @keyframes mffProgressAnim {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(230%); }
    }
  `;
  document.head.appendChild(style);
}

export const Loader = {
  show(text = "Loading the Arena...") {
    injectVIPLoaderStyles();

    let overlay = document.getElementById('mff-vip-splash');
    const displayImage = MULTANI_FF_LOGO;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mff-vip-splash';
      overlay.className = 'mff-splash-overlay';
      overlay.innerHTML = `
        <div class="mff-corner top-left"></div>
        <div class="mff-corner top-right"></div>
        <div class="mff-corner bottom-left"></div>
        <div class="mff-corner bottom-right"></div>

        <div class="mff-dp-wrapper">
          <div class="mff-rotate-ring"></div>
          <img src="${displayImage}" class="mff-user-dp" id="mff-splash-dp" alt="Logo" />
        </div>

        <h1 class="mff-loader-title">MULTANI FF ARENA</h1>
        <div class="mff-loader-subtitle">PAKISTAN'S #1 TOURNAMENT ARENA</div>

        <div class="mff-loader-bottom">
          <div class="mff-loader-status" id="mff-splash-status">${text}</div>
          <div class="mff-progress-track">
            <div class="mff-progress-bar"></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      const statusEl = document.getElementById('mff-splash-status');
      if (statusEl) statusEl.innerText = text;
      overlay.style.display = 'flex';
    }

    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    window._vipLoaderTimeout = setTimeout(() => {
      this.hide();
    }, 4500);
  },

  hide() {
    if (window._vipLoaderTimeout) clearTimeout(window._vipLoaderTimeout);
    const overlay = document.getElementById('mff-vip-splash');
    if (overlay) {
      overlay.style.display = 'none';
    }
    // Purana loader agar DOM mein para ho to use bhi chupaye
    const oldLoader = document.getElementById('global-loader');
    if (oldLoader) oldLoader.classList.add('hidden');
  }
};

export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
