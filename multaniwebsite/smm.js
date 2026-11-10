// MULTANI FF OFFICIAL - SMM SERVICES MODULE
export function renderSMMView(container, user, walletBalance, refreshCallback) {
  // Get active balance from state or profile if passed
  const activeBalance = window.state?.currentUser?.balance ?? window.state?.walletBalance ?? walletBalance ?? 0;

  container.innerHTML = `
    <div class="view-container space-y-4">
      <div class="flex items-center justify-between border-b border-[#262f40] pb-3">
        <h2 class="font-gaming text-lg font-bold text-cyan-400">SMM SERVICES & ORDERS</h2>
        <div class="bg-[#151922] border border-[#262f40] px-3 py-1.5 rounded-lg flex items-center gap-2">
          <i class="fa-solid fa-wallet text-amber-400 text-sm"></i>
          <span id="smm-wallet-display" class="text-xs font-bold text-amber-400">PKR ${activeBalance}</span>
        </div>
      </div>

      <!-- Buy SMM Service Card -->
      <div class="bg-[#0e1118] border border-[#262f40] p-4 rounded-2xl space-y-3.5 shadow-xl">
        <h3 class="font-gaming text-sm font-bold uppercase text-white flex items-center gap-2">
          <i class="fa-solid fa-cart-shopping text-cyan-400"></i> Buy SMM Service
        </h3>

        <form id="app-smm-form" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-gray-300 mb-1">Select Category</label>
            <select id="smm-cat-select" class="w-full bg-[#06070a] border border-[#262f40] rounded-xl p-3 text-white text-sm outline-none">
              <option value="">-- Choose Category --</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-gray-300 mb-1">Select Service</label>
            <select id="smm-srv-select" class="w-full bg-[#06070a] border border-[#262f40] rounded-xl p-3 text-white text-sm outline-none" disabled>
              <option value="">-- Choose Category First --</option>
            </select>
          </div>

          <div id="smm-info-box" class="bg-[#151922] p-2.5 rounded-xl text-gray-400 text-xs hidden space-y-1 border border-[#262f40]">
            <p>Rate per 1000: <strong id="smm-info-rate" class="text-emerald-400">0 PKR</strong></p>
            <p>Min Qty: <strong id="smm-info-min" class="text-white">0</strong></p>
          </div>

          <div>
            <label class="block font-bold text-gray-300 mb-1">Target Link / Profile URL</label>
            <input id="smm-link-input" type="url" placeholder="https://instagram.com/username" required class="w-full bg-[#06070a] border border-[#262f40] rounded-xl p-3 text-white text-sm outline-none">
          </div>

          <div>
            <label class="block font-bold text-gray-300 mb-1">Quantity</label>
            <input id="smm-qty-input" type="number" min="1" placeholder="100" required class="w-full bg-[#06070a] border border-[#262f40] rounded-xl p-3 text-white text-sm outline-none">
          </div>

          <div class="bg-[#151922] p-3 rounded-xl flex justify-between items-center border border-[#262f40]">
            <span class="text-gray-300 font-bold">Total Charge:</span>
            <span id="smm-total-charge" class="font-gaming text-base font-bold text-amber-400">PKR 0</span>
          </div>

          <button type="submit" id="smm-submit-btn" class="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-gaming font-bold uppercase text-sm tracking-wide transition shadow-lg">
            PLACE SMM ORDER
          </button>
        </form>
      </div>

      <!-- My Orders History -->
      <div class="bg-[#0e1118] border border-[#262f40] p-4 rounded-2xl space-y-3 shadow-xl">
        <h3 class="font-gaming text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> My SMM Orders
        </h3>
        <div id="smm-orders-history" class="space-y-2 max-h-48 overflow-y-auto sidebar-scroll">
          <p class="text-gray-500 text-center py-3 text-xs">Loading orders...</p>
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
      if (infoBox) infoBox.classList.add('hidden');
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
        if (infoBox) infoBox.classList.remove('hidden');
        if (qtyInput) qtyInput.value = selectedSrv.min || 10;
        calcTotal();
      } else {
        const infoBox = document.getElementById('smm-info-box');
        if (infoBox) infoBox.classList.add('hidden');
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

  // Load History
  if (user) {
    try {
      let { data: ords } = await supabase.from('smm_orders').select('*').order('created_at', { ascending: false }).limit(10);
      const histBox = document.getElementById('smm-orders-history');
      if (histBox) {
        if (!ords || ords.length === 0) {
          histBox.innerHTML = '<p class="text-gray-500 text-center py-3 text-xs">No orders found.</p>';
        } else {
          histBox.innerHTML = ords.map(o => `
            <div class="bg-[#06070a] border border-[#262f40] p-2.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <p class="text-white font-bold">${o.service_name}</p>
                <p class="text-gray-400 text-[10px]">Qty: ${o.quantity} | Charge: <span class="text-amber-400">PKR ${o.charge || 0}</span></p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-800 text-amber-400">${o.status || 'Pending'}</span>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.error("History load error:", e);
    }
  }

  // Form Submit
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
