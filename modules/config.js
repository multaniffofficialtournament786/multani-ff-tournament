// Supabase Client Initialization
export const SUPABASE_URL = "https://yzirjidgdxhljbhhjfqp.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_-dPl2eQV4afRDarZOR3QGA_RoDvmsX5";
export const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Storage
export const state = {
  currentAdmin: null,
  activeChatPlayerId: null,
  chatInterval: null,
  loadedTournamentsList: [],
  currentTournamentFilter: 'all',
  globalAllPlayersCache: [],
  loadedDiamondRequestsList: [],
  currentDiamondFilter: 'all',
  globalSpinHistoryCache: [],
  tournamentsCacheMap: {},
  currentChatSettings: null,
  globalChatMessagesCache: [],
  chatMessagesPage: 0,
  globalMutedPlayersCache: [],
  chatRealtimeChannel: null,
  existingTutorialsCache: [],
  existingReferralsCache: []
};

// Global Helpers
export function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTimeAgo(dateString) {
  if (!dateString) return 'Never active';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeFormatted = past.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffMin < 3) return `Active just now`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago (${timeFormatted})`;
  if (diffDays === 1) return `1 day ago ${timeFormatted}`;
  if (diffDays < 7) return `${diffDays} day ago ${timeFormatted}`;
  return `${past.toLocaleDateString()} at ${timeFormatted}`;
}
