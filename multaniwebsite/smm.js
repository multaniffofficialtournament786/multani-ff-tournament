// MULTANI FF OFFICIAL - SMM SERVICES MODULE
export function renderSMMView(container, user, walletBalance, refreshCallback) {
  const activeBalance = window.state?.currentUser?.balance ?? window.state?.walletBalance ?? walletBalance ?? 0;

  container.innerHTML = `
    <div style="padding: 16px; max-width: 430px; margin: 0 auto; font-family: 'Inter', sans-serif;">
      
      <!-- Top Header & Wallet Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #262f40; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="font-family: 'Rajdhani', sans-serif; font-size: 18px; font-weight: 700; color: #00f0ff; text-transform: uppercase; margin: 0;">SMM SERVICES & ORDERS</h2>
        <div style="background: #151922; border: 1px solid #262f40; padding: 6px 12px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-wallet" style="color: #ffbe00; font-size: 14px;"></i>
          <span id="smm-wallet-display" style="font-size: 13px; font-weight: 700; color: #ffbe00;">PKR ${activeBalance}</span>
        </div>
      </div>

      <!-- Buy SMM Service Card -->
      <div style="background: #0e1118; border: 1.5px solid #262f40; border-radius: 16px; padding: 18px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
        <h3 style="font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #fff; text-transform: uppercase; margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-cart-shopping" style="color: #00f0ff;"></i> Buy SMM Service
        </h3>

        <form id="app-smm-form" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #8e9bb0; margin-bottom: 6px; text-transform: uppercase;">Select Category / App</label>
            <select id="smm-cat-select" style="width: 100%; background: #06070a; border: 1px solid #262f40; border-radius: 10px; padding: 12px; color: #fff; font-size: 13px; outline: none;">
              <option value="">-- Choose Category --</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #8e9bb0; margin-bottom: 6px; text-transform: uppercase;">Select Service</label>
            <select id="smm-srv-select" disabled style="width: 100%; background: #06070a; border: 1px solid #262f40; border-radius: 10px; padding: 12px; color: #fff; font-size: 13px; outline: none;">
              <option value="">-- Choose Category First --</option>
            </select>
          </div>

          <div id="smm-info-box" style="background: #151922; padding: 10px 12px; border-radius: 10px; font-size: 12px; color: #8e9bb0; display: none; border: 1px solid #262f40;">
            <p style="margin: 0 0 4px 0;">Rate per 1000: <strong id="smm-info-rate" style="color: #00e676;">0 PKR</strong></p>
            <p style="margin: 0;">Min Qty: <strong id="smm-info-min" style="color: #fff;">0</strong></p>
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #8e9bb0; margin-bottom: 6px; text-transform: uppercase;">Target Link / Profile URL</label>
            <input id="smm-link-input" type="url" placeholder="https://instagram.com/username" required style="width: 100%; background: #06070a; border: 1px solid #262f40; border-radius: 10px; padding: 12px; color: #fff; font-size: 13px; outline: none;">
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 600; color: #8e9bb0; margin-bottom: 6px; text-transform: uppercase;">Quantity</label>
            <input id="smm-qty-input" type="number" min="1" placeholder="100" required style="width: 100%; background: #06070a; border: 1px solid #262f40; border-radius: 10px; padding: 12px; color: #fff; font-size: 13px; outline: none;">
          </div>

          <div style="background: #151922; padding: 12px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #262f40;">
            <span style="color: #8e9bb0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Total Charge:</span>
            <span id="smm-total-charge" style="font-family: 'Rajdhani', sans-serif; font-size: 16px; font-weight: 700; color: #ffbe00;">PKR 0</span>
          </div>

          <button type="submit" id="smm-submit-btn" style="width: 100%; background: linear-gradient(135deg, #00f0ff, #0072ff); color: #000; border: none; padding: 14px; border-radius: 10px; font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 800; text-transform: uppercase; cursor: pointer; box-shadow: 0 4px 14px rgba(0,240,255,0.3);">
            PLACE SMM ORDER
          </button>
        </form>
      </div>

      <!-- My Orders History Card -->
      <div style="background: #0e1118; border: 1.5px solid #262f40; border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
        <h3 style="font-family: 'Rajdhani', sans-serif; font-size: 15px; font-weight: 700; color: #8e9bb0; text-transform: uppercase; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-clock-rotate-left" style="color: #ffbe00;"></i> My SMM Orders History
        </h3>
        <div id="smm-orders-history" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
          <p style="color: #5c687a; text-align: center; padding: 12px; font-size: 12px; margin: 0;">Loading orders...</p>
        </div>
      </div>

    </div>
  `;

  loadServicesAndOrders(user, activeBalance, refreshCallback);
}

async function loadServicesAndOrders(user, currentWallet, refreshCallback) {
  const supabase = window.supabase?.createClient('https://yzirjidgdxhljbhhjfqp.supabase.co', 'sb_publishable_-dPl2eQV4afRDarZOR3QGA_RoDvmsX5');
  if (!supabase) return;

  let allServices = [];
  let selectedSrv = null;

  try {
    let { data: srvs, error } = await supabase.from('smm_services').select('*');
    if (error) console.error("Error fetching services:", error);
    allServices = srvs || [];

    const cats = [...new Set(allServices.map(s => s.category).filter(Boolean))];
    const catSel = document.getElementById('smm-cat-select');
    if (catSel) {
      catSel.innerHTML = '<option value="">-- Choose Category --</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  } catch (e) {
    console.error("SMM Services load error:", e);
  }

  const catSelectElem = document.getElementById('smm-cat-select');
  if (catSelectElem) {
    catSelectElem.addEventListener('change', function() {
      const cat = this.value;
      const srvSel = document.getElementById('smm-srv-select');
      if (!srvSel) return;
      srvSel.innerHTML = '<option value="">-- Choose Service --</option>';
      srvSel.disabled = true;
      const infoBox = document.getElementById('smm-info-box');
      if (infoBox) infoBox.style.display = 'none';
      selectedSrv = null;
      calcTotal();

      if (!cat) return;
      const filtered = allServices.filter(s => s.category === cat);
      srvSel.innerHTML = '<option value="">-- Choose Service --</option>' + filtered.map(s => `<option value="${s.id}">${s.name} (Rate: ${s.rate})</option>`).join('');
      srvSel.disabled = false;
    });
  }

  const srvSelectElem = document.getElementById('smm-srv-select');
  if (srvSelectElem) {
    srvSelectElem.addEventListener('change', function() {
      const srvId = this.value;
      selectedSrv = allServices.find(s => s.id == srvId);
      if (selectedSrv) {
        const rateElem = document.getElementById('smm-info-rate');
        const minElem = document.getElementById('smm-info-min');
        const infoBox = document.getElementById('smm-info-box');
        const qtyInput = document.getElementById('smm-qty-input');

        if (rateElem) rateElem.textContent = `${selectedSrv.rate} PKR`;
        if (minElem) minElem.textContent = selectedSrv.min || 1;
        if (infoBox) infoBox.style.display = 'block';
        if (qtyInput) qtyInput.value = selectedSrv.min || 10;
        calcTotal();
      } else {
        const infoBox = document.getElementById('smm-info-box');
        if (infoBox) infoBox.style.display = 'none';
      }
    });
  }

  const qtyInputElem = document.getElementById('smm-qty-input');
  if (qtyInputElem) {
    qtyInputElem.addEventListener('input', calcTotal);
  }

  function calcTotal() {
    const totalChargeElem = document.getElementById('smm-total-charge');
    if (!selectedSrv) {
      if (totalChargeElem) totalChargeElem.textContent = 'PKR 0';
      return;
    }
    const qElem = document.getElementById('smm-qty-input');
    const q = qElem ? Number(qElem.value) || 0 : 0;
    const r = Number(selectedSrv.rate) || 0;
    const tot = (q / 1000) * r;
    if (totalChargeElem) totalChargeElem.textContent = `PKR ${tot.toFixed(2)}`;
  }

  if (user) {
    try {
      let { data: ords } = await supabase.from('smm_orders').select('*').order('created_at', { ascending: false }).limit(10);
      const histBox = document.getElementById('smm-orders-history');
      if (histBox) {
        if (!ords || ords.length === 0) {
          histBox.innerHTML = '<p style="color: #5c687a; text-align: center; padding: 12px; font-size: 12px; margin: 0;">No orders found.</p>';
        } else {
          histBox.innerHTML = ords.map(o => `
            <div style="background: #06070a; border: 1px solid #262f40; padding: 10px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
              <div>
                <p style="color: #fff; font-weight: bold; margin: 0 0 2px 0;">${o.service_name}</p>
                <p style="color: #8e9bb0; font-size: 10px; margin: 0;">Qty: ${o.quantity} | Charge: <span style="color: #ffbe00;">PKR ${o.charge || 0}</span></p>
              </div>
              <span style="padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: #1f2636; color: #ffbe00;">${o.status || 'Pending'}</span>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.error("History load error:", e);
    }
  }

  const smmFormElem = document.getElementById('app-smm-form');
  if (smmFormElem) {
    smmFormElem.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!selectedSrv) return alert('Please select a service.');
      if (!user) return alert('Please login first.');

      const link = document.getElementById('smm-link-input')?.value.trim();
      const qty = Number(document.getElementById('smm-qty-input')?.value) || 0;
      const min = selectedSrv.min || 1;
      const rate = Number(selectedSrv.rate) || 0;
      const charge = (qty / 1000) * rate;

      if (qty < min) return alert(`Minimum quantity is ${min}`);
      if (currentWallet < charge) return alert('Insufficient tournament wallet balance!');

      const btn = document.getElementById('smm-submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'PLACING...';
      }

      try {
        const newBal = currentWallet - charge;
        let wUp = await supabase.from('wallets').update({ balance: newBal }).eq('user_id', user.id);
        if (wUp.error) {
          await supabase.from('profiles').update({ balance: newBal }).eq('id', user.id);
        }

        await supabase.from('smm_orders').insert([{
          order_id: Math.floor(100000 + Math.random() * 900000),
          service_name: selectedSrv.name,
          link: link,
          quantity: qty,
          charge: charge,
          status: 'Pending'
        }]);

        alert('Order placed successfully! Wallet balance updated.');
        if (typeof refreshCallback === 'function') refreshCallback();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'PLACE SMM ORDER';
        }
      }
    });
  }
}
