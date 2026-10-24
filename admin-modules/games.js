import { sbClient, state, escapeHTML } from './config.js';

let existingGamesCache = [];

export async function loadGamesManager() {
  const container = document.getElementById('admin-games-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading games...</p>`;

  try {
    const { data, error } = await sbClient
      .from('site_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    existingGamesCache = data || [];

    if (!existingGamesCache.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No games added yet.</p>`;
      return;
    }

    container.innerHTML = existingGamesCache.map(g => `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3 min-w-0">
          <img src="${g.logo_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200'}" class="w-14 h-14 object-cover rounded-lg border border-[#262f40] shrink-0" />
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-white text-sm truncate">${escapeHTML(g.title)}</h4>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${g.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                ${g.is_active ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
            <p class="text-cyan-400 font-mono text-[11px] truncate mt-0.5">Category: ${escapeHTML(g.category || 'Arcade')}</p>
            <a href="${g.game_url}" target="_blank" class="text-amber-400 text-[10px] underline truncate block mt-0.5 flex items-center gap-1">
              <i class="fa-solid fa-gamepad"></i> Open Game Link
            </a>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="toggleGameActiveStatus('${g.id}', ${!g.is_active})" title="${g.is_active ? 'Disable' : 'Enable'}" class="px-2.5 py-1.5 rounded font-bold text-xs ${g.is_active ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}">
            <i class="fa-solid ${g.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
          </button>
          <button onclick="editGameCard('${g.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1.5 rounded font-bold text-xs">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="deleteGameCard('${g.id}')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded font-bold text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading games: ${escapeHTML(err.message)}</p>`;
  }
}

export async function saveGameCard() {
  const editId = document.getElementById('edit-game-id')?.value;
  const title = document.getElementById('game-title')?.value.trim();
  const game_url = document.getElementById('game-link')?.value.trim();
  const category = document.getElementById('game-category')?.value || 'Arcade';
  const is_active = document.getElementById('game-active')?.checked ?? true;
  const fileInput = document.getElementById('game-logo-file');
  const btn = document.getElementById('btn-save-game');

  if (!title || !game_url) {
    alert("Game Title aur Game Link dono zaroori hain!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "SAVING GAME...";
  }

  try {
    let logoUrl = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const path = `games/${Date.now()}_${file.name}`;
      const { error: upErr } = await sbClient.storage.from('deposit-screenshots').upload(path, file);
      if (!upErr) {
        const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(path);
        logoUrl = publicUrl;
      }
    }

    const payload = {
      title,
      game_url,
      category,
      is_active,
      updated_at: new Date().toISOString()
    };

    if (logoUrl) payload.logo_url = logoUrl;

    if (editId) {
      const { error } = await sbClient.from('site_games').update(payload).eq('id', editId);
      if (error) throw error;
      alert("Game updated successfully!");
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await sbClient.from('site_games').insert([payload]);
      if (error) throw error;
      alert("New game added successfully!");
    }

    resetGameForm();
    loadGamesManager();
  } catch (err) {
    alert("Failed to save game: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "SAVE GAME";
    }
  }
}

export function editGameCard(id) {
  const g = existingGamesCache.find(x => String(x.id) === String(id));
  if (!g) return;

  const idEl = document.getElementById('edit-game-id');
  if (idEl) idEl.value = g.id;

  const titleEl = document.getElementById('game-title');
  if (titleEl) titleEl.value = g.title || '';

  const linkEl = document.getElementById('game-link');
  if (linkEl) linkEl.value = g.game_url || '';

  const catEl = document.getElementById('game-category');
  if (catEl) catEl.value = g.category || 'Arcade';

  const activeEl = document.getElementById('game-active');
  if (activeEl) activeEl.checked = (g.is_active !== false);

  document.getElementById('btn-cancel-game')?.classList.remove('hidden');
  const saveBtn = document.getElementById('btn-save-game');
  if (saveBtn) saveBtn.innerText = "UPDATE GAME";
}

export function resetGameForm() {
  const idEl = document.getElementById('edit-game-id');
  if (idEl) idEl.value = '';

  const titleEl = document.getElementById('game-title');
  if (titleEl) titleEl.value = '';

  const linkEl = document.getElementById('game-link');
  if (linkEl) linkEl.value = '';

  const fileEl = document.getElementById('game-logo-file');
  if (fileEl) fileEl.value = '';

  const activeEl = document.getElementById('game-active');
  if (activeEl) activeEl.checked = true;

  document.getElementById('btn-cancel-game')?.classList.add('hidden');
  const saveBtn = document.getElementById('btn-save-game');
  if (saveBtn) saveBtn.innerText = "SAVE GAME";
}

export async function toggleGameActiveStatus(id, newStatus) {
  try {
    const { error } = await sbClient
      .from('site_games')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    loadGamesManager();
  } catch (err) {
    alert("Failed to change game status: " + err.message);
  }
}

export async function deleteGameCard(id) {
  if (!confirm("Are you sure you want to delete this game?")) return;

  try {
    const { error } = await sbClient.from('site_games').delete().eq('id', id);
    if (error) throw error;
    alert("Game deleted successfully!");
    loadGamesManager();
  } catch (err) {
    alert("Failed to delete game: " + err.message);
  }
}
