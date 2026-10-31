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
    
    // Supabase column: wallet_balance (Real Wallet)
    const realWalletBalance = Number(
      u.wallet_balance !== undefined && u.wallet_balance !== null ? u.wallet_balance :
      (u.balance !== undefined && u.balance !== null ? u.balance : 0)
    );

    // Supabase column: total_won (Winning Amount)
    const wonAmount = Number(
      u.total_won !== undefined && u.total_won !== null ? u.total_won :
      (u.won !== undefined && u.won !== null ? u.won : 0)
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
            <span class="font-gaming font-bold text-yellow-400 text-sm block">PKR ${realWalletBalance}</span>
            <span class="font-gaming font-bold text-emerald-400 text-[11px] block">Won: PKR ${wonAmount}</span>
            <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.is_banned ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}">
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
          <button onclick="openWalletModal('${u.id}', '${escapeHTML(u.free_fire_name || 'Player')}', ${realWalletBalance})" class="bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer">
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

  if (isNaN(newBalance)) {
    alert("Please enter a valid balance amount.");
    return;
  }

  // Supabase ke dono columns update honge
  const { error } = await sbClient.from('profiles').update({
    wallet_balance: newBalance,
    balance: newBalance,
    updated_at: new Date().toISOString()
  }).eq('id', userId);

  if (error) {
    alert("Failed to update wallet balance: " + error.message);
  } else {
    alert("Player wallet balance updated successfully!");
    closeWalletModal();
    loadUsers();
  }
}

export async function openAllPlayersModal() {
  const modal = document.getElementById('modal-all-players');
  const body = document.getElementById('modal-all-players-body');
  if (!modal || !body) return;

  modal.classList.remove('hidden');
  body.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading players list...</p>`;

  const { data, error } = await sbClient.from('profiles').select('*').order('created_at', { ascending: false });

  if (error || !data || !data.length) {
    body.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No players found.</p>`;
    return;
  }

  state.globalAllPlayersCache = data;
  renderAllPlayersList(state.globalAllPlayersCache);
}

export function renderAllPlayersList(list) {
  const body = document.getElementById('modal-all-players-body');
  if (!body) return;

  if (!list.length) {
    body.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No matching players found.</p>`;
    return;
  }

  const now = new Date();

  body.innerHTML = list.map(u => {
    const waNumber = u.phone || '';
    const userEmail = u.email || 'No email added';
    const avatarUrl = u.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
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
      <div class="bg-[#151922] border border-[#262f40] rounded-2xl p-3 sm:p-3.5 space-y-2.5 text-xs transition hover:border-[#ff4624]/50">
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

        <div class="flex items-center gap-2 pt-0.5">
          ${waNumber ? `
            <a href="${waLink}" target="_blank" class="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow transition">
              <i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp
            </a>
          ` : `<span class="flex-1 text-gray-500 text-[11px] italic text-center py-1 bg-[#0e1118] rounded-xl">No WhatsApp</span>`}
          <button onclick="openPlayerHistoryModal('${u.id}', '${escapeHTML(u.free_fire_name || 'Player')}')" class="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black py-1.5 px-3 rounded-xl font-bold text-xs font-gaming transition flex items-center justify-center gap-1.5 cursor-pointer">
            <i class="fa-solid fa-receipt"></i> History
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export async function openPlayerHistoryModal(userId, userName) {
  const modal = document.getElementById('modal-player-history');
  const title = document.getElementById('modal-history-title');
  const body = document.getElementById('modal-history-body');
  if (!modal || !title || !body) return;

  title.innerText = `${userName} - Payment History`;
  modal.classList.remove('hidden');
  body.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading history...</p>`;

  const [txRes, depRes] = await Promise.all([
    sbClient.from('wallet_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    sbClient.from('deposit_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  const txs = txRes.data || [];
  const deps = depRes.data || [];

  if (!txs.length && !deps.length) {
    body.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No payment history found for this player.</p>`;
    return;
  }

  let html = '';
  deps.forEach(d => {
    html += `
      <div class="bg-[#151922] border border-[#262f40] rounded-lg p-2.5 text-xs flex justify-between items-center">
        <div>
          <span class="text-yellow-400 font-bold block">Deposit (${escapeHTML(d.payment_method)})</span>
          <span class="text-gray-400 text-[10px]">${new Date(d.created_at).toLocaleString()}</span>
        </div>
        <div class="text-right">
          <span class="text-emerald-400 font-bold font-gaming">+PKR ${d.amount}</span>
          <span class="block text-[9px] uppercase font-bold text-cyan-400">${d.status}</span>
        </div>
      </div>
    `;
  });

  txs.forEach(tx => {
    const isPos = tx.amount > 0;
    html += `
      <div class="bg-[#151922] border border-[#262f40] rounded-lg p-2.5 text-xs flex justify-between items-center">
        <div>
          <span class="text-white font-bold block">${escapeHTML(tx.description || tx.transaction_type)}</span>
          <span class="text-gray-400 text-[10px]">${new Date(tx.created_at).toLocaleString()}</span>
        </div>
        <div class="text-right">
          <span class="${isPos ? 'text-emerald-400' : 'text-red-400'} font-bold font-gaming">${isPos ? '+' : ''}PKR ${tx.amount}</span>
          <span class="block text-[9px] uppercase font-bold text-gray-400">${tx.status || 'completed'}</span>
        </div>
      </div>
    `;
  });

  body.innerHTML = html;
}

export function closePlayerHistoryModal() {
  document.getElementById('modal-player-history')?.classList.add('hidden');
}

export function filterAllPlayersModal() {
  const q = document.getElementById('all-players-search')?.value.toLowerCase().trim() || '';
  if (!q) {
    renderAllPlayersList(state.globalAllPlayersCache);
    return;
  }
  const filtered = state.globalAllPlayersCache.filter(u => 
    (u.free_fire_name && u.free_fire_name.toLowerCase().includes(q)) ||
    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
    (u.free_fire_uid && u.free_fire_uid.toLowerCase().includes(q)) ||
    (u.email && u.email.toLowerCase().includes(q))
  );
  renderAllPlayersList(filtered);
}

export function closeAllPlayersModal() {
  document.getElementById('modal-all-players')?.classList.add('hidden');
}

export async function banPlayerFromPlatform(userId, newBanStatus) {
  if (!confirm(`Are you sure you want to ${newBanStatus ? 'BAN' : 'UNBAN'} this player?`)) return;
  const { error } = await sbClient.from('profiles').update({ is_banned: newBanStatus }).eq('id', userId);
  if (error) {
    alert(error.message);
  } else {
    alert(`Player ${newBanStatus ? 'BANNED' : 'UNBANNED'} successfully.`);
    loadBannedUsers();
    loadUsers();
  }
}

export async function loadBannedUsers() {
  const container = document.getElementById('banned-cards-container');
  if (!container) return;

  try {
    const { data, error } = await sbClient
      .from('profiles')
      .select('*')
      .eq('is_banned', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    if (!data || !data.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No banned players found.</p>`;
      return;
    }

    container.innerHTML = data.map(u => `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 flex items-center justify-between text-xs">
        <div>
          <h4 class="font-bold text-sm text-white">${escapeHTML(u.free_fire_name || u.full_name || 'Player')}</h4>
          <p class="text-cyan-400 font-mono text-[11px]">UID: ${escapeHTML(u.free_fire_uid || '--')} • Email: ${escapeHTML(u.email || '--')}</p>
        </div>
        <div>
          <button onclick="unbanPlayerDirect('${u.id}', '${escapeHTML(u.free_fire_name || 'Player')}')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold uppercase text-[11px] cursor-pointer">
            UNBAN
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading banned players: ${err.message}</p>`;
  }
}

export async function unbanPlayerDirect(userId, userName) {
  if (!confirm(`Are you sure you want to UNBAN player ${userName}?`)) return;

  try {
    const { error } = await sbClient
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userId);

    if (error) throw error;
    alert(`Player ${userName} has been UNBANNED!`);
    loadBannedUsers();
  } catch (err) {
    alert("Failed to unban player: " + err.message);
  }
}
