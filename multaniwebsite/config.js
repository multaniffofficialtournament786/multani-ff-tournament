// Supabase Configuration
export const SUPABASE_URL = "https://yzirjidgdxhljbhhjfqp.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_-dPl2eQV4afRDarZOR3QGA_RoDvmsX5";
export const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const APK_DOWNLOAD_LINK = "https://www.mediafire.com/file/9rz2av8v75uoo7q/_MULTANI_FF_OFFICIAL_TOURNAMENT_20171925+%281%29.apk/file?dkey=4ejqto951zi&r=1369";

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

  // صرف برانڈ کا نام بولنا
  playBrandName() {
    this.speakName();
  }

  // اسپن وہیل پر بولنا
  playSpinVoice() {
    this.speakName("Spin the Wheel");
  }

  // کوائن یا انعام کلیم پر بولنا
  playRewardVoice() {
    this.speakName("Reward Claimed");
  }

  // ٹورنامنٹ میچ پر بولنا
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

// Global Loader Engine
export const Loader = {
  show(text = "Loading...") {
    const el = document.getElementById('global-loader');
    const txt = document.getElementById('global-loader-text');
    if (txt) txt.innerText = text;
    if (el) el.classList.remove('hidden');
    if (window._loaderTimeout) clearTimeout(window._loaderTimeout);
    window._loaderTimeout = setTimeout(() => {
      this.hide();
    }, 4000);
  },
  hide() {
    if (window._loaderTimeout) clearTimeout(window._loaderTimeout);
    const el = document.getElementById('global-loader');
    if (el) el.classList.add('hidden');
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
