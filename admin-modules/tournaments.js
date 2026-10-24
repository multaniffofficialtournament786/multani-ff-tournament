import { sbClient, state, escapeHTML } from './config.js';

export async function loadTournaments() {
  const container = document.getElementById('tournaments-cards-container');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading tournaments...</p>`;

  const { data, error } = await sbClient.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error || !data || !data.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No tournaments found.</p>`;
    return;
  }
  state.loadedTournamentsList = data;
  renderTournamentsList();
}

export function filterTournaments(status) {
  state.currentTournamentFilter = status;
  ['all', 'upcoming', 'live', 'completed'].forEach(s => {
    const btn = document.getElementById(`filter-btn-${s}`);
    if (btn) {
      btn.className = (s === status) 
        ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ff4624] text-white whitespace-nowrap"
        : "px-3 py-1.5 rounded-lg text-xs font-bold bg-[#151922] text-gray-400 border border-[#262f40] whitespace-nowrap";
    }
  });
  renderTournamentsList();
}

export function renderTournamentsList() {
  const container = document.getElementById('tournaments-cards-container');
  if (!container) return;

  const filtered = state.loadedTournamentsList.filter(t => {
    if (state.currentTournamentFilter === 'all') return true;
    return (t.status || 'upcoming').toLowerCase() === state.currentTournamentFilter;
  });

  if (!filtered.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No matches found for '${state.currentTournamentFilter}'.</p>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const currentStatus = t.status || 'upcoming';
    return `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-4 space-y-3 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <div class="pr-24">
            <h3 class="font-gaming text-base md:text-lg font-bold text-white leading-tight">${escapeHTML(t.title)}</h3>
            <div class="flex flex-wrap gap-2 text-[11px] text-gray-400 mt-1">
              <span class="text-cyan-400 font-bold">${escapeHTML(t.mode)}</span> • 
              <span>${escapeHTML(t.map)}</span> • 
              <span class="text-yellow-400 font-bold">1st: PKR ${t.prize_pool || 0}</span>
            </div>
          </div>
          <div class="absolute top-4 right-4">
            <select onchange="updateTournamentStatus('${t.id}', this.value)" class="bg-[#06070a] border border-[#262f40] rounded px-2 py-1 text-[10px] font-bold uppercase text-white outline-none">
              <option value="upcoming" ${currentStatus === 'upcoming' ? 'selected' : ''}>Upcoming</option>
              <option value="live" ${currentStatus === 'live' ? 'selected' : ''}>Live</option>
              <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 bg-[#0e1118] p-2.5 rounded-lg text-xs">
          <div>
            <span class="text-gray-500 text-[10px] uppercase font-bold block">Room ID</span>
            <input type="text" id="rid-${t.id}" value="${escapeHTML(t.room_id || '')}" placeholder="Set Room ID" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2 py-1 text-cyan-400 font-mono mt-1 text-xs outline-none">
          </div>
          <div>
            <span class="text-gray-500 text-[10px] uppercase font-bold block">Password</span>
            <input type="text" id="rpass-${t.id}" value="${escapeHTML(t.room_password || '')}" placeholder="Set Pass" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2 py-1 text-cyan-400 font-mono mt-1 text-xs outline-none">
          </div>
        </div>

        <div class="flex items-center justify-between gap-1 pt-1 flex-wrap">
          <div class="text-xs font-mono text-gray-400">
            Slots: <span class="text-white font-bold">${t.joined_players || 0}/${t.max_players}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="updateTournamentCredentials('${t.id}')" class="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2.5 py-1 rounded text-xs font-bold font-gaming">SET ROOM</button>
            <button onclick="viewTournamentPlayers('${t.id}', '${escapeHTML(t.title)}')" class="bg-purple-600 hover:bg-purple-500 text-white px-2.5 py-1 rounded text-xs font-bold">PLAYERS</button>
            <button onclick="openEditModal('${t.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1 rounded text-xs font-bold"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteTournament('${t.id}')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-xs font-bold"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export async function updateTournamentCredentials(id) {
  const room_id = document.getElementById(`rid-${id}`).value.trim();
  const room_password = document.getElementById(`rpass-${id}`).value.trim();

  const { error } = await sbClient.from('tournaments').update({
    room_id,
    room_password,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) alert("Update failed: " + error.message);
  else alert("Credentials saved successfully!");
}

export async function updateTournamentStatus(id, newStatus) {
  if (newStatus === 'completed') {
    if (window.selectTab) window.selectTab('winners');
    const winTSelect = document.getElementById('win-tournament');
    if (winTSelect) {
      winTSelect.value = id;
      if (window.onWinnerTournamentChange) window.onWinnerTournamentChange(id);
    }
    alert("Please declare winners for this match to complete it.");
    return;
  }

  const { error } = await sbClient.from('tournaments').update({
    status: newStatus,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) {
    alert("Failed to update status: " + error.message);
  } else {
    const item = state.loadedTournamentsList.find(x => x.id === id);
    if (item) item.status = newStatus;
    alert("Match status updated successfully!");
  }
}

export async function deleteTournament(id) {
  if (!confirm("Are you sure you want to delete this tournament permanently?")) return;
  const { error } = await sbClient.rpc('delete_tournament_safely', { p_tournament_id: id });
  if (error) alert("Failed: " + error.message);
  else {
    alert("Tournament deleted.");
    loadTournaments();
  }
}

export function openCreateTournamentModal() {
  document.getElementById('modal-match').classList.remove('hidden');
}

export function closeCreateTournamentModal() {
  document.getElementById('modal-match').classList.add('hidden');
}

export function handleAdminModeChange() {
  const mode = document.getElementById('m-mode').value;
  const mapSelect = document.getElementById('m-map');
  const maxSlotsInput = document.getElementById('m-max');

  if (mode === 'Lone Wolf 1v1') {
    mapSelect.value = 'Bermuda';
    mapSelect.disabled = true;
    mapSelect.classList.add('opacity-50', 'cursor-not-allowed');
    maxSlotsInput.value = '2';
    maxSlotsInput.readOnly = true;
    maxSlotsInput.classList.add('opacity-50', 'cursor-not-allowed');
  } else if (mode === 'Lone Wolf 2v2') {
    mapSelect.value = 'Bermuda';
    mapSelect.disabled = true;
    mapSelect.classList.add('opacity-50', 'cursor-not-allowed');
    maxSlotsInput.value = '4';
    maxSlotsInput.readOnly = true;
    maxSlotsInput.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    mapSelect.disabled = false;
    mapSelect.classList.remove('opacity-50', 'cursor-not-allowed');
    maxSlotsInput.readOnly = false;
    maxSlotsInput.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

export async function saveNewTournament() {
  const title = document.getElementById('m-title').value.trim();
  const mode = document.getElementById('m-mode').value;
  const map = (mode.startsWith('Lone Wolf')) ? 'Lone Wolf' : document.getElementById('m-map').value;
  const entry_fee = parseFloat(document.getElementById('m-fee').value);
  
  const prize_1 = parseFloat(document.getElementById('m-prize-1').value) || 0;
  const prize_2 = parseFloat(document.getElementById('m-prize-2').value) || 0;
  const prize_3 = parseFloat(document.getElementById('m-prize-3').value) || 0;
  const prize_4 = parseFloat(document.getElementById('m-prize-4').value) || 0;

  const max_players = mode === 'Lone Wolf 1v1' ? 2 : (mode === 'Lone Wolf 2v2' ? 4 : parseInt(document.getElementById('m-max').value));
  const match_date = document.getElementById('m-date').value;
  const fileInput = document.getElementById('m-file');
  const btn = document.getElementById('btn-save-match');

  if (!title || !match_date || prize_1 <= 0) {
    alert("Title, match date, and 1st Prize are mandatory.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "UPLOADING...";

  let banner_url = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80";

  try {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `tournaments/${Date.now()}_${file.name}`;
      const { error: upErr } = await sbClient.storage.from('deposit-screenshots').upload(path, file);
      if (!upErr) {
        const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(path);
        banner_url = publicUrl;
      }
    }

    const { error } = await sbClient.from('tournaments').insert([{
      title,
      mode,
      map,
      entry_fee,
      prize_pool: prize_1,
      prize_2,
      prize_3,
      prize_4,
      max_players,
      joined_players: 0,
      match_date: new Date(match_date).toISOString(),
      thumbnail_url: banner_url,
      status: 'upcoming'
    }]);

    if (error) throw error;

    alert("Tournament created successfully!");
    closeCreateTournamentModal();
    if (window.selectTab) window.selectTab('tournaments');
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "CREATE";
  }
}

export function openEditModal(id) {
  const t = state.loadedTournamentsList.find(x => x.id === id);
  if (!t) return;
  document.getElementById('edit-t-id').value = t.id;
  document.getElementById('edit-t-title').value = t.title;
  document.getElementById('edit-t-mode').value = t.mode;
  document.getElementById('edit-t-map').value = t.map;
  document.getElementById('edit-t-fee').value = t.entry_fee;
  
  document.getElementById('edit-t-prize-1').value = t.prize_pool || '';
  document.getElementById('edit-t-prize-2').value = t.prize_2 || '';
  document.getElementById('edit-t-prize-3').value = t.prize_3 || '';
  document.getElementById('edit-t-prize-4').value = t.prize_4 || '';

  document.getElementById('edit-t-file').value = '';
  
  if (t.match_date) {
    const dateObj = new Date(t.match_date);
    const localIsoString = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    document.getElementById('edit-t-date').value = localIsoString;
  } else {
    document.getElementById('edit-t-date').value = '';
  }

  document.getElementById('modal-edit-tournament').classList.remove('hidden');
}

export function closeEditModal() {
  document.getElementById('modal-edit-tournament').classList.add('hidden');
}

export async function saveEditedTournament() {
  const id = document.getElementById('edit-t-id').value;
  const title = document.getElementById('edit-t-title').value.trim();
  const mode = document.getElementById('edit-t-mode').value;
  const map = document.getElementById('edit-t-map').value;
  const entry_fee = parseFloat(document.getElementById('edit-t-fee').value);
  
  const prize_1 = parseFloat(document.getElementById('edit-t-prize-1').value) || 0;
  const prize_2 = parseFloat(document.getElementById('edit-t-prize-2').value) || 0;
  const prize_3 = parseFloat(document.getElementById('edit-t-prize-3').value) || 0;
  const prize_4 = parseFloat(document.getElementById('edit-t-prize-4').value) || 0;

  const match_date_val = document.getElementById('edit-t-date').value;
  const fileInput = document.getElementById('edit-t-file');

  const updateData = {
    title, mode, map, entry_fee, 
    prize_pool: prize_1,
    prize_2, prize_3, prize_4,
    updated_at: new Date().toISOString()
  };

  if (match_date_val) {
    updateData.match_date = new Date(match_date_val).toISOString();
  }

  try {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `tournaments/${Date.now()}_${file.name}`;
      const { error: upErr } = await sbClient.storage.from('deposit-screenshots').upload(path, file);
      if (!upErr) {
        const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(path);
        updateData.thumbnail_url = publicUrl;
      }
    }

    const { error } = await sbClient.from('tournaments').update(updateData).eq('id', id);
    if (error) throw error;

    alert("Tournament updated successfully!");
    closeEditModal();
    loadTournaments();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

export async function viewTournamentPlayers(tId, tTitle) {
  document.getElementById('modal-players-title').innerText = `${tTitle} - PLAYERS`;
  const body = document.getElementById('modal-players-body');
  body.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading joined players...</p>`;
  document.getElementById('modal-players').classList.remove('hidden');

  const { data, error } = await sbClient
    .from('tournament_entries')
    .select('id, user_id, slot_number, profiles(id, free_fire_name, free_fire_uid, avatar_url, is_banned)')
    .eq('tournament_id', tId);

  if (error || !data || !data.length) {
    body.innerHTML = `<p class="text-gray-500 text-xs text-center py-4">No players have joined this match yet.</p>`;
    return;
  }

  body.innerHTML = data.map(e => {
    const p = e.profiles || {};
    const avatarUrl = p.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
    return `
      <div class="flex items-center justify-between p-2.5 bg-[#151922] border border-[#262f40] rounded-lg text-xs">
        <div class="flex items-center gap-2.5">
          <img src="${avatarUrl}" class="w-8 h-8 rounded-full object-cover border border-[#ff4624]" />
          <div>
            <span class="font-bold text-white">Slot #${e.slot_number || '--'} • ${escapeHTML(p.free_fire_name || 'Gamer')}</span>
            <p class="text-cyan-400 font-mono text-[11px]">UID: ${escapeHTML(p.free_fire_uid || '--')}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="kickPlayerFromMatch('${e.id}', '${tId}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1 rounded text-xs font-bold">KICK</button>
          <button onclick="banPlayerFromPlatform('${e.user_id}', ${!p.is_banned})" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-xs font-bold">
            ${p.is_banned ? 'UNBAN' : 'BAN'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function closePlayersModal() { 
  document.getElementById('modal-players').classList.add('hidden'); 
}

export async function kickPlayerFromMatch(entryId, tId) {
  if (!confirm("Kick this player from match? Slot will be released.")) return;
  const { error } = await sbClient.from('tournament_entries').delete().eq('id', entryId);
  if (error) {
    alert("Kick failed: " + error.message);
  } else {
    const { data: t } = await sbClient.from('tournaments').select('joined_players').eq('id', tId).single();
    if (t && t.joined_players > 0) {
      await sbClient.from('tournaments').update({ joined_players: t.joined_players - 1 }).eq('id', tId);
    }
    alert("Player kicked and slot released successfully.");
    closePlayersModal();
    loadTournaments();
  }
    }
    
