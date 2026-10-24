import { sbClient, state, escapeHTML } from './config.js';

let existingMissionsCache = [];

export async function loadDailyMissionsManager() {
  const container = document.getElementById('admin-missions-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading daily missions...</p>`;

  try {
    const { data, error } = await sbClient
      .from('daily_missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    existingMissionsCache = data || [];

    if (!existingMissionsCache.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No daily missions created yet.</p>`;
      return;
    }

    container.innerHTML = existingMissionsCache.map(m => `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-white text-sm truncate">${escapeHTML(m.title)}</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${m.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
              ${m.is_active ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
          <p class="text-gray-400 text-[11px] truncate mt-0.5">${escapeHTML(m.description || 'Complete this task to earn coins.')}</p>
          <div class="flex items-center gap-3 mt-1 text-[11px]">
            <span class="text-yellow-400 font-bold font-gaming"><i class="fa-solid fa-coins mr-1"></i> Reward: +${m.reward_coins} Coins</span>
            <span class="text-cyan-400 font-mono"><i class="fa-solid fa-bullseye mr-1"></i> Target: ${m.target_count}x</span>
            <span class="text-purple-400 font-mono uppercase text-[10px] bg-[#0e1118] px-1.5 py-0.5 rounded border border-[#262f40]">${escapeHTML(m.action_type || 'custom')}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button onclick="toggleMissionActiveStatus('${m.id}', ${!m.is_active})" title="${m.is_active ? 'Disable' : 'Enable'}" class="px-2.5 py-1.5 rounded font-bold text-xs ${m.is_active ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}">
            <i class="fa-solid ${m.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i>
          </button>
          <button onclick="editDailyMission('${m.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1.5 rounded font-bold text-xs">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="deleteDailyMission('${m.id}')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded font-bold text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading missions: ${escapeHTML(err.message)}</p>`;
  }
}

export async function saveDailyMission() {
  const editId = document.getElementById('edit-mission-id')?.value;
  const title = document.getElementById('mission-title')?.value.trim();
  const description = document.getElementById('mission-desc')?.value.trim();
  const reward_coins = parseInt(document.getElementById('mission-reward')?.value) || 5;
  const target_count = parseInt(document.getElementById('mission-target')?.value) || 1;
  const action_type = document.getElementById('mission-action-type')?.value || 'custom';
  const is_active = document.getElementById('mission-active')?.checked ?? true;
  const btn = document.getElementById('btn-save-mission');

  if (!title) {
    alert("Mission Title lazmi likhein!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "SAVING MISSION...";
  }

  const payload = {
    title,
    description: description || '.',
    reward_coins,
    target_count,
    action_type,
    is_active,
    updated_at: new Date().toISOString()
  };

  try {
    if (editId) {
      const { error } = await sbClient.from('daily_missions').update(payload).eq('id', editId);
      if (error) throw error;
      alert("Mission updated successfully!");
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await sbClient.from('daily_missions').insert([payload]);
      if (error) throw error;
      alert("New mission added successfully!");
    }

    resetDailyMissionForm();
    loadDailyMissionsManager();
  } catch (err) {
    alert("Failed to save mission: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "SAVE MISSION";
    }
  }
}

export function editDailyMission(id) {
  const m = existingMissionsCache.find(x => String(x.id) === String(id));
  if (!m) return;

  const idEl = document.getElementById('edit-mission-id');
  if (idEl) idEl.value = m.id;

  const titleEl = document.getElementById('mission-title');
  if (titleEl) titleEl.value = m.title || '';

  const descEl = document.getElementById('mission-desc');
  if (descEl) descEl.value = (m.description === '.' ? '' : m.description) || '';

  const rewardEl = document.getElementById('mission-reward');
  if (rewardEl) rewardEl.value = m.reward_coins || 5;

  const targetEl = document.getElementById('mission-target');
  if (targetEl) targetEl.value = m.target_count || 1;

  const actionEl = document.getElementById('mission-action-type');
  if (actionEl) actionEl.value = m.action_type || 'custom';

  const activeEl = document.getElementById('mission-active');
  if (activeEl) activeEl.checked = (m.is_active !== false);

  document.getElementById('btn-cancel-mission')?.classList.remove('hidden');
  const saveBtn = document.getElementById('btn-save-mission');
  if (saveBtn) saveBtn.innerText = "UPDATE MISSION";
}

export function resetDailyMissionForm() {
  const idEl = document.getElementById('edit-mission-id');
  if (idEl) idEl.value = '';

  const titleEl = document.getElementById('mission-title');
  if (titleEl) titleEl.value = '';

  const descEl = document.getElementById('mission-desc');
  if (descEl) descEl.value = '';

  const rewardEl = document.getElementById('mission-reward');
  if (rewardEl) rewardEl.value = '5';

  const targetEl = document.getElementById('mission-target');
  if (targetEl) targetEl.value = '1';

  const actionEl = document.getElementById('mission-action-type');
  if (actionEl) actionEl.value = 'custom';

  const activeEl = document.getElementById('mission-active');
  if (activeEl) activeEl.checked = true;

  document.getElementById('btn-cancel-mission')?.classList.add('hidden');
  const saveBtn = document.getElementById('btn-save-mission');
  if (saveBtn) saveBtn.innerText = "SAVE MISSION";
}

export async function toggleMissionActiveStatus(id, newStatus) {
  try {
    const { error } = await sbClient
      .from('daily_missions')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    loadDailyMissionsManager();
  } catch (err) {
    alert("Failed to update mission status: " + err.message);
  }
}

export async function deleteDailyMission(id) {
  if (!confirm("Are you sure you want to delete this mission?")) return;

  try {
    const { error } = await sbClient.from('daily_missions').delete().eq('id', id);
    if (error) throw error;
    alert("Mission deleted successfully!");
    loadDailyMissionsManager();
  } catch (err) {
    alert("Failed to delete mission: " + err.message);
  }
}
