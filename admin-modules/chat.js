import { sbClient, state, escapeHTML } from './config.js';
import { loadBannedUsers } from './users.js';

export async function loadChatControlData() {
  await Promise.all([
    fetchChatSettings(),
    fetchChatStats(),
    fetchMutedPlayers(),
    fetchChatMessages(true)
  ]);
}

export function setupRealtimeChat() {
  if (state.chatRealtimeChannel) {
    sbClient.removeChannel(state.chatRealtimeChannel);
    state.chatRealtimeChannel = null;
  }

  state.chatRealtimeChannel = sbClient
    .channel('public:chat_messages_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => {
        fetchChatMessages(false, true);
      }
    )
    .subscribe();
}

export async function fetchChatSettings() {
  try {
    const { data, error } = await sbClient
      .from('chat_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    state.currentChatSettings = data || { id: 1, is_enabled: true, is_locked: false };
    updateChatSettingsUI();
  } catch (err) {
    state.currentChatSettings = { id: 1, is_enabled: true, is_locked: false };
    updateChatSettingsUI();
  }
}

export function updateChatSettingsUI() {
  const activeBtn = document.getElementById('btn-toggle-chat-active');
  const activeLbl = document.getElementById('lbl-chat-active');
  const lockBtn = document.getElementById('btn-toggle-chat-lock');
  const lockLbl = document.getElementById('lbl-chat-lock');

  const isEnabled = state.currentChatSettings?.is_enabled ?? true;
  const isLocked = state.currentChatSettings?.is_locked ?? false;

  if (isEnabled) {
    if (activeLbl) activeLbl.innerText = "CHAT: ON";
    if (activeBtn) activeBtn.className = "px-3 py-1.5 rounded-full text-xs font-bold font-gaming uppercase border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 flex items-center gap-1.5 shrink-0 transition cursor-pointer";
  } else {
    if (activeLbl) activeLbl.innerText = "CHAT: OFF";
    if (activeBtn) activeBtn.className = "px-3 py-1.5 rounded-full text-xs font-bold font-gaming uppercase border border-red-500/40 bg-red-950/40 text-red-300 flex items-center gap-1.5 shrink-0 transition cursor-pointer";
  }

  if (isLocked) {
    if (lockLbl) lockLbl.innerText = "INPUT: LOCKED";
    if (lockBtn) lockBtn.className = "px-3 py-1.5 rounded-full text-xs font-bold font-gaming uppercase border border-yellow-500/40 bg-yellow-950/40 text-yellow-300 flex items-center gap-1.5 shrink-0 transition cursor-pointer";
  } else {
    if (lockLbl) lockLbl.innerText = "INPUT: UNLOCKED";
    if (lockBtn) lockBtn.className = "px-3 py-1.5 rounded-full text-xs font-bold font-gaming uppercase border border-[#262f40] bg-[#151922] text-gray-300 flex items-center gap-1.5 shrink-0 transition cursor-pointer";
  }
}

export async function toggleGlobalChatActive() {
  if (!state.currentChatSettings) return;
  const current = state.currentChatSettings.is_enabled ?? true;
  const nextState = !current;

  if (!confirm(nextState ? "Enable group chat for all players?" : "Disable group chat completely?")) return;

  try {
    const { error } = await sbClient
      .from('chat_settings')
      .upsert({ id: state.currentChatSettings.id || 1, is_enabled: nextState, updated_at: new Date().toISOString() });

    if (error) throw error;
    state.currentChatSettings.is_enabled = nextState;
    updateChatSettingsUI();
    alert(`Chat successfully ${nextState ? 'ENABLED' : 'DISABLED'}!`);
  } catch (err) {
    alert("Settings error: " + err.message);
  }
}

export async function toggleGlobalChatLock() {
  if (!state.currentChatSettings) return;
  const current = state.currentChatSettings.is_locked ?? false;
  const nextState = !current;

  if (!confirm(nextState ? "Lock chat input for normal players?" : "Unlock chat input for normal players?")) return;

  try {
    const { error } = await sbClient
      .from('chat_settings')
      .upsert({ id: state.currentChatSettings.id || 1, is_locked: nextState, updated_at: new Date().toISOString() });

    if (error) throw error;
    state.currentChatSettings.is_locked = nextState;
    updateChatSettingsUI();
    alert(`Chat input successfully ${nextState ? 'LOCKED' : 'UNLOCKED'}!`);
  } catch (err) {
    alert("Settings error: " + err.message);
  }
}

export async function fetchChatStats() {
  const onlineStatEl = document.getElementById('chat-stat-online');
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await sbClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', fiveMinAgo);

    if (error) throw error;
    if (onlineStatEl) onlineStatEl.innerText = count !== null && count > 0 ? count : '1';
  } catch (err) {
    if (onlineStatEl) onlineStatEl.innerText = '1';
  }
}

export function insertAdminEmoji() {
  const input = document.getElementById('admin-chat-send-input');
  if (input) {
    input.value += " 🔥 ";
    input.focus();
  }
}

export async function handleAdminSendMessage(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('admin-chat-send-input');
  const btn = document.getElementById('btn-send-chat-msg');
  const message = input ? input.value.trim() : '';

  if (!message) return;
  btn.disabled = true;

  try {
    const { data: { session } } = await sbClient.auth.getSession();
    const activeAdminId = session?.user?.id || state.currentAdmin?.id;

    if (!activeAdminId) {
      alert("Admin session expired. Please re-authenticate.");
      return;
    }

    const payload = {
      user_id: activeAdminId,
      message: message,
      content: message,
      is_announcement: true,
      created_at: new Date().toISOString()
    };

    const { error } = await sbClient.from('chat_messages').insert([payload]);
    if (error) throw error;

    input.value = '';
    await fetchChatMessages(true);
  } catch (err) {
    alert("Failed to send message: " + err.message);
  } finally {
    btn.disabled = false;
  }
}

export async function fetchChatMessages(reset = false, silent = false) {
  const container = document.getElementById('chat-messages-moderation-list');
  const loadMoreBtn = document.getElementById('btn-load-more-chat');

  if (reset) {
    state.chatMessagesPage = 0;
    state.globalChatMessagesCache = [];
    if (container && !silent) container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">Loading messages...</p>`;
  }

  const from = state.chatMessagesPage * 50;
  const to = from + 50 - 1;

  try {
    const { data: messages, error } = await sbClient
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;
    const newItems = messages || [];
    
    const pinnedMsg = newItems.slice().reverse().find(m => m.is_pinned === true);
    const pinBanner = document.getElementById('pinned-announcement-banner');
    const pinTextEl = document.getElementById('pinned-msg-text');
    if (pinnedMsg && pinBanner && pinTextEl) {
      pinTextEl.innerText = pinnedMsg.message || 'Pinned Announcement';
      pinBanner.classList.remove('hidden');
    } else if (pinBanner) {
      pinBanner.classList.add('hidden');
    }

    const senderIds = [...new Set(newItems.map(m => m.user_id || m.sender_id).filter(Boolean))];
    let profMap = {};

    if (senderIds.length > 0) {
      const { data: profs } = await sbClient
        .from('profiles')
        .select('id, free_fire_name, free_fire_uid, avatar_url, is_admin, is_banned')
        .in('id', senderIds);

      if (profs) profs.forEach(p => { profMap[p.id] = p; });
    }

    const formattedItems = newItems.map(m => ({
      ...m,
      profiles: profMap[m.user_id || m.sender_id] || {}
    }));

    if (reset) {
      state.globalChatMessagesCache = formattedItems;
    } else if (!silent) {
      state.globalChatMessagesCache = formattedItems.concat(state.globalChatMessagesCache);
    } else {
      state.globalChatMessagesCache = formattedItems;
    }

    renderChatMessagesList(state.globalChatMessagesCache);

    if (container) {
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }

    if (loadMoreBtn) {
      loadMoreBtn.classList.toggle('hidden', newItems.length !== 50);
    }
  } catch (err) {
    if (container && !silent) container.innerHTML = `<p class="text-red-400 text-xs text-center py-4">Error loading chat: ${escapeHTML(err.message)}</p>`;
  }
}

export function dismissPinnedAnnouncementUI() {
  const pinBanner = document.getElementById('pinned-announcement-banner');
  if (pinBanner) pinBanner.classList.add('hidden');
}

export function loadMoreChatMessages() {
  state.chatMessagesPage++;
  fetchChatMessages(false);
}

export function filterChatMessagesList() {
  const q = (document.getElementById('chat-msg-search-input')?.value || '').toLowerCase().trim();
  if (!q) {
    renderChatMessagesList(state.globalChatMessagesCache);
    return;
  }

  const filtered = state.globalChatMessagesCache.filter(m => {
    const p = m.profiles || {};
    const name = (p.free_fire_name || '').toLowerCase();
    const uid = (p.free_fire_uid || '').toLowerCase();
    const text = (m.message || '').toLowerCase();
    return name.includes(q) || uid.includes(q) || text.includes(q);
  });

  renderChatMessagesList(filtered);
}

function renderMessageContentHTML(rawMsg) {
  if (!rawMsg) return '';
  const trimmed = String(rawMsg).trim();

  if (trimmed.startsWith('STICKER:') || trimmed.startsWith('sticker:') || trimmed.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
    let imgSrc = trimmed;
    if (imgSrc.startsWith('STICKER:') || imgSrc.startsWith('sticker:')) {
      imgSrc = imgSrc.replace(/^[Ss][Tt][Ii][Cc][Kk][Ee][Rr]:/, '').trim();
    }
    return `
      <div class="p-1">
        <img src="${imgSrc}" alt="Sticker" class="max-w-[130px] max-h-[130px] object-contain rounded-lg drop-shadow" onerror="this.onerror=null; this.parentElement.innerText='${escapeHTML(trimmed)}';" />
      </div>
    `;
  }

  return `<p class="text-xs leading-relaxed break-words whitespace-pre-wrap select-text font-normal">${escapeHTML(trimmed)}</p>`;
}

export function renderChatMessagesList(list) {
  const container = document.getElementById('chat-messages-moderation-list');
  if (!container) return;

  if (!list || !list.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-8">No chat messages found.</p>`;
    return;
  }

  const myAdminId = state.currentAdmin?.id;

  container.innerHTML = list.map(m => {
    const p = m.profiles || {};
    const msgOwnerId = m.user_id || m.sender_id || '';
    const isAdminMsg = (msgOwnerId === myAdminId) || p.is_admin || m.is_announcement;
    const msgDate = m.created_at ? new Date(m.created_at) : new Date();
    const timeFormatted = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = p.free_fire_name || (isAdminMsg ? 'Master Admin' : 'Defeater');
    const senderUid = p.free_fire_uid || '--';
    const avatarUrl = p.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
    const isPinned = m.is_pinned === true;
    const isPlayerBanned = p.is_banned === true;
    const isPlayerMuted = state.globalMutedPlayersCache.some(r => r.user_id === msgOwnerId && r.is_active);

    if (isAdminMsg) {
      return `
        <div class="flex flex-col items-end space-y-1.5 my-2">
          <div class="flex items-center gap-1.5 pr-1">
            <span class="bg-gradient-to-r from-[#ff4624] to-[#ff8424] text-white text-[10px] font-bold font-gaming px-2 py-0.5 rounded shadow flex items-center gap-1">
              <i class="fa-solid fa-crown text-[9px]"></i> ADMIN <span class="bg-white/20 rounded-full px-1 text-[8px]">Ⓥ</span>
            </span>
            <span class="text-[10px] text-gray-400 font-mono">${timeFormatted}</span>
            <div class="relative">
              <img src="${avatarUrl}" class="w-7 h-7 rounded-full object-cover admin-glowing-avatar" />
              <span class="absolute -bottom-1 -right-1 bg-[#ff4624] text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-[#0b0e14]">Ⓥ</span>
            </div>
          </div>

          <div class="max-w-[85%] bg-[#1a0f0d] border ${isPinned ? 'border-[#ff4624] ring-1 ring-[#ff4624]' : 'border-[#ff4624]/50'} text-white rounded-2xl rounded-tr-none p-3 shadow-lg space-y-2">
            ${isPinned ? '<span class="bg-[#ff4624] text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase block w-fit mb-1">📌 PINNED</span>' : ''}
            ${renderMessageContentHTML(m.message)}
            
            <div class="flex items-center justify-end gap-2 pt-1 border-t border-[#ff4624]/20 text-xs">
              <button onclick="togglePinMessage('${m.id}', ${isPinned})" class="p-1 text-gray-400 hover:text-yellow-400 transition cursor-pointer">
                <i class="fa-solid fa-thumbtack ${isPinned ? 'text-yellow-400' : ''}"></i>
              </button>
              <button onclick="deleteSingleChatMessage('${m.id}')" class="p-1 text-red-400 hover:text-red-300 transition cursor-pointer">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex flex-col items-start space-y-1.5 my-2">
          <div class="flex items-center gap-1.5 pl-1">
            <img src="${avatarUrl}" class="w-7 h-7 rounded-full object-cover border border-[#262f40]" />
            <span class="font-bold text-[12px] text-white font-gaming">${escapeHTML(senderName)}</span>
            <span class="bg-[#151922] border border-[#262f40] text-cyan-400 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">#${escapeHTML(senderUid)}</span>
            <span class="text-[10px] text-gray-400 font-mono">${timeFormatted}</span>
          </div>

          <div class="max-w-[85%] bg-[#121620] border ${isPinned ? 'border-amber-400 ring-1 ring-amber-400' : 'border-[#262f40]'} text-white rounded-2xl rounded-tl-none p-3 shadow space-y-2">
            ${isPinned ? '<span class="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase block w-fit mb-1">📌 PINNED</span>' : ''}
            ${renderMessageContentHTML(m.message)}

            <div class="flex items-center justify-end gap-3 pt-1 border-t border-[#262f40]/50 text-xs">
              <button onclick="togglePinMessage('${m.id}', ${isPinned})" class="p-1 text-gray-400 hover:text-yellow-400 transition cursor-pointer">
                <i class="fa-solid fa-thumbtack ${isPinned ? 'text-yellow-400' : ''}"></i>
              </button>
              
              ${isPlayerMuted ? `
                <button onclick="unmutePlayerDirect('${msgOwnerId}', '${escapeHTML(senderName)}')" class="p-1 text-emerald-400 hover:text-emerald-300 transition cursor-pointer">
                  <i class="fa-solid fa-volume-high"></i>
                </button>
              ` : `
                <button onclick="openTimedRestrictionModal('${msgOwnerId}', '${escapeHTML(senderName)}', 'mute')" class="p-1 text-gray-400 hover:text-amber-400 transition cursor-pointer">
                  <i class="fa-solid fa-volume-xmark"></i>
                </button>
              `}

              ${isPlayerBanned ? `
                <button onclick="unbanPlayerDirect('${msgOwnerId}', '${escapeHTML(senderName)}')" class="p-1 text-emerald-400 hover:text-emerald-300 transition cursor-pointer">
                  <i class="fa-solid fa-unlock"></i>
                </button>
              ` : `
                <button onclick="openTimedRestrictionModal('${msgOwnerId}', '${escapeHTML(senderName)}', 'ban')" class="p-1 text-gray-400 hover:text-red-400 transition cursor-pointer">
                  <i class="fa-solid fa-ban"></i>
                </button>
              `}

              <button onclick="deleteSingleChatMessage('${m.id}')" class="p-1 text-red-500 hover:text-red-400 transition cursor-pointer">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }).join('');
}

export async function togglePinMessage(msgId, currentPinned) {
  try {
    const { error } = await sbClient
      .from('chat_messages')
      .update({ is_pinned: !currentPinned })
      .eq('id', msgId);

    if (error) throw error;
    fetchChatMessages(true);
  } catch (err) {
    alert("Failed to pin message: " + err.message);
  }
}

export function openTimedRestrictionModal(userId, userName, type) {
  if (!userId) {
    alert("User ID not found for this player.");
    return;
  }
  document.getElementById('mute-player-id').value = userId;
  document.getElementById('mute-player-name-display').value = userName;
  document.getElementById('mute-restriction-type').value = type;
  document.getElementById('modal-action-title').innerHTML = type === 'ban' 
    ? '<i class="fa-solid fa-ban text-red-500 mr-2"></i> Ban Player (Time-based)' 
    : '<i class="fa-solid fa-volume-xmark text-amber-400 mr-2"></i> Mute Player (Time-based)';

  document.getElementById('modal-mute-player')?.classList.remove('hidden');
}

export function closeMutePlayerModal() {
  document.getElementById('modal-mute-player')?.classList.add('hidden');
}

export async function confirmApplyChatRestriction() {
  const userId = document.getElementById('mute-player-id')?.value;
  const userName = document.getElementById('mute-player-name-display')?.value;
  const restrictionType = document.getElementById('mute-restriction-type')?.value;
  const durationVal = document.getElementById('mute-duration-select')?.value;
  const reason = document.getElementById('mute-reason-input')?.value.trim() || 'Moderator action';
  const submitBtn = document.getElementById('btn-confirm-mute-submit');

  if (!userId) return;

  let expiryDate = null;
  const now = Date.now();
  if (durationVal === '15m') expiryDate = new Date(now + 15 * 60 * 1000).toISOString();
  else if (durationVal === '30m') expiryDate = new Date(now + 30 * 60 * 1000).toISOString();
  else if (durationVal === '1h') expiryDate = new Date(now + 60 * 60 * 1000).toISOString();
  else if (durationVal === '2h') expiryDate = new Date(now + 2 * 60 * 60 * 1000).toISOString();
  else if (durationVal === '24h') expiryDate = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  else if (durationVal === '7d') expiryDate = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (submitBtn) submitBtn.disabled = true;

  try {
    if (restrictionType === 'ban') {
      const { error: banErr } = await sbClient.from('profiles').update({ is_banned: true }).eq('id', userId);
      if (banErr) throw banErr;
      alert(`Player ${userName} has been BANNED successfully!`);
      loadBannedUsers();
    } else {
      const { error: muteErr } = await sbClient.from('chat_restrictions').insert([{
        user_id: userId,
        restriction_type: 'mute',
        reason: reason,
        expires_at: expiryDate,
        is_active: true,
        created_by: state.currentAdmin?.id,
        created_at: new Date().toISOString()
      }]);

      if (muteErr) throw muteErr;
      alert(`Player ${userName} has been MUTED (${durationVal}) successfully!`);
      fetchMutedPlayers();
    }

    closeMutePlayerModal();
    fetchChatMessages(true);
  } catch (err) {
    alert("Operation failed: " + err.message);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

export async function unmutePlayerDirect(userId, userName) {
  if (!confirm(`Are you sure you want to UNMUTE player ${userName}?`)) return;

  try {
    const { error } = await sbClient.from('chat_restrictions').update({ is_active: false }).eq('user_id', userId);
    if (error) throw error;
    alert(`Player ${userName} has been UNMUTED!`);
    fetchMutedPlayers();
    fetchChatMessages(true);
  } catch (err) {
    alert("Failed to unmute player: " + err.message);
  }
}

export async function deleteSingleChatMessage(msgId) {
  if (!confirm("Are you sure you want to delete this message permanently?")) return;

  try {
    const { error } = await sbClient.from('chat_messages').delete().eq('id', msgId);
    if (error) throw error;
    state.globalChatMessagesCache = state.globalChatMessagesCache.filter(m => String(m.id) !== String(msgId));
    renderChatMessagesList(state.globalChatMessagesCache);
  } catch (err) {
    alert("Failed to delete message: " + err.message);
  }
}

export async function clearAllChatMessages() {
  if (!confirm("⚠️ Are you sure you want to delete ALL messages permanently for all players?")) return;

  try {
    const { error } = await sbClient.from('chat_messages').delete().gt('id', 0);
    if (error) throw error;
    alert("All chat messages have been cleared successfully!");
    fetchChatMessages(true);
  } catch (err) {
    alert("Failed to clear chat: " + err.message);
  }
}

export async function fetchMutedPlayers() {
  const mutedStatEl = document.getElementById('chat-stat-muted');
  try {
    const { data, error } = await sbClient
      .from('chat_restrictions')
      .select('*, profiles(id, free_fire_name, free_fire_uid)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    state.globalMutedPlayersCache = data || [];
    if (mutedStatEl) mutedStatEl.innerText = state.globalMutedPlayersCache.length;
  } catch (err) {
    if (mutedStatEl) mutedStatEl.innerText = '0';
  }
}

export function openMutePlayerModal() {
  if (window.selectTab) window.selectTab('banned');
}
