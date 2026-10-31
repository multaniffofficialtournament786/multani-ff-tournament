// ==========================================
// MULTANI FF OFFICIAL - CONFIGURATION
// SAFE UPDATED VERSION WITH VIP SPLASH LOADER
// ==========================================

// Supabase Configuration
export const SUPABASE_URL =
  "https://yzirjidgdxhljbhhjfqp.supabase.co";

export const SUPABASE_ANON_KEY =
  "sb_publishable_-dPl2eQV4afRDarZOR3QGA_RoDvmsX5";

export const APK_DOWNLOAD_LINK =
  "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

// ==========================================
// SUPABASE CLIENT - SAFE INITIALIZATION
// ==========================================

let supabaseClient = null;

try {
  if (!window.supabase?.createClient) {
    throw new Error("Supabase library is not loaded.");
  }

  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

} catch (error) {
  console.error("Supabase initialization error:", error);
}

export const sbClient = supabaseClient;

// ==========================================
// GLOBAL SHARED STATE
// ==========================================

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
// VOICE ANNOUNCER
// ==========================================

class VoiceAnnouncer {

  speakName(extraText = "") {
    try {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const textToSpeak = extraText
        ? `Multani FF Official, ${extraText}`
        : "Multani FF Official";

      const utterance = new SpeechSynthesisUtterance(
        textToSpeak
      );

      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.warn("Voice announcement error:", error);
    }
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

// ==========================================
// TOAST NOTIFICATION ENGINE
// ==========================================

export const Toast = {

  show(msg, type = 'info') {
    try {
      const container =
        document.getElementById('toast-container');

      if (!container) {
        console.warn("Toast container not found:", msg);
        return;
      }

      const toast = document.createElement('div');

      toast.className = `toast-msg toast-${type}`;
      toast.innerText = String(msg);

      container.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 3000);

    } catch (error) {
      console.error("Toast error:", error);
    }
  }
};

// ==========================================
// SAFE HTML ESCAPING
// ==========================================

export function escapeHTML(str) {
  if (str === null || str === undefined) {
    return '';
  }

  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// VIP GLOBAL LOADER (CYBER NEON EDITION)
// ==========================================

let loaderTimeout = null;

function injectVipLoaderStyles() {
  if (document.getElementById('mff-vip-loader-styles')) return;

  const style = document.createElement('style');
  style.id = 'mff-vip-loader-styles';
  style.textContent = `
    #mff-vip-splash {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #071728 0%, #030a13 65%, #010408 100%);
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 45px 20px;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      user-select: none;
    }

    /* VIP Corner Brackets */
    .mff-corner {
      position: absolute;
      width: 24px;
      height: 24px;
      border-color: #00f0ff;
      border-style: solid;
      opacity: 0.9;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.45);
    }
    .mff-top-left { top: 20px; left: 20px; border-width: 3px 0 0 3px; }
    .mff-top-right { top: 20px; right: 20px; border-width: 3px 3px 0 0; }
    .mff-bottom-left { bottom: 20px; left: 20px; border-width: 0 0 3px 3px; }
    .mff-bottom-right { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; }

    /* Center Section */
    .mff-center-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: auto;
      margin-bottom: auto;
    }

    /* 3D Rotating Logo Container */
    .mff-logo-stage {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      perspective: 900px;
      margin-bottom: 24px;
    }

    .mff-outer-ring {
      position: absolute;
      width: 136px;
      height: 136px;
      border-radius: 50%;
      border: 2px dashed rgba(0, 240, 255, 0.45);
      animation: mffRingSpin 9s linear infinite;
    }

    .mff-glow-disc {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, rgba(3, 10, 19, 0.8) 75%);
      box-shadow: 0 0 35px rgba(0, 240, 255, 0.35), inset 0 0 16px rgba(0, 240, 255, 0.45);
    }

    .mff-rotating-coin {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 50%;
      position: relative;
      z-index: 2;
      animation: mffCoinTurn 3.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      box-shadow: 0 0 20px rgba(0, 240, 255, 0.6);
      border: 2px solid rgba(0, 240, 255, 0.5);
    }

    /* Typography */
    .mff-brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: 3px;
      color: #ffffff;
      text-transform: uppercase;
      text-align: center;
      margin: 0;
      text-shadow: 0 0 16px rgba(0, 240, 255, 0.65), 0 2px 4px rgba(0, 0, 0, 0.85);
    }

    .mff-sub-badge {
      display: inline-block;
      margin-top: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #80f0ff;
      text-transform: uppercase;
      opacity: 0.92;
    }

    .mff-divider {
      width: 130px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #00f0ff, transparent);
      margin-top: 14px;
    }

    /* Bottom Loading Bar */
    .mff-bottom-wrap {
      width: 100%;
      max-width: 280px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .mff-status-text {
      color: #a4c1db;
      font-size: 13px;
      letter-spacing: 1px;
      font-weight: 500;
      text-align: center;
    }

    .mff-track-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    .mff-fill-line {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #0072ff, #00f0ff, #70ffe2);
      box-shadow: 0 0 12px #00f0ff;
      border-radius: 10px;
      animation: mffProgressAnim 1.6s ease-in-out infinite;
    }

    /* Keyframes */
    @keyframes mffCoinTurn {
      0% {
        transform: rotateY(0deg);
      }
      50% {
        transform: rotateY(180deg);
      }
      100% {
        transform: rotateY(360deg);
      }
    }

    @keyframes mffRingSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes mffProgressAnim {
      0% { left: -45%; width: 35%; }
      50% { width: 60%; }
      100% { left: 105%; width: 40%; }
    }
  `;
  document.head.appendChild(style);
}

export const Loader = {
  show(text = "Loading the Arena...") {
    try {
      injectVipLoaderStyles();

      let splash = document.getElementById('mff-vip-splash');

      if (!splash) {
        splash = document.createElement('div');
        splash.id = 'mff-vip-splash';
        splash.innerHTML = `
          <div class="mff-corner mff-top-left"></div>
          <div class="mff-corner mff-top-right"></div>
          <div class="mff-corner mff-bottom-left"></div>
          <div class="mff-corner mff-bottom-right"></div>

          <div class="mff-center-wrap">
            <div class="mff-logo-stage">
              <div class="mff-outer-ring"></div>
              <div class="mff-glow-disc"></div>
              <img src="1793357792725.png" alt="Logo" class="mff-rotating-coin" onerror="this.src='./1793357792725.png'" />
            </div>
            <h1 class="mff-brand-title">MULTANI FF</h1>
            <span class="mff-sub-badge">OFFICIAL TOURNAMENT ARENA</span>
            <div class="mff-divider"></div>
          </div>

          <div class="mff-bottom-wrap">
            <span id="mff-loader-text" class="mff-status-text">${escapeHTML(text)}</span>
            <div class="mff-track-bar">
              <div class="mff-fill-line"></div>
            </div>
          </div>
        `;
        document.body.appendChild(splash);
      } else {
        const txtEl = document.getElementById('mff-loader-text');
        if (txtEl) txtEl.innerText = text;
        splash.style.display = 'flex';
      }

      const oldLoader = document.getElementById('global-loader');
      if (oldLoader) oldLoader.classList.remove('hidden');

      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }

      loaderTimeout = setTimeout(() => {
        this.hide();
        console.warn("Loader safety timeout activated.");
      }, 15000);

    } catch (error) {
      console.error("Loader show error:", error);
    }
  },

  hide() {
    try {
      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }

      const splash = document.getElementById('mff-vip-splash');
      if (splash) {
        splash.style.transition = 'opacity 0.35s ease';
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.remove();
        }, 360);
      }

      const oldLoader = document.getElementById('global-loader');
      if (oldLoader) oldLoader.classList.add('hidden');

    } catch (error) {
      console.error("Loader hide error:", error);
    }
  }
};

// ==========================================
// GLOBAL ERROR LOGGING
// ==========================================

window.addEventListener('error', (event) => {
  console.error(
    "Global application error:",
    event.error || event.message
  );
});

window.addEventListener('unhandledrejection', (event) => {
  console.error(
    "Unhandled application promise:",
    event.reason
  );
});
