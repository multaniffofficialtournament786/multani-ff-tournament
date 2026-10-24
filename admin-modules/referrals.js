import { sbClient, state, escapeHTML } from './config.js';

export async function loadAdminReferralRewards() {
  const container = document.getElementById('admin-referral-rewards-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading referral rewards...</p>`;

  try {
    const { data, error } = await sbClient
      .from('referral_rewards')
      .select('*')
      .order('referrals_required', { ascending: true });

    if (error) throw error;
    state.existingReferralsCache = data || [];

    if (!state.existingReferralsCache.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No referral rewards found.</p>`;
      return;
    }

    container.innerHTML = state.existingReferralsCache.map(r => `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
        <div>
          <div class="flex items-center gap-2">
            <span class="font-gaming font-bold text-yellow-400 text-sm">${r.referrals_required} Invites Required</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">${r.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
          <h4 class="font-bold text-white text-sm mt-0.5">${escapeHTML(r.reward_name)}</h4>
          <span class="text-gray-400 text-[11px]">Type: <strong class="text-cyan-400 uppercase">${escapeHTML(r.reward_type)}</strong> • Value: <strong class="text-yellow-400">${escapeHTML(String(r.reward_value))}</strong></span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="editReferralReward('${r.id}')" class="bg-yellow-600 hover:bg-yellow-500 text-white px-2.5 py-1.5 rounded font-bold text-xs"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteReferralReward('${r.id}')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded font-bold text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading rewards: ${escapeHTML(err.message)}</p>`;
  }
}

export function openAddReferralRewardModal() {
  const idEl = document.getElementById('edit-ref-id');
  if (idEl) idEl.value = '';

  const titleEl = document.getElementById('ref-modal-title');
  if (titleEl) titleEl.innerText = "Add Referral Reward";

  const reqEl = document.getElementById('ref-req');
  if (reqEl) reqEl.value = '';

  const nameEl = document.getElementById('ref-name');
  if (nameEl) nameEl.value = '';

  const typeEl = document.getElementById('ref-type');
  if (typeEl) typeEl.value = 'membership';

  const valEl = document.getElementById('ref-val');
  if (valEl) valEl.value = '';

  const activeEl = document.getElementById('ref-active');
  if (activeEl) activeEl.checked = true;

  document.getElementById('modal-referral-reward')?.classList.remove('hidden');
}

export function closeReferralRewardModal() {
  document.getElementById('modal-referral-reward')?.classList.add('hidden');
}

export function editReferralReward(id) {
  const r = state.existingReferralsCache.find(x => String(x.id) === String(id));
  if (!r) return;

  const idEl = document.getElementById('edit-ref-id');
  if (idEl) idEl.value = r.id;

  const titleEl = document.getElementById('ref-modal-title');
  if (titleEl) titleEl.innerText = "Edit Referral Reward";

  const reqEl = document.getElementById('ref-req');
  if (reqEl) reqEl.value = r.referrals_required;

  const nameEl = document.getElementById('ref-name');
  if (nameEl) nameEl.value = r.reward_name;

  const typeEl = document.getElementById('ref-type');
  if (typeEl) typeEl.value = r.reward_type;

  const valEl = document.getElementById('ref-val');
  if (valEl) valEl.value = r.reward_value;

  const activeEl = document.getElementById('ref-active');
  if (activeEl) activeEl.checked = (r.is_active !== false);

  document.getElementById('modal-referral-reward')?.classList.remove('hidden');
}

export async function saveReferralReward() {
  const editId = document.getElementById('edit-ref-id')?.value;
  const referrals_required = parseInt(document.getElementById('ref-req')?.value);
  const reward_name = document.getElementById('ref-name')?.value.trim();
  const reward_type = document.getElementById('ref-type')?.value;
  const reward_value = document.getElementById('ref-val')?.value.trim();
  const is_active = document.getElementById('ref-active')?.checked;

  if (isNaN(referrals_required) || !reward_name || !reward_value) {
    alert("Please fill in all referral fields correctly.");
    return;
  }

  const payload = { referrals_required, reward_name, reward_type, reward_value, is_active };

  try {
    if (editId) {
      const { error } = await sbClient.from('referral_rewards').update(payload).eq('id', editId);
      if (error) throw error;
      alert("Referral reward updated!");
    } else {
      payload.created_at = new Date().toISOString();
      const { error } = await sbClient.from('referral_rewards').insert([payload]);
      if (error) throw error;
      alert("Referral reward added!");
    }

    closeReferralRewardModal();
    loadAdminReferralRewards();
  } catch (err) {
    alert("Failed to save reward: " + err.message);
  }
}

export async function deleteReferralReward(id) {
  if (!confirm("Are you sure you want to delete this referral reward?")) return;

  try {
    const { error } = await sbClient.from('referral_rewards').delete().eq('id', id);
    if (error) throw error;
    alert("Reward deleted!");
    loadAdminReferralRewards();
  } catch (err) {
    alert("Failed to delete reward: " + err.message);
  }
}
