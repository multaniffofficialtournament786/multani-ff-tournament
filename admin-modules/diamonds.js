import { sbClient, state, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

let activeDiamondTab = 'packs';
let loadedPackagesList = [];

export async function loadAdminDiamondRequests() {
  updateTabButtonsUI();
  if (activeDiamondTab === 'packs') {
    await loadAdminDiamondPackages();
  } else {
    await fetchAndRenderRequests();
  }
}

function updateTabButtonsUI() {
  const btnPacks = document.getElementById('tab-btn-diamond-packs');
  const btnReqs = document.getElementById('tab-btn-diamond-requests');

  if (btnPacks && btnReqs) {
    if (activeDiamondTab === 'packs') {
      btnPacks.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-[#ff4624] text-white shadow-lg cursor-pointer";
      btnReqs.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-[#151922] text-gray-400 hover:text-white cursor-pointer";
    } else {
      btnPacks.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-[#151922] text-gray-400 hover:text-white cursor-pointer";
      btnReqs.className = "py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 bg-[#ff4624] text-white shadow-lg cursor-pointer";
    }
  }
}

export async function switchDiamondTab(tab) {
  activeDiamondTab = tab;
  updateTabButtonsUI();
  if (activeDiamondTab === 'packs') {
    await loadAdminDiamondPackages();
  } else {
    await fetchAndRenderRequests();
  }
}

// Global window mappings
window.switchDiamondTab = switchDiamondTab;
window.saveDiamondPackage = saveDiamondPackage;
window.deleteDiamondPackage = deleteDiamondPackage;
window.addNewDiamondPackage = addNewDiamondPackage;
window.filterDiamondRequests = filterDiamondRequests;
window.updateDiamondReqStatus = updateDiamondReqStatus;
window.deleteDiamondRequest = deleteDiamondRequest;

/* =========================================================
   1. DIAMOND PACKAGES MANAGEMENT (PRICE LIST & EDIT)
   ========================================================= */

async function loadAdminDiamondPackages() {
  const content = document.getElementById('admin-diamond-requests-container');
  if (!content) return;
  content.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading diamond packages...</p>`;

  const { data, error } = await sbClient
    .from('diamond_packages')
    .select('*')
    .order('diamond_count', { ascending: true });

  if (error) {
    content.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error: ${escapeHTML(error.message)}</p>`;
    return;
  }

  loadedPackagesList = data || [];
  renderDiamondPackagesList();
}

function renderDiamondPackagesList() {
  const content = document.getElementById('admin-diamond-requests-container');
  if (!content) return;

  const cardsHtml = loadedPackagesList.map(pkg => `
    <div class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-gray-400">Pack ID: #${pkg.id}</span>
        <span class="text-xs font-bold ${pkg.is_active ? 'text-green-400' : 'text-red-400'}">
          ${pkg.is_active ? '● Active' : '● Hidden'}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="text-[10px] text-gray-400 uppercase font-bold block mb-1">Diamonds 💎</label>
          <input type="number" id="pkg-dia-${pkg.id}" value="${pkg.diamond_count}" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2.5 py-1.5 text-orange-400 font-bold font-mono text-xs outline-none focus:border-[#ff4624]" />
        </div>
        <div>
          <label class="text-[10px] text-gray-400 uppercase font-bold block mb-1">Price (Coins) 🪙</label>
          <input type="number" id="pkg-coin-${pkg.id}" value="${pkg.coin_price}" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2.5 py-1.5 text-cyan-400 font-bold font-mono text-xs outline-none focus:border-[#ff4624]" />
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 gap-2">
        <button id="btn-pkg-save-${pkg.id}" onclick="saveDiamondPackage(${pkg.id})" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-xs font-bold cursor-pointer transition">
          <i class="fa-solid fa-check mr-1"></i> Save Changes
        </button>
        <button onclick="deleteDiamondPackage(${pkg.id})" class="bg-[#1f242d] hover:bg-red-700 text-red-400 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <!-- Add New Package Card -->
    <div class="bg-[#12161f] border border-[#ff4624]/40 rounded-xl p-3.5 space-y-2 mb-4">
      <h4 class="text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
        <i class="fa-solid fa-plus-circle text-[#ff4624]"></i> Add New Diamond Pack
      </h4>
      <div class="grid grid-cols-2 gap-2">
        <input type="number" id="new-pkg-diamonds" placeholder="Diamonds (e.g. 100)" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-[#ff4624]" />
        <input type="number" id="new-pkg-coins" placeholder="Price Coins (e.g. 150)" class="w-full bg-[#06070a] border border-[#262f40] rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-[#ff4624]" />
      </div>
      <button id="btn-add-pkg" onclick="addNewDiamondPackage()" class="w-full bg-[#ff4624] hover:bg-[#e03d1f] text-white py-2 rounded text-xs font-bold transition cursor-pointer">
        + Add Pack to Store
      </button>
    </div>

    <!-- Existing Packages -->
    <div class="space-y-3">
      ${cardsHtml || '<p class="text-gray-500 text-xs text-center py-6">No diamond packages found.</p>'}
    </div>
  `;
}

export async function saveDiamondPackage(pkgId) {
  const diaInput = document.getElementById(`pkg-dia-${pkgId}`);
  const coinInput = document.getElementById(`pkg-coin-${pkgId}`);
  const saveBtn = document.getElementById(`btn-pkg-save-${pkgId}`);

  const diamond_count = parseInt(diaInput.value);
  const coin_price = parseInt(coinInput.value);

  if (!diamond_count || !coin_price || diamond_count <= 0 || coin_price <= 0) {
    alert("Please enter valid Diamond and Coin values.");
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = "Saving...";
  }

  const { data, error } = await sbClient
    .from('diamond_packages')
    .update({ diamond_count, coin_price })
    .eq('id', pkgId)
    .select();

  if (error || !data || data.length === 0) {
    alert("Save failed! " + (error ? error.message : "Database did not update."));
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-check mr-1"></i> Save Changes`;
    }
  } else {
    alert("Package updated! All players will now see the new price.");
    await loadAdminDiamondPackages();
  }
}

export async function addNewDiamondPackage() {
  const diaInput = document.getElementById('new-pkg-diamonds');
  const coinInput = document.getElementById('new-pkg-coins');
  const addBtn = document.getElementById('btn-add-pkg');

  const diamond_count = parseInt(diaInput.value);
  const coin_price = parseInt(coinInput.value);

  if (!diamond_count || !coin_price || diamond_count <= 0 || coin_price <= 0) {
    alert("Please enter valid Diamond and Coin values.");
    return;
  }

  if (addBtn) {
    addBtn.disabled = true;
    addBtn.innerText = "Adding...";
  }

  const { data, error } = await sbClient
    .from('diamond_packages')
    .insert([{ diamond_count, coin_price, is_active: true }])
    .select();

  if (error) {
    alert("Error adding package: " + error.message);
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.innerText = "+ Add Pack to Store";
    }
  } else {
    alert("New package added successfully!");
    diaInput.value = '';
    coinInput.value = '';
    await loadAdminDiamondPackages();
  }
}

export async function deleteDiamondPackage(pkgId) {
  if (!confirm(`Are you sure you want to delete pack #${pkgId}?`)) return;

  const { data, error } = await sbClient
    .from('diamond_packages')
    .delete()
    .eq('id', pkgId)
    .select();

  if (error) {
    alert("Cannot delete: " + error.message);
  } else if (!data || data.length === 0) {
    alert("Delete failed! Database permission blocked.");
  } else {
    alert("Package deleted successfully.");
    await loadAdminDiamondPackages();
  }
}

/* =========================================================
   2. PLAYER PURCHASE REQUESTS MANAGEMENT
   ========================================================= */

async function fetchAndRenderRequests() {
  const content = document.getElementById('admin-diamond-requests-container');
  if (!content) return;

  content.innerHTML = `
    <!-- Filter Pills -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
      ${['all', 'pending', 'approved', 'delivered', 'rejected'].map(s => `
        <button id="diamond-filter-${s}" onclick="filterDiamondRequests('${s}')" class="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${(state.currentDiamondFilter || 'all') === s ? 'bg-[#ff4624] text-white' : 'bg-[#151922] text-gray-400 border border-[#262f40]'}">
          ${s.toUpperCase()}
        </button>
      `).join('')}
    </div>
    <div id="diamond-requests-items" class="space-y-3">
      <p class="text-gray-400 text-xs text-center py-4">Loading requests...</p>
    </div>
  `;

  const [reqRes, profRes] = await Promise.all([
    sbClient.from('diamond_requests').select('*').order('created_at', { ascending: false }),
    sbClient.from('profiles').select('id, free_fire_name, email, phone')
  ]);

  if (reqRes.error) {
    document.getElementById('diamond-requests-items').innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error: ${escapeHTML(reqRes.error.message)}</p>`;
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
  const container = document.getElementById('diamond-requests-items');
  if (!container) return;

  const filtered = (state.loadedDiamondRequestsList || []).filter(req => {
    if ((state.currentDiamondFilter || 'all') === 'all') return true;
    return (req.status || '').toLowerCase() === state.currentDiamondFilter;
  });

  if (!filtered.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No diamond requests found for '${state.currentDiamondFilter || 'all'}'.</p>`;
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
    fetchAndRenderRequests();
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
