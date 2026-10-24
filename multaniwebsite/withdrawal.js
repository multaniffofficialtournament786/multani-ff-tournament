import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';
import { syncAuthAndProfile } from './auth.js';

export async function renderWithdrawal() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }
  await syncAuthAndProfile();

  let withdrawHistoryHtml = `<p style="font-size:12px; color:var(--text-dim); text-align:center; padding:16px;">No withdrawal requests yet.</p>`;
  try {
    const { data: wList, error: wErr } = await sbClient.from('withdrawals').select('*').eq('user_id', state.currentUser.id).order('created_at', { ascending: false });
    if (!wErr && wList && wList.length > 0) {
      withdrawHistoryHtml = wList.map(w => {
        const accNum = w.account_number || '';
        const maskedAcc = accNum.length > 4 ? '*'.repeat(accNum.length - 4) + accNum.slice(-4) : accNum;
        
        let statusBadgeStyle = 'background:rgba(255,190,0,0.2); color:var(--accent-gold);';
        if (w.status === 'approved') statusBadgeStyle = 'background:rgba(0,230,118,0.2); color:var(--success);';
        if (w.status === 'rejected') statusBadgeStyle = 'background:rgba(255,23,68,0.2); color:var(--danger);';

        return `
          <div class="tx-item" style="border-left: 3px solid ${w.status === 'approved' ? 'var(--success)' : (w.status === 'rejected' ? 'var(--danger)' : 'var(--accent-gold)')}; margin-bottom:10px;">
            <div class="tx-info">
              <h4 style="color:#fff;">${escapeHTML(w.payment_method)} • PKR ${w.amount}</h4>
              <span>
                Fee (2%): PKR ${w.fee || (w.amount * 0.02)} | <strong>Net: PKR ${w.net_amount || (w.amount * 0.98)}</strong><br>
                Account: ${escapeHTML(maskedAcc)} (${escapeHTML(w.account_name || 'N/A')})<br>
                Date: ${new Date(w.created_at).toLocaleString()}
              </span>
            </div>
            <div style="text-align:right; flex-shrink:0;">
              <span style="font-size:10px; padding:3px 8px; border-radius:6px; font-weight:bold; text-transform:uppercase; ${statusBadgeStyle}">${escapeHTML(w.status)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error("Error loading withdrawals:", err);
  }

  const balance = state.currentProfile?.wallet_balance || 0;

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="wallet-hero" style="margin-bottom:14px;">
        <span class="wallet-balance-title">Available Wallet Balance</span>
        <div class="wallet-amount" style="font-size:32px; margin-bottom:0;">PKR ${balance}</div>
      </div>

      <div class="player-hero-card" style="padding:16px; margin-bottom:16px;">
        <h3 style="font-family:var(--font-gaming); font-size:16px; color:var(--accent-gold); text-transform:uppercase; margin-bottom:12px;">
          <i class="fa-solid fa-money-bill-transfer"></i> Request Withdrawal / Cashout
        </h3>

        <form id="withdrawal-form">
          <div class="form-group">
            <label class="form-label">Withdrawal Amount (Min PKR 200)</label>
            <input type="number" id="wd-amount" class="form-input" placeholder="e.g. 1000" min="200" required oninput="window.calculateWithdrawalNet()" />
          </div>

          <div style="background:#0a0e16; border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:14px; font-size:12px; display:flex; justify-content:space-between;">
            <span>Withdrawal Fee (2%): <strong id="wd-fee-display" style="color:var(--danger);">PKR 0</strong></span>
            <span>Net You Receive: <strong id="wd-net-display" style="color:var(--success);">PKR 0</strong></span>
          </div>

          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select id="wd-method" class="form-input" required>
              <option value="JazzCash">JazzCash</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="SadaPay">SadaPay</option>
              <option value="NayaPay">NayaPay</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Account Holder Name</label>
            <input type="text" id="wd-acc-name" class="form-input" placeholder="Enter account title" required />
          </div>

          <div class="form-group">
            <label class="form-label">Account Number / Mobile Number</label>
            <input type="text" id="wd-acc-num" class="form-input" placeholder="e.g. 03001234567" required />
          </div>

          <button type="submit" id="btn-submit-withdrawal" class="btn btn-primary" style="background:linear-gradient(135deg, #00e676, #00b0ff); color:#000;">
            SUBMIT WITHDRAWAL REQUEST
          </button>
        </form>
      </div>

      <div class="section-title"><span>📜 Withdrawal History</span></div>
      <div>${withdrawHistoryHtml}</div>
    </div>
  `;

  document.getElementById('withdrawal-form').onsubmit = submitWithdrawalRequest;
}

export function calculateWithdrawalNet() {
  const amtVal = parseFloat(document.getElementById('wd-amount').value) || 0;
  const fee = amtVal * 0.02;
  const net = amtVal - fee;
  const feeEl = document.getElementById('wd-fee-display');
  const netEl = document.getElementById('wd-net-display');
  if (feeEl) feeEl.innerText = `PKR ${fee.toFixed(2)}`;
  if (netEl) netEl.innerText = `PKR ${net.toFixed(2)}`;
}

export async function submitWithdrawalRequest(e) {
  e.preventDefault();
  if (!state.currentUser) return;

  const amount = parseFloat(document.getElementById('wd-amount').value);
  const method = document.getElementById('wd-method').value;
  const accNum = document.getElementById('wd-acc-num').value.trim();
  const accName = document.getElementById('wd-acc-name').value.trim();

  if (isNaN(amount) || amount < 200) {
    Toast.show("Minimum withdrawal amount is PKR 200.", "error");
    return;
  }

  const currentBalance = state.currentProfile?.wallet_balance || 0;
  if (amount > currentBalance) {
    Toast.show("Requested amount exceeds your available wallet balance!", "error");
    return;
  }

  const fee = amount * 0.02;
  const net = amount - fee;

  const confirmMsg = `Please verify your withdrawal:\n• Requested: PKR ${amount}\n• Fee (2%): PKR ${fee}\n• Net Payout: PKR ${net}\n• Method: ${method} (${accNum})`;
  if (!confirm(confirmMsg)) return;

  const submitBtn = document.getElementById('btn-submit-withdrawal');
  if (submitBtn) submitBtn.disabled = true;
  Loader.show("Submitting withdrawal request...");

  try {
    const { error } = await sbClient.rpc('request_withdrawal', {
      p_amount: amount,
      p_method: method,
      p_acc_num: accNum,
      p_acc_name: accName
    });

    if (error) throw error;

    Sound.playBrandName();
    Loader.hide();
    Toast.show("Withdrawal request submitted successfully!", "success");
    await syncAuthAndProfile();
    renderWithdrawal();
  } catch (err) {
    Loader.hide();
    if (submitBtn) submitBtn.disabled = false;
    Toast.show(err.message || "Failed to submit withdrawal request.", "error");
  }
}
