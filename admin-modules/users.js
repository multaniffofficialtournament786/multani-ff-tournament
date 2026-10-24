import { sbClient, state, escapeHTML, formatTimeAgo } from './config.js';

export async function loadUsers() {
  const container = document.getElementById('users-cards-container');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading gamers...</p>`;

  try {
    const { data, error } = await sbClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    state.globalAllPlayersCache = data || [];
    renderUsersList(state.globalAllPlayersCache);
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading users: ${escapeHTML(err.message)}</p>`;
  }
}

export function filterUsersList() {
  const q = document.getElementById('user-search-input')?.value.toLowerCase().trim() || '';
  if (!q) {
    renderUsersList(state.globalAllPlayersCache);
    return;
  }
  const filtered = state.globalAllPlayersCache.filter(u => 
    (u.free_fire_name && u.free_fire_name.toLowerCase().includes(q)) ||
    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
    (u.free_fire_uid && u.free_fire_uid.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q))
  );
  renderUsersList(filtered);
}

export function renderUsersList(list) {
  const container = document.getElementById('users-cards-container');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No gamers found.</p>`;
    return;
  }

  const now = new Date();

  container.innerHTML = list.map(u => {
    const waNumber = u.phone || '';
    const userEmail = u.email || 'No email added';
    const avatarUrl = u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
    
    const userBalance = Number(
      u.balance !== undefined && u.balance !== null ? u.balance :
      (u.wallet_balance !== undefined && u.wallet_balance !== null ? u.wallet_balance :
      (u.wallet !== undefined && u.wallet !== null ? u.wallet :
      (u.amount !== undefined && u.amount !== null ? u.amount : 0)))
    );
    
    const lastSeenTime = u.last_seen || u.updated_at || u.created_at;
    const diffMinutes = lastSeenTime ? (now - new Date(lastSeenTime)) / 60000 : 999;
    const isActiveNow = diffMinutes <= 5;

    let waLink = '#';
    if (waNumber) {
      let cleanNum = waNumber.replace(/[^0-9]/g, '');
      if (cleanNum.startsWith('0')) cleanNum = '92' + cleanNum.substring(1);
      const autoMsg = encodeURIComponent("Hello! I am contacting you from Multani FF Official Tournament Admin.");
      waLink = `https://wa.me/${cleanNum}?text=${autoMsg}`;
    }

    const joinDateFormatted = u.created_at ? new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown';

    return `
      <div class="bg-[#151922] border border-[#262f40] rounded-2xl p-3.5 space-y-2.5 transition hover:border-[#ff4624]/50">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="relative shrink-0">
              <img src="${avatarUrl}" class="w-11 h-11 rounded-full object-cover border-2 ${isActiveNow ? 'border-[#00e676]' : 'border-[#262f40]'}" />
              ${isActiveNow ? `<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00e676] rounded-full border-2 border-[#151922] blink-heart flex items-center justify-center text-[8px] text-black font-bold">💚</span>` : ''}
            </div>
            <div class="min-w-0">
              <h4 class="font-bold text-sm text-white truncate">${escapeHTML(u.free_fire_name || u.full_name || 'Player')}</h4>
              <p class="text-cyan-400 font-mono text-[11px] truncate">UID: ${escapeHTML(u.free_fire_uid || '--')}</p>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span class="font-gaming font-bold text-yellow-400 text-sm block">PKR ${userBalance}</span>
            <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${u.is_banned ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}">
              ${u.is_banned ? 'BANNED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div class="bg-[#0e1118] p-2.5 rounded-xl space-y-1.5 text-[11px] border border-[#262f40]/50">
          <div class="flex items-center justify-between">
            <span class="text-gray-300 truncate"><i class="fa-solid fa-envelope text-red-400 mr-1.5 w-4"></i> Gmail: <strong class="text-white">${escapeHTML(userEmail)}</strong></span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-[#262f40]/40">
            <span class="text-gray-400 font-mono">Joined: ${joinDateFormatted}</span>
            <span class="text-gray-300">Last Seen: <strong class="${isActiveNow ? 'text-[#00e676]' : 'text-yellow-400'}">${formatTimeAgo(lastSeenTime)}</strong></span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-0.5 flex-wrap">
          ${waNumber ? `
            <a href="${waLink}" target="_blank" class="bg-[#25D366] hover:bg-[#1ebe57] text-white py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 shadow transition">
              <i class="fa-brands fa-whatsapp text-sm"></i> WA
            </a>
          ` : ''}
          <button onclick="openWalletModal('${u.id}', '${escapeHTML(u.free_fire_name || 'Player')}', ${userBalance})" class="bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer">
            <i class="fa-solid fa-wallet"></i> Edit Balance
          </button>
          <button onclick="openPlayerHistoryModal('${u.id}', '${escapeHTML(u.free_fire_name || 'Player')}')" class="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black py-1.5 px-3 rounded-xl font-bold text-xs font-gaming transition flex items-center justify-center gap-1.5 cursor-pointer">
            History
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function openWalletModal(userId, userName, currentBalance) {
  document.getElementById('edit-wallet-user-id').value = userId;
  document.getElementById('edit-wallet-username').value = userName;
  document.getElementById('edit-wallet-amount').value = currentBalance;
  document.getElementById('modal-edit-wallet').classList.remove('hidden');
}

export function closeWalletModal() {
  document.getElementById('modal-edit-wallet').classList.add('hidden');
}

export async function saveWalletBalance() {
  const userId = document.getElementById('edit-wallet-user-id').value;
  const newBalance = parseFloat(document.getElementById('edit-wallet-amount').value);

  if (isNaN(new
                                
