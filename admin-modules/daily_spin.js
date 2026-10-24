import { sbClient, state, escapeHTML } from './config.js';

export async function loadAdminDailySpinMgmt() {
  const container = document.getElementById('admin-daily-spin-slots-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading slots and stats...</p>`;

  try {
    const [slotsRes, historyRes] = await Promise.all([
      sbClient.from('daily_spin_rewards').select('*').order('slot_number', { ascending: true }),
      sbClient.from('daily_spin_history').select('*')
    ]);

    const slots = slotsRes.data || [];
    const history = historyRes.data || [];

    const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" });
    const todayDateOnly = new Date(todayStr).toDateString();

    const todaySpins = history.filter(h => {
      const spinDateOnly = new Date(new Date(h.spin_date || h.created_at).toLocaleString("en-US", { timeZone: "Asia/Karachi" })).toDateString();
      return spinDateOnly === todayDateOnly;
    });

    let totalCoinsToday = 0;
    let count8C = 0, count5C = 0, countEmpty = 0, countTry = 0;

    todaySpins.forEach(s => {
      const val = Number(s.reward_value || 0);
      const type = (s.reward_type || '').toLowerCase();
      const name = (s.reward_name || '').toLowerCase();

      if (type === 'coin' || type === 'coins') totalCoinsToday += val;
      if (val === 8 || name.includes('8 coin')) count8C++;
      if (val === 5 || name.includes('5 coin')) count5C++;
      if (name.includes('empty')) countEmpty++;
      if (name.includes('try again')) countTry++;
    });

    const statTotal = document.getElementById('spin-stat-total');
    if (statTotal) statTotal.innerText = todaySpins.length;

    const statCoins = document.getElementById('spin-stat-coins');
    if (statCoins) statCoins.innerText = totalCoinsToday;

    const stat8c = document.getElementById('spin-stat-8c');
    if (stat8c) stat8c.innerText = `${count8C} / 2`;

    const stat5c = document.getElementById('spin-stat-5c');
    if (stat5c) stat5c.innerText = `${count5C} / 3`;

    const statEmpty = document.getElementById('spin-stat-empty');
    if (statEmpty) statEmpty.innerText = countEmpty;

    const statTry = document.getElementById('spin-stat-try');
    if (statTry) statTry.innerText = countTry;

    if (!slots.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No daily spin slots found.</p>`;
      return;
    }

    container.innerHTML = `
      <h4 class="font-gaming text-xs font-bold text-cyan-400 uppercase"><i class="fa-solid fa-list mr-1"></i> Wheel 8 Slots Configuration</h4>
      ${slots.map(s => `
        <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-gaming font-bold text-yellow-400 text-sm">Slot #${s.slot_number}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">${s.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
            </div>
            <h4 class="font-bold text-white text-sm mt-0.5">${escapeHTML(s.reward_name)}</h4>
            <span class="text-gray-400 text-[11px]">Type: <strong class="text-cyan-400">${escapeHTML(s.reward_type)}</strong> • Value: <strong class="text-yellow-400">${s.reward_value}</strong></span>
          </div>
          <div>
            <button onclick="openDailySpinSlotModal('${s.id}', ${s.slot_number}, '${escapeHTML(s.reward_name)}', '${escapeHTML(s.reward_type)}', ${s.reward_value}, ${s.is_active})" class="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded font-bold"><i class="fa-solid fa-pen"></i> Edit</button>
          </div>
        </div>
      `).join('')}
    `;

  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading spin data: ${escapeHTML(err.message)}</p>`;
  }
}

export function openDailySpinSlotModal(id, slot_number, reward_name, reward_type, reward_value, is_active) {
  const idEl = document.getElementById('edit-spin-slot-id');
  if (idEl) idEl.value = id;

  const numEl = document.getElementById('spin-slot-num');
  if (numEl) numEl.value = slot_number;

  const nameEl = document.getElementById('spin-slot-name');
  if (nameEl) nameEl.value = reward_name;

  const typeEl = document.getElementById('spin-slot-type');
  if (typeEl) typeEl.value = reward_type;

  const valEl = document.getElementById('spin-slot-val');
  if (valEl) valEl.value = reward_value;

  const activeEl = document.getElementById('spin-slot-active');
  if (activeEl) activeEl.checked = is_active;

  document.getElementById('modal-daily-spin-slot')?.classList.remove('hidden');
}

export function closeDailySpinSlotModal() {
  document.getElementById('modal-daily-spin-slot')?.classList.add('hidden');
}

export async function saveDailySpinSlot() {
  const id = document.getElementById('edit-spin-slot-id')?.value;
  const slot_number = parseInt(document.getElementById('spin-slot-num')?.value);
  const reward_name = document.getElementById('spin-slot-name')?.value.trim();
  const reward_type = document.getElementById('spin-slot-type')?.value;
  const reward_value = parseInt(document.getElementById('spin-slot-val')?.value);
  const is_active = document.getElementById('spin-slot-active')?.checked;

  if (!reward_name || isNaN(reward_value)) {
    alert("Please fill in all fields correctly.");
    return;
  }

  const updatePayload = { reward_name, reward_type, reward_value, is_active };
  let error = null;

  if (id && id !== 'undefined' && id !== 'null') {
    const res = await sbClient.from('daily_spin_rewards').update(updatePayload).eq('id', id);
    error = res.error;
  } else {
    const res = await sbClient.from('daily_spin_rewards').update(updatePayload).eq('slot_number', slot_number);
    error = res.error;
  }

  if (error) {
    alert("Failed to update slot: " + error.message);
  } else {
    alert("Daily spin slot updated successfully!");
    closeDailySpinSlotModal();
    loadAdminDailySpinMgmt();
  }
}

export async function loadAdminSpinHistory() {
  const container = document.getElementById('admin-spin-history-container');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading spin history...</p>`;

  try {
    const { data, error } = await sbClient
      .from('daily_spin_history')
      .select('*')
      .order('spin_date', { ascending: false });

    if (error) throw error;
    const list = data || [];
    const userIds = [...new Set(list.map(h => h.user_id))];
    let profMap = {};

    if (userIds.length > 0) {
      const { data: profs } = await sbClient.from('profiles').select('id, free_fire_name, free_fire_uid, full_name, email').in('id', userIds);
      if (profs) profs.forEach(p => { profMap[p.id] = p; });
    }

    state.globalSpinHistoryCache = list.map(h => ({
      ...h,
      profile: profMap[h.user_id] || {}
    }));

    renderSpinHistoryList(state.globalSpinHistoryCache);
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading history: ${escapeHTML(err.message)}</p>`;
  }
}

export function filterSpinHistory() {
  const q = document.getElementById('spin-history-search')?.value.toLowerCase().trim() || '';
  if (!q) {
    renderSpinHistoryList(state.globalSpinHistoryCache);
    return;
  }
  const filtered = state.globalSpinHistoryCache.filter(item => {
    const p = item.profile || {};
    const name = (p.free_fire_name || p.full_name || '').toLowerCase();
    const uid = (p.free_fire_uid || '').toLowerCase();
    const reward = (item.reward_name || '').toLowerCase();
    const dateStr = new Date(item.spin_date || item.created_at).toLocaleString().toLowerCase();

    return name.includes(q) || uid.includes(q) || reward.includes(q) || dateStr.includes(q);
  });
  renderSpinHistoryList(filtered);
}

export function renderSpinHistoryList(list) {
  const container = document.getElementById('admin-spin-history-container');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No spin history records found.</p>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const p = item.profile || {};
    const playerName = p.free_fire_name || p.full_name || 'Player';
    const playerUid = p.free_fire_uid || '--';
    const spinTime = new Date(item.spin_date || item.created_at).toLocaleString();

    return `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 flex items-center justify-between text-xs">
        <div>
          <h4 class="font-bold text-sm text-white">${escapeHTML(playerName)} <span class="text-cyan-400 font-mono text-xs">(UID: ${escapeHTML(playerUid)})</span></h4>
          <span class="text-gray-400 text-[11px]">Reward: <strong class="text-yellow-400">${escapeHTML(item.reward_name)}</strong> • Type: <strong>${escapeHTML(item.reward_type)}</strong> • Value: <strong>${item.reward_value}</strong></span>
        </div>
        <div class="text-right">
          <span class="text-purple-400 font-mono text-[11px] block">${spinTime}</span>
        </div>
      </div>
    `;
  }).join('');
}
