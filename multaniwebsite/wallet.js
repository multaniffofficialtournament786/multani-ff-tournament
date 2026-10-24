import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export async function renderWallet() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }
  await syncAuthAndProfile();
  
  let deposits = [];
  let transactions = [];
  try {
    const [txRes, depRes] = await Promise.all([
      sbClient.from('wallet_transactions').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false }),
      sbClient.from('deposit_requests').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false })
    ]);
    transactions = txRes.data || [];
    deposits = depRes.data || [];
  } catch (e) {
    console.error(e);
  }

  const formattedDeposits = deposits.map(d => ({
    ...d,
    sortDate: new Date(d.created_at).getTime(),
    isDeposit: true,
    statusLower: (d.status || '').toLowerCase()
  }));

  const formattedTxs = transactions.map(tx => ({
    ...tx,
    sortDate: new Date(tx.created_at).getTime(),
    isDeposit: false,
    statusLower: 'approved'
  }));

  const combinedHistory = [...formattedDeposits, ...formattedTxs].sort((a, b) => b.sortDate - a.sortDate);
  window._allWalletHistory = combinedHistory;

  const view = document.getElementById('app-view');
  view.innerHTML = `
    <div class="view-container">
      <div class="wallet-hero">
        <span class="wallet-balance-title">Current Balance</span>
        <div class="wallet-amount">PKR ${state.currentProfile?.wallet_balance || 0}</div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" style="flex:1;" onclick="window.Router.navigate('withdrawal')"><i class="fa-solid fa-money-bill-transfer"></i> Withdraw</button>
          <button class="btn btn-secondary" style="flex:1;" onclick="window.Router.navigate('deposit')"><i class="fa-solid fa-circle-arrow-down"></i> Add Cash</button>
        </div>
      </div>

      <div class="section-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>Transaction History Filter</span>
        <button onclick="window.toggleTransactionHistory()" id="tx-toggle-btn" class="btn btn-secondary btn-sm" style="font-size:11px; padding:4px 8px; width:auto;">
          <span>Show History</span> <i id="tx-toggle-arrow" class="fa-solid fa-chevron-down"></i>
        </button>
      </div>
      
      <div style="display:flex; gap:6px; margin-bottom:14px; width:100%;">
        <button onclick="window.filterWalletHistory('all')" id="w-filter-all" class="filter-tab-btn active" style="flex:1; padding:8px 4px;">All / Pending</button>
        <button onclick="window.filterWalletHistory('deposit')" id="w-filter-deposit" class="filter-tab-btn" style="flex:1; padding:8px 4px;">Payment Deposit</button>
        <button onclick="window.filterWalletHistory('rejected')" id="w-filter-rejected" class="filter-tab-btn" style="flex:1; padding:8px 4px;">Rejected & Refund</button>
      </div>

      <div id="wallet-history-wrapper" class="hidden" style="margin-top:10px;">
        <div id="wallet-history-container"></div>
      </div>
    </div>
  `;

  filterWalletHistory('all');
}

export function toggleTransactionHistory() {
  const wrapper = document.getElementById('wallet-history-wrapper');
  const arrow = document.getElementById('tx-toggle-arrow');
  const btn = document.getElementById('tx-toggle-btn');
  if (wrapper && arrow && btn) {
    const isHidden = wrapper.classList.contains('hidden');
    wrapper.classList.toggle('hidden', !isHidden);
    arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    const span = btn.querySelector('span');
    if (span) span.innerText = isHidden ? 'Hide History' : 'Show History';
  }
}

export function filterWalletHistory(filterType) {
  state.currentWalletFilter = filterType;
  ['all', 'deposit', 'rejected'].forEach(s => {
    const btn = document.getElementById(`w-filter-${s}`);
    if (btn) btn.classList.toggle('active', s === filterType);
  });

  const container = document.getElementById('wallet-history-container');
  if (!container) return;

  const history = window._allWalletHistory || [];
  const filtered = history.filter(item => {
    if (filterType === 'deposit') return item.isDeposit;
    if (filterType === 'rejected') return item.statusLower === 'rejected' || (item.description && item.description.toLowerCase().includes('refund'));
    return true;
  });

  if (!filtered.length) {
    container.innerHTML = `<p style="font-size:12px; color:var(--text-dim); text-align:center; padding:20px;">No transaction history found for '${filterType}'.</p>`;
    return;
  }

  container.innerHTML = filtered.map(item => {
    if (item.isDeposit) {
      let badgeColor = 'background:#ff9800; color:#000;';
      if (item.status === 'approved') badgeColor = 'background:#00e676; color:#000;';
      if (item.status === 'rejected') badgeColor = 'background:#ff1744; color:#fff;';

      return `
        <div class="tx-item" style="border-left: 3px solid ${item.status === 'approved' ? '#00e676' : (item.status === 'rejected' ? '#ff1744' : '#ff9800')};">
          <div class="tx-info">
            <h4>Deposit (${escapeHTML(item.payment_method)})</h4>
            <span>Email: <strong>${escapeHTML(item.transaction_id)}</strong> • ${new Date(item.created_at).toLocaleString()}</span>
          </div>
          <div style="text-align:right;">
            <div class="tx-amount tx-positive">PKR ${item.amount}</div>
            <span style="font-size:10px; padding:2px 8px; border-radius:6px; font-weight:bold; text-transform:uppercase; ${badgeColor}">${escapeHTML(item.status)}</span>
          </div>
        </div>
      `;
    } else {
      const isPrize = item.transaction_type === 'prize' || (item.description && item.description.toLowerCase().includes('prize'));
      const isReferral = item.transaction_type === 'referral_bonus' || (item.description && item.description.toLowerCase().includes('referral'));
      const isPositive = item.amount > 0 || isPrize || isReferral;

      return `
        <div class="tx-item" style="${isPrize || isReferral ? 'border-left: 3px solid var(--accent-gold);' : ''}">
          <div class="tx-info">
            <h4>${escapeHTML(isPrize ? '🏆 ' + (item.description || 'Tournament Prize Won') : (isReferral ? '🎁 ' + (item.description || 'Referral Bonus Claimed') : (item.description || item.transaction_type)))}</h4>
            <span>${new Date(item.created_at).toLocaleString()}</span>
          </div>
          <div class="tx-amount ${isPositive ? 'tx-positive' : 'tx-negative'}">${isPositive ? '+' : ''}${item.amount} PKR</div>
        </div>
      `;
    }
  }).join('');
}

export function renderDeposit() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="player-hero-card" style="margin-bottom:14px;">
        <h4 id="dep-box-header" style="font-size:13px; text-transform:uppercase; color:var(--accent-gold); margin-bottom:6px;">Official Payment Details</h4>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <div id="dep-box-number" style="font-size:18px; font-weight:bold; color:var(--accent-cyan);">03186815926</div>
            <div id="dep-box-title" style="font-size:12px; color:var(--text-muted); margin-top:2px;">Title: <strong>MUHAMMAD NADEEM</strong> (Easypaisa)</div>
          </div>
          <button onclick="navigator.clipboard.writeText(document.getElementById('dep-box-number').innerText); Toast.show('Number copied to clipboard!', 'success');" class="btn btn-primary btn-sm" style="padding:8px 12px; font-size:12px; flex-shrink:0;">
            <i class="fa-solid fa-copy"></i> COPY
          </button>
        </div>
      </div>

      <form id="dep-form">
        <div class="form-group">
          <label class="form-label">Deposit Amount (PKR)</label>
          <input type="number" id="dp-amount" class="form-input" placeholder="e.g. 100" required min="10" />
        </div>

        <div class="form-group">
          <label class="form-label">Select Payment Method</label>
          <select id="dp-method" class="form-input" onchange="window.updatePaymentDetailsDisplay(this.value)" required>
            <option value="Easypaisa">Easypaisa</option>
            <option value="SadaPay">SadaPay</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Sender Account Name</label>
          <input type="text" id="dp-sender" class="form-input" placeholder="Your account title name" required />
        </div>

        <div class="form-group">
          <label class="form-label">Your Gmail Address</label>
          <input type="email" id="dp-gmail" class="form-input" value="${state.currentUser.email || ''}" placeholder="e.g. yourname@gmail.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">Payment Screenshot</label>
          <input type="file" id="dp-file" class="form-input" accept="image/*" required />
        </div>

        <button type="submit" id="btn-submit-deposit" class="btn btn-primary" style="margin-top:8px;">SUBMIT DEPOSIT SLIP</button>
      </form>
    </div>
  `;

  document.getElementById('dep-form').onsubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('dp-file');
    const file = fileInput.files[0];
    if (!file) {
      Toast.show("Please select a screenshot file.", "error");
      return;
    }

    const submitBtn = document.getElementById('btn-submit-deposit');
    if (submitBtn) submitBtn.disabled = true;
    Loader.show("Uploading deposit slip...");

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${state.currentUser.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await sbClient.storage
        .from('deposit-screenshots')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error("Storage Upload Failed: " + uploadError.message);

      const { data: publicUrlData } = sbClient.storage
        .from('deposit-screenshots')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl || '';

      const { error: dbError } = await sbClient.from('deposit_requests').insert([{
        user_id: state.currentUser.id,
        amount: parseFloat(document.getElementById('dp-amount').value),
        payment_method: document.getElementById('dp-method').value,
        sender_name: document.getElementById('dp-sender').value.trim(),
        transaction_id: document.getElementById('dp-gmail').value.trim(),
        screenshot_url: publicUrl,
        status: 'pending'
      }]);

      if (dbError) throw new Error("Database Insert Failed: " + dbError.message);

      Sound.playBrandName();
      Toast.show("Slip submitted successfully! Check Wallet for status.", "success");
      window.Router.navigate('wallet');
    } catch (err) {
      console.error("Deposit submission error:", err);
      Toast.show(err.message || "Failed to submit deposit.", "error");
    } finally {
      Loader.hide();
      if (submitBtn) submitBtn.disabled = false;
    }
  };
}

export function updatePaymentDetailsDisplay(method) {
  const numEl = document.getElementById('dep-box-number');
  const titleEl = document.getElementById('dep-box-title');
  if (!numEl || !titleEl) return;
  if (method === 'SadaPay') {
    numEl.innerText = "03281926729";
    titleEl.innerHTML = "Title: <strong>MUHAMMAD NADEDEEM</strong> (SadaPay)";
  } else {
    numEl.innerText = "03186815926";
    titleEl.innerHTML = "Title: <strong>MUHAMMAD NADEEM</strong> (Easypaisa)";
  }
}
