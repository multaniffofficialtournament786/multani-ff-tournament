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

// Voice Announcer
class VoiceAnnouncer {
  speakName(extraText = "") {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const textToSpeak = extraText ? `Multani FF Official, ${extraText}` : "Multani FF Official";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }
  playBrandName() { this.speakName(); }
  playSpinVoice() { this.speakName("Spin the Wheel"); }
  playRewardVoice() { this.speakName("Reward Claimed"); }
  playMatchVoice() { this.speakName("Match Joined"); }
}

export const Sound = new VoiceAnnouncer();

// Toast Engine
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

// Safe Clean Loader
export const Loader = {
  show(text = "Loading...") {
    const el = document.getElementById('global-loader');
    const txt = document.getElementById('global-loader-text');
    if (txt) txt.innerText = text;
    if (el) el.classList.remove('hidden');
    if (window._loaderTimeout) clearTimeout(window._loaderTimeout);
    window._loaderTimeout = setTimeout(() => {
      this.hide();
    }, 3000);
  },
  hide() {
    if (window._loaderTimeout) clearTimeout(window._loaderTimeout);
    const el = document.getElementById('global-loader');
    if (el) el.classList.add('hidden');
    const oldSplash = document.getElementById('mff-vip-splash');
    if (oldSplash) oldSplash.remove();
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
