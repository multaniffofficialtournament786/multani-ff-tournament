import { sbClient, state, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export async function loadAdminDiamondRequests() {
  const container = document.getElementById('admin-diamond-requests-container');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading diamond requests...</p>`;

  const [reqRes, profRes] = await Promise.all([
    sbClient.from('diamond_requests').select('*').order('created_at', { ascending: false }),
    sbClient.from('profiles').select('id, free_fire_name, email, phone')
  ]);

  if (reqRes.error) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error: ${escapeHTML(reqRes.error.message)}</p>`;
    return;
  }

  state.loadedDiamondRequestsList = reqRes.data || [];
  window.profilesMapCache = {};
  (profRes.data || []).forEach(p => { window.profilesMapCache[p.id] = p; });

  renderDiamondRequestsList();
}

export function filterDiamondRequests(status) {
  state.currentDiamondFilter = status;
  ['all', 'pending', 'approved', 'delivered', 'rejected'].forEach(s => {
    const btn = document.getElementById(`diamond-filter-${s}`);
    if (btn) {
      btn.className = (s === status) 
        ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ff4624] text-white whitespace-nowrap"
        : "px-3 py-1.5 rounded-lg text-xs font-bold bg-[#151922] text-gray-400 border border-[#262f40] whitespace-nowrap";
    }
  });
  renderDiamondRequestsList();
}

export function renderDiamondRequestsList() {
  const container = document.getElementById('admin-diamond-requests-container');
  if (!container) return;

  const filtered = state.loadedDiamondRequestsList.filter(req => {
    if (state.currentDiamondFilter === 'all') return true;
    return (req.status || '').toLowerCase() === state.currentDiamondFilter;
  });

  if (!filtered.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No diamond requests found for '${state.currentDiamondFilter}'.</p>`;
    return;
  }

  const profMap = window.profilesMapCache || {};

  container.innerHTML = filtered.map(req => {
    const p = profMap[req.user_id] || {};
    const statusVal = (req.status || 'pending').toLowerCase();
    const statusColor = statusVal === 'delivered' ? 'text-green-400' : (statusVal === 'rejected' ? 'text-red-400' : (statusVal === 'approved' ? 'text-cyan-400' : 'text-yellow-400'));
    const requestDateFormatted = req.created_at ? new Date(req.created_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Time';

    const isPending = statusVal === 'pending';
    const isApproved = statusVal === 'approved';
    const isDelivered = statusVal === 'delivered';
    const isRejected = statusVal === 'rejected';

    return `
      <div class="bg-[#151922] border border-[#262f40] rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-bold text-sm text-white">#${req.id} • ${escapeHTML(req.game_name)}</h4>
            <span class="text-cyan-400 font-mono text-xs">UID: ${escapeHTML(req.free_fire_uid)} (Gamer: ${escapeHTML(p.free_fire_name || 'N/A')})</span>
          </div>
          <span class="font-gaming font-bold text-orange-400 text-sm">${req.diamonds} 💎</span>
        </div>

        <div class="grid grid-cols-2 gap-2 bg-[#0e1118] p-2.5 rounded-lg text-xs">
          <div>
            <span class="text-gray-500 text-[10px] uppercase font-bold block">Coins Deducted</span>
            <span class="text-red-400 font-bold">-${req.coins_deducted} Coins</span>
          </div>
          <div>
            <span class="text-gray-500 text-[10px] uppercase font-bold block">Status</span>
            <span class="uppercase font-bold ${statusColor}">${req.status}</span>
          </div>
        </div>

        <div class="text-[11px] text-gray-400 font-mono bg-[#06070a] px-2.5 py-1.5 rounded border border-[#262f40]">
          <i class="fa-regular fa-clock text-[#ff4624] mr-1"></i> Requested on: <span class="text-white font-bold">${requestDateFormatted}</span>
        </div>

        <div class="space-y-2">
          <input type="text" id="admin-note-${req.id}" value="${escapeHTML(req.admin_notes || '')}" placeholder="Admin notes (optional)" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2 py-1.5 text-xs text-white outline-none" />
          <div>
            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Upload Delivery Proof Screenshot (Optional)</label>
            <input type="file" id="admin-ss-file-${req.id}" accept="image/*" class="w-full bg-[#06070a] border border-[#262f40] rounded p-1.5 text-xs text-gray-300 outline-none" />
            ${req.delivery_screenshot_url ? `<a href="${req.delivery_screenshot_url}" target="_blank" class="text-xs text-cyan-400 underline mt-1 block">View Current Screenshot Proof</a>` : ''}
          </div>
        </div>

        <div class="flex items-center justify-between flex-wrap pt-1 gap-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${isPending ? `
              <button onclick="updateDiamondReqStatus(${req.id}, 'approved')" class="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer">Approve</button>
              <button onclick="updateDiamondReqStatus(${req.id}, 'rejected')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer">Reject & Refund</button>
            ` : ''}
            ${isApproved ? `
              <button onclick="updateDiamondReqStatus(${req.id}, 'delivered')" class="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer">Deliver</button>
              <button onclick="updateDiamondReqStatus(${req.id}, 'rejected')" class="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer">Reject & Refund</button>
            ` : ''}
            ${isDelivered || isRejected ? `
              <span class="text-[11px] font-bold text-gray-400 italic bg-[#06070a] px-2.5 py-1 rounded">Action Completed (${req.status})</span>
            ` : ''}
          </div>
          <div>
            <button onclick="deleteDiamondRequest(${req.id})" class="bg-[#1f242d] hover:bg-red-700 text-red-400 hover:text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"><i class="fa-solid fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export async function updateDiamondReqStatus(requestId, newStatus) {
  const notes = document.getElementById(`admin-note-${requestId}`)?.value.trim() || '';
  const fileInput = document.getElementById(`admin-ss-file-${requestId}`);
  let screenshotUrl = null;

  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const path = `diamond_proofs/${Date.now()}_${file.name}`;
    const { error: upErr } = await sbClient.storage.from('deposit-screenshots').upload(path, file);
    if (!upErr) {
      const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(path);
      screenshotUrl = publicUrl;
    }
  }

  if (!confirm(`Are you sure you want to mark request #${requestId} as ${newStatus.toUpperCase()}?`)) return;

  const { data, error } = await sbClient.rpc('admin_update_diamond_request_status', {
    p_request_id: requestId,
    p_new_status: newStatus,
    p_admin_notes: notes,
    p_screenshot_url: screenshotUrl
  });

  if (error) {
    alert("Error: " + error.message);
  } else if (data && data.success) {
    alert(data.message);
    loadAdminDiamondRequests();
    loadDashboardStats();
  } else {
    alert(data?.message || "Failed to update status.");
  }
}

export async function deleteDiamondRequest(requestId) {
  if (!confirm(`Are you sure you want to delete diamond request #${requestId} permanently?`)) return;
  const { error } = await sbClient.from('diamond_requests').delete().eq('id', requestId);
  if (error) {
    alert("Failed to delete: " + error.message);
  } else {
    alert("Diamond request deleted successfully.");
    state.loadedDiamondRequestsList = state.loadedDiamondRequestsList.filter(r => r.id !== requestId);
    renderDiamondRequestsList();
    await loadDashboardStats();
  }
              }
