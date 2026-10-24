import { sbClient, state, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export async function loadSupportInbox() {
  const listContainer = document.getElementById('support-inbox-list');
  const countEl = document.getElementById('inbox-count');
  if (!listContainer) return;

  listContainer.innerHTML = `<p class="text-gray-400 text-xs py-4 text-center">Loading players...</p>`;

  try {
    const { data: messages, error } = await sbClient
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      listContainer.innerHTML = `<p class="text-gray-500 text-xs py-6 text-center">No support messages found.</p>`;
      if (countEl) countEl.innerText = '0 Chats';
      return;
    }

    const userMap = {};
    messages.forEach(m => {
      const uid = m.user_id;
      if (!uid) return;
      if (!userMap[uid]) {
        userMap[uid] = { lastMsg: m, unreadCount: 0 };
      }
      if (m.sender_role === 'player' && m.is_read === false) {
        userMap[uid].unreadCount++;
      }
    });

    const userIds = Object.keys(userMap);
    if (countEl) countEl.innerText = `${userIds.length} Chats`;

    const { data: profs } = await sbClient
      .from('profiles')
      .select('id, free_fire_name, free_fire_uid, avatar_url')
      .in('id', userIds);

    const profMap = {};
    if (profs) profs.forEach(p => { profMap[p.id] = p; });

    listContainer.innerHTML = userIds.map(uid => {
      const item = userMap[uid];
      const prof = profMap[uid] || {};
      const name = prof.free_fire_name || 'Player';
      const ffUid = prof.free_fire_uid || '--';
      const avatar = prof.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
      const lastText = item.lastMsg.message || 'Attachment / Image';
      const lastTime = new Date(item.lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div onclick="openPlayerChat('${uid}', '${escapeHTML(name)}', '${escapeHTML(ffUid)}', '${avatar}')" class="flex items-center justify-between p-3 bg-[#0e1118] border border-[#262f40] hover:border-[#ff4624] rounded-xl cursor-pointer transition">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover border border-[#262f40] shrink-0" />
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-white truncate">${escapeHTML(name)} <span class="text-cyan-400 font-mono text-[11px]">(UID: ${escapeHTML(ffUid)})</span></h4>
              <p class="text-xs text-gray-400 truncate mt-0.5">${escapeHTML(lastText)}</p>
            </div>
          </div>
          <div class="text-right shrink-0 flex flex-col items-end gap-1">
            <span class="text-[10px] text-gray-500 font-mono">${lastTime}</span>
            ${item.unreadCount > 0 ? `<span class="bg-[#ff4624] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">${item.unreadCount}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    listContainer.innerHTML = `<p class="text-red-500 text-xs py-4 text-center">Error loading inbox: ${escapeHTML(err.message)}</p>`;
  }
}

export async function openPlayerChat(userId, userName, userUid, userAvatar) {
  state.activeChatPlayerId = userId;
  document.getElementById('support-inbox-view')?.classList.add('hidden');
  const chatView = document.getElementById('support-chat-view');
  if (chatView) chatView.classList.remove('hidden');

  const usernameEl = document.getElementById('active-chat-username');
  if (usernameEl) usernameEl.innerText = userName;

  const uidEl = document.getElementById('active-chat-uid');
  if (uidEl) uidEl.innerText = `UID: ${userUid}`;

  const avatarEl = document.getElementById('active-chat-avatar');
  if (avatarEl) avatarEl.src = userAvatar;

  await sbClient
    .from('support_messages')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('sender_role', 'player');

  loadActiveChatMessages(userId);

  if (state.chatInterval) clearInterval(state.chatInterval);
  state.chatInterval = setInterval(() => {
    if (state.activeChatPlayerId) loadActiveChatMessages(state.activeChatPlayerId, true);
  }, 3000);

  loadDashboardStats();
}

export function closePlayerChat() {
  state.activeChatPlayerId = null;
  if (state.chatInterval) clearInterval(state.chatInterval);
  document.getElementById('support-chat-view')?.classList.add('hidden');
  document.getElementById('support-inbox-view')?.classList.remove('hidden');
  loadSupportInbox();
}

export async function loadActiveChatMessages(userId, silent = false) {
  const msgBox = document.getElementById('active-chat-messages');
  if (!msgBox) return;

  try {
    const { data: msgs, error } = await sbClient
      .from('support_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!msgs || msgs.length === 0) {
      if (!silent) msgBox.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No messages yet.</p>`;
      return;
    }

    msgBox.innerHTML = msgs.map(m => {
      const isAdmin = m.sender_role === 'admin';
      const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="flex flex-col ${isAdmin ? 'items-end' : 'items-start'} my-1">
          <div class="max-w-[85%] ${isAdmin ? 'bg-[#ff4624]/20 border border-[#ff4624]/40 text-white rounded-br-none' : 'bg-[#0e1118] border border-[#262f40] text-gray-200 rounded-bl-none'} p-2.5 rounded-xl text-xs space-y-1">
            <p class="whitespace-pre-wrap break-words">${escapeHTML(m.message)}</p>
            <span class="text-[9px] text-gray-400 block text-right font-mono">${time}</span>
          </div>
        </div>
      `;
    }).join('');

    if (!silent) msgBox.scrollTop = msgBox.scrollHeight;
  } catch (err) {
    if (!silent) msgBox.innerHTML = `<p class="text-red-400 text-xs text-center py-4">Error loading messages: ${escapeHTML(err.message)}</p>`;
  }
}

export function initSupportForm() {
  const adminReplyForm = document.getElementById('admin-reply-form');
  if (adminReplyForm) {
    adminReplyForm.onsubmit = async function(e) {
      e.preventDefault();
      const input = document.getElementById('admin-reply-input');
      const text = input ? input.value.trim() : '';
      if (!text || !state.activeChatPlayerId) return;

      if (input) input.value = '';

      try {
        const { error } = await sbClient.from('support_messages').insert([{
          user_id: state.activeChatPlayerId,
          sender_role: 'admin',
          message: text,
          is_read: true,
          created_at: new Date().toISOString()
        }]);

        if (error) throw error;
        await loadActiveChatMessages(state.activeChatPlayerId);
      } catch (err) {
        alert("Failed to send reply: " + err.message);
      }
    };
  }
}
