import { sbClient, escapeHTML } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export async function loadDeposits() {
  const container = document.getElementById('deposits-cards-container');
  if (!container) return;
  container.innerHTML = `<p class="text-gray-400 text-xs text-center py-4">Loading pending deposit slips...</p>`;

  const { data, error } = await sbClient
    .from('deposit_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-xs text-center py-4">Error loading deposits: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const pendingData = (data || []).filter(d => d.status && d.status.toString().toLowerCase() === 'pending');

  if (!pendingData.length) {
    container.innerHTML = `<p class="text-gray-500 text-xs text-center py-6">No pending deposit slips found.</p>`;
    return;
  }

  container.innerHTML = pendingData.map(d => {
    const avatarUrl = 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
    return `
      <div id="dep-${d.id}" class="bg-[#151922] border border-[#262f40] rounded-xl p-3.5 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <img src="${avatarUrl}" class="w-9 h-9 rounded-full object-cover border border-[#ff4624]" />
            <div>
              <h4 class="font-bold text-sm text-white">${escapeHTML(d.sender_name || 'Gamer')}</h4>
              <span class="text-cyan-400 font-mono text-[11px]">Trx ID: ${escapeHTML(d.transaction_id || '--')}</span>
            </div>
          </div>
          <span class="font-gaming font-bold text-yellow-400 text-sm">PKR ${d.amount}</span>
        </div>

        <div class="flex items-center justify-between bg-[#0e1118] p-2 rounded-lg text-xs">
          <span class="text-gray-400 text-[10px] uppercase font-bold">Method: <strong class="text-white">${escapeHTML(d.payment_method)}</strong></span>
          ${d.screenshot_url ? `
            <a href="${d.screenshot_url}" target="_blank" class="text-emerald-400 underline font-bold flex items-center gap-1">
              <i class="fa-solid fa-image"></i> View Slip
            </a>
          ` : '<span class="text-gray-500 text-[10px]">No slip</span>'}
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button onclick="reviewDeposit('${d.id}', 'approve')" class="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded font-bold text-xs uppercase cursor-pointer">APPROVE</button>
          <button onclick="reviewDeposit('${d.id}', 'reject')" class="w-1/2 bg-red-600 hover:bg-red-500 text-white py-1.5 rounded font-bold text-xs uppercase cursor-pointer">REJECT</button>
        </div>
      </div>
    `;
  }).join('');
}

export async function reviewDeposit(id, action) {
  if (!confirm(`Are you sure you want to ${action.toUpperCase()} this deposit?`)) return;

  const { data, error } = await sbClient.rpc('admin_review_deposit', {
    p_request_id: id,
    p_action: action,
    p_note: ''
  });

  if (error) {
    alert(error.message);
  } else {
    alert(`Deposit slip ${action.toUpperCase()}D successfully!`);
    loadDeposits();
    loadDashboardStats();
  }
    }
