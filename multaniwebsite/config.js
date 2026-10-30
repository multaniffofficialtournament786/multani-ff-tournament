// ==========================================
// MULTANI FF OFFICIAL - CONFIGURATION
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
// SAFE GLOBAL LOADER
// ==========================================

let loaderTimeout = null;

export const Loader = {

  show(text = "Loading...") {
    try {
      const loader =
        document.getElementById('global-loader');

      const loaderText =
        document.getElementById('global-loader-text');

      if (loaderText) {
        loaderText.innerText = text;
      }

      if (loader) {
        loader.classList.remove('hidden');
      }

      if (loaderTimeout) {
        clearTimeout(loaderTimeout);
        loaderTimeout = null;
      }

      // Safety fallback: never leave loader stuck forever
      loaderTimeout = setTimeout(() => {
        this.hide();
        console.warn("Loader safety timeout activated.");
      }, 20000);

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

      const loader =
        document.getElementById('global-loader');

      if (loader) {
        loader.classList.add('hidden');
      }

      const oldSplash =
        document.getElementById('mff-vip-splash');

      if (oldSplash) {
        oldSplash.remove();
      }

    } catch (error) {
      console.error("Loader hide error:", error);
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
