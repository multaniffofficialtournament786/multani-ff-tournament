import { sbClient, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export async function loadAdminWithdrawals() {
  const container = document.getElementById('admin-withdrawal-requests-list');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading withdrawal requests...</p>`;

  try {
    const { data: withdrawals, error: wErr } = await sbClient
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (wErr) throw wErr;

    const list = withdrawals || [];
    const userIds = [...new Set(list.map(w => w.user_id))];
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profs } = await sbClient.from('profiles').select('id, free_fire_name, free_fire_uid, full_name, email').in('id', userIds);
      if (profs) {
        profs.forEach(p => { profilesMap[p.id] = p; });
      }
    }

    let totalFeesEarned = 0;
    try {
      const { data: feesData } = await sbClient.from('withdrawal_fee_earnings').select('amount');
      if (feesData) {
        totalFeesEarned = feesData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      }
    } catch (e) {
      console.log("Fee earnings notice:", e);
    }

    let pendingCount = 0;
    let approvedCount = 0;
    let totalWithdrawalAmt = 0;

    list.forEach(w => {
      const st = (w.status || '').toLowerCase();
      if (st === 'pending') pendingCount++;
      if (st === 'approved') {
        approvedCount++;
        totalWithdrawalAmt += Number(w.amount || 0);
      }
    });

    const statPending = document.getElementById('admin-stat-pending');
    if (statPending) statPending.innerText = pendingCount;

    const statApproved = document.getElementById('admin-stat-approved');
    if (statApproved) statApproved.innerText = approvedCount;

    const statTotalAmt = document.getElementById('admin-stat-total-amt');
    if (statTotalAmt) statTotalAmt.innerText = `PKR ${totalWithdrawalAmt}`;

    const statFees = document.getElementById('admin-stat-fees');
    if (statFees) statFees.innerText = `PKR ${totalFeesEarned}`;

    const badgeWd = document.getElementById('badge-withdrawals');
    if (badgeWd) {
      badgeWd.innerText = pendingCount;
      badgeWd.classList.toggle('hidden', pendingCount === 0);
    }

    if (!list.length) {
      container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No withdrawal requests found.</p>`;
      return;
    }

    container.innerHTML = list.map(w => {
      const p = profilesMap[w.user_id] || {};
      const playerName = p.free_fire_name || p.full_name || 'Player';
      const playerUid = p.free_fire_uid || '--';
      const statusVal = (w.status || 'pending').toLowerCase();
      const isPending = statusVal === 'pending';

      let badgeStyle = 'background:rgba(255,190,0,0.2); color:#ffbe00;';
      if (statusVal === 'approved') badgeStyle = 'background:rgba(0,230,118,0.2); color:#00e676;';
      if (statusVal === 'rejected') badgeStyle = 'background:rgba(255,23,68,0.2); color:#ff1744;';

      return `
        <div class="bg-[#151922] border border-[#262f40] rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-bold text-sm text-white">${escapeHTML(playerName)} <span class="text-cyan-400 font-mono text-xs">(UID: ${escapeHTML(playerUid)})</span></h4>
              <span class="text-gray-400 text-[11px]">Method: <strong class="text-yellow-400">${escapeHTML(w.payment_method)}</strong> • Date: ${new Date(w.created_at).toLocaleString()}</span>
            </div>
            <span class="text-[10px] px-2.5 py-1 rounded font-bold uppercase ${badgeStyle}">${escapeHTML(w.status)}</span>
          </div>

          <div class="bg-[#0e1118] p-2.5 rounded-lg text-xs grid grid-cols-2 gap-2">
            <div>Requested: <strong class="text-white">PKR ${w.amount}</strong></div>
            <div>Fee (2%): <strong class="text-red-400">PKR ${w.fee || (w.amount * 0.02)}</strong></div>
            <div>Net Payout: <strong class="text-emerald-400">PKR ${w.net_amount || (w.amount * 0.98)}</strong></div>
            <div>Account Title: <strong class="text-white">${escapeHTML(w.account_name || 'N/A')}</strong></div>
            <div class="col-span-2">Account Number: <strong class="text-cyan-400 font-mono text-sm">${escapeHTML(w.account_number)}</strong></div>
          </div>

          ${w.payment_screenshot_url ? `
            <div>
              <a href="${w.payment_screenshot_url}" target="_blank" class="text-xs text-cyan-400 underline font-bold flex items-center gap-1">
                <i class="fa-solid fa-image"></i> View Payment Proof Screenshot
              </a>
            </div>
          ` : ''}

          ${isPending ? `
            <div class="border-t border-[#262f40] pt-3 mt-2 space-y-2.5">
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Upload Payment Screenshot Proof</label>
                <input type="file" id="admin-screenshot-${w.id}" class="w-full bg-[#06070a] border border-[#262f40] rounded p-1.5 text-xs text-gray-300 outline-none" accept="image/*" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Admin Note / Reason</label>
                <input type="text" id="admin-note-${w.id}" value="${escapeHTML(w.admin_note || '')}" placeholder="e.g. Paid via Easypaisa" class="w-full bg-[#06070a] border border-[#262f40] rounded p-2 text-xs text-white outline-none" />
              </div>
              <div class="flex gap-2 pt-1">
                <button onclick="reviewWithdrawalRequest('${w.id}', 'approve')" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-bold uppercase cursor-pointer"><i class="fa-solid fa-check"></i> APPROVE</button>
                <button onclick="reviewWithdrawalRequest('${w.id}', 'reject')" class="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded text-xs font-bold uppercase cursor-pointer"><i class="fa-solid fa-xmark"></i> REJECT</button>
              </div>
            </div>
          ` : `
            ${w.admin_note ? `<div class="text-[11px] text-gray-400 mt-1"><strong class="text-cyan-400">Admin Note:</strong> ${escapeHTML(w.admin_note)}</div>` : ''}
          `}
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading withdrawal requests: ${escapeHTML(err.message)}</p>`;
  }
}

export async function reviewWithdrawalRequest(withdrawalId, action) {
  if (!confirm(`Are you sure you want to ${action.toUpperCase()} this withdrawal request?`)) return;

  try {
    let screenshotUrl = null;
    const fileInput = document.getElementById(`admin-screenshot-${withdrawalId}`);
    const noteInput = document.getElementById(`admin-note-${withdrawalId}`);
    const adminNote = noteInput ? noteInput.value.trim() : '';

    if (action === 'approve') {
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please upload a payment screenshot proof before approving!");
        return;
      }

      const file = fileInput.files[0];
      const filePath = `withdrawals/${withdrawalId}_${Date.now()}_${file.name}`;

      const { error: uploadErr } = await sbClient.storage
        .from('WITHDRAWAL-PAYMENT-SCREENSHOTS')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        throw new Error("Failed to upload screenshot to storage.");
      }

      const { data: pubData } = sbClient.storage
        .from('WITHDRAWAL-PAYMENT-SCREENSHOTS')
        .getPublicUrl(filePath);

      screenshotUrl = pubData.publicUrl;

      await sbClient.from('withdrawals').update({
        payment_screenshot_url: screenshotUrl
      }).eq('id', withdrawalId);
    }

    const { data, error } = await sbClient.rpc('admin_review_withdrawal', {
      p_withdrawal_id: withdrawalId,
      p_action: action,
      p_admin_note: adminNote || (action === 'approve' ? 'Approved & paid successfully.' : 'Rejected.')
    });

    if (error) throw error;

    alert(`Withdrawal request ${action}d successfully!`);
    loadAdminWithdrawals();
    loadDashboardStats();

  } catch (err) {
    alert(err.message || "Failed to process review.");
  }
      }
