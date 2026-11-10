
import { sbClient, state } from './config.js';

// MULTANI FF OFFICIAL - SMM SERVICES MODULE

export function renderSMMView(container, user, walletBalance, refreshCallback) {
  container.innerHTML = `
    <div style="padding:16px;max-width:430px;margin:0 auto;font-family:Inter,sans-serif;color:#fff;">

      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #262f40;padding-bottom:12px;margin-bottom:16px;">
        <h2 style="font-family:Rajdhani,sans-serif;font-size:18px;color:#00f0ff;margin:0;">SMM SERVICES & ORDERS</h2>
        <div style="background:#151922;border:1px solid #262f40;padding:8px 12px;border-radius:10px;color:#ffbe00;font-weight:700;">
          <i class="fa-solid fa-wallet"></i>
          <span id="smm-wallet-display">Loading...</span>
        </div>
      </div>

      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;padding:18px;margin-bottom:16px;">
        <h3 style="font-family:Rajdhani;color:#fff;margin:0 0 14px;">BUY SMM SERVICE</h3>

        <form id="app-smm-form" style="display:flex;flex-direction:column;gap:12px;">

          <div>
            <label>SELECT CATEGORY</label>
            <select id="smm-cat-select" required style="${fieldStyle}">
              <option value="">Loading categories...</option>
            </select>
          </div>

          <div>
            <label>SELECT SERVICE</label>
            <select id="smm-srv-select" required disabled style="${fieldStyle}">
              <option value="">Choose category first</option>
            </select>
          </div>

          <div id="smm-info-box" style="display:none;background:#151922;padding:12px;border-radius:10px;font-size:12px;color:#8e9bb0;">
            <p>Rate per 1000: <strong id="smm-info-rate"></strong></p>
            <p>Minimum: <strong id="smm-info-min"></strong></p>
            <p>Maximum: <strong id="smm-info-max"></strong></p>
          </div>

          <div>
            <label>TARGET LINK / PROFILE URL</label>
            <input id="smm-link-input" type="url" required maxlength="2000"
              placeholder="https://..."
              style="${fieldStyle}">
          </div>

          <div>
            <label>QUANTITY</label>
            <input id="smm-qty-input" type="number" min="1" required
              placeholder="100"
              style="${fieldStyle}">
          </div>

          <div style="background:#151922;padding:14px;border-radius:10px;display:flex;justify-content:space-between;">
            <span style="color:#8e9bb0;">TOTAL CHARGE</span>
            <strong id="smm-total-charge" style="color:#ffbe00;">PKR 0.00</strong>
          </div>

          <button id="smm-submit-btn" type="submit"
            style="background:linear-gradient(135deg,#00f0ff,#0072ff);color:#000;border:0;padding:14px;border-radius:10px;font-weight:800;">
            PLACE SMM ORDER
          </button>
        </form>
      </div>

      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;padding:18px;">
        <h3 style="font-family:Rajdhani;color:#ffbe00;margin:0 0 12px;">MY SMM ORDERS</h3>
        <div id="smm-orders-history" style="display:flex;flex-direction:column;gap:10px;">
          Loading orders...
        </div>
      </div>
    </div>
  `;

  loadSMMData(user, refreshCallback);
}

const fieldStyle = `
  width:100%;box-sizing:border-box;background:#06070a;
  border:1px solid #262f40;border-radius:10px;
  padding:12px;color:#fff;font-size:13px;outline:none;
`;

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

async function loadSMMData(user, refreshCallback) {
  const walletDisplay = document.getElementById('smm-wallet-display');
  const catSelect = document.getElementById('smm-cat-select');
  const srvSelect = document.getElementById('smm-srv-select');
  const historyBox = document.getElementById('smm-orders-history');

  if (!walletDisplay || !catSelect || !srvSelect) return;

  let currentUser = state.currentUser || user || null;
  let profile = null;
  let allServices = [];
  let selectedService = null;

  const showError = message => alert(message);

  try {
    const { data: authData, error: authError } =
      await sbClient.auth.getUser();

    if (authError) throw authError;

    currentUser = authData.user;

    if (!currentUser) {
      walletDisplay.textContent = 'Login Required';
      historyBox.textContent = 'Please login to view your orders.';
      catSelect.innerHTML = '<option value="">Login required</option>';
      return;
    }

    state.currentUser = currentUser;

    const { data: profileData, error: profileError } =
      await sbClient
        .from('profiles')
        .select('id,wallet_balance,is_verified')
        .eq('id', currentUser.id)
        .single();

    if (profileError) throw profileError;

    profile = profileData;
    state.currentProfile = {
      ...state.currentProfile,
      ...profileData
    };

    walletDisplay.textContent =
      'PKR ' + money(profile.wallet_balance);

    const { data: services, error: servicesError } =
      await sbClient
        .from('smm_services')
        .select('id,category,name,rate,min,max')
        .order('category')
        .order('name');

    if (servicesError) throw servicesError;

    allServices = services || [];

    const categories = [
      ...new Set(allServices.map(s => s.category).filter(Boolean))
    ];

    catSelect.innerHTML =
      '<option value="">-- Choose Category --</option>' +
      categories.map(category =>
        `<option value="${safeText(category)}">${safeText(category)}</option>`
      ).join('');

    if (!allServices.length) {
      catSelect.innerHTML =
        '<option value="">No services available</option>';
    }

    catSelect.addEventListener('change', () => {
      selectedService = null;
      srvSelect.disabled = true;
      srvSelect.innerHTML =
        '<option value="">-- Choose Service --</option>';

      document.getElementById('smm-info-box').style.display = 'none';
      calculateTotal();

      const filtered = allServices.filter(
        s => s.category === catSelect.value
      );

      srvSelect.innerHTML += filtered.map(service =>
        `<option value="${service.id}">${safeText(service.name)} (PKR ${money(service.rate)}/1000)</option>`
      ).join('');

      srvSelect.disabled = filtered.length === 0;
    });

    srvSelect.addEventListener('change', () => {
      selectedService = allServices.find(
        s => String(s.id) === srvSelect.value
      ) || null;

      const infoBox = document.getElementById('smm-info-box');

      if (!selectedService) {
        infoBox.style.display = 'none';
        calculateTotal();
        return;
      }

      document.getElementById('smm-info-rate').textContent =
        money(selectedService.rate) + ' PKR';

      document.getElementById('smm-info-min').textContent =
        selectedService.min;

      document.getElementById('smm-info-max').textContent =
        selectedService.max;

      infoBox.style.display = 'block';

      const qtyInput = document.getElementById('smm-qty-input');
      qtyInput.min = selectedService.min;
      qtyInput.max = selectedService.max;
      qtyInput.value = selectedService.min;

      calculateTotal();
    });

    document.getElementById('smm-qty-input')
      .addEventListener('input', calculateTotal);

    function calculateTotal() {
      const qty = Number(
        document.getElementById('smm-qty-input').value
      ) || 0;

      const rate = Number(selectedService?.rate) || 0;
      const charge = selectedService
        ? Math.round((qty / 1000 * rate + Number.EPSILON) * 100) / 100
        : 0;

      document.getElementById('smm-total-charge').textContent =
        'PKR ' + money(charge);
    }

    await loadOrderHistory(currentUser.id);

    document.getElementById('app-smm-form')
      .addEventListener('submit', async event => {
        event.preventDefault();

        const btn = document.getElementById('smm-submit-btn');
        const link = document.getElementById('smm-link-input').value.trim();
        const qty = Number(
          document.getElementById('smm-qty-input').value
        );

        if (!selectedService) {
          return showError('Please select a service.');
        }

        if (!link || !Number.isInteger(qty)) {
          return showError('Please enter a valid link and quantity.');
        }

        if (
          qty < Number(selectedService.min) ||
          qty > Number(selectedService.max)
        ) {
          return showError(
            `Quantity must be between ${selectedService.min} and ${selectedService.max}.`
          );
        }

        if (!profile.is_verified) {
          return showError('Please verify your account first.');
        }

        if (!/^https?:\/\/\S+$/i.test(link)) {
          return showError('Please enter a valid HTTP or HTTPS link.');
        }

        btn.disabled = true;
        btn.textContent = 'PLACING ORDER...';

        try {
          // Secure server-side payment, order and transaction
          const { data, error } = await sbClient.rpc(
            'place_smm_order',
            {
              p_service_id: selectedService.id,
              p_link: link,
              p_quantity: qty
            }
          );

          if (error) throw error;
          if (!data?.success) {
            throw new Error('Order could not be placed.');
          }

          alert(
            `Order placed successfully!\nOrder ID: ${data.order_id}\nCharge: PKR ${money(data.charge)}`
          );

          const { data: updatedProfile, error: updateError } =
            await sbClient
              .from('profiles')
              .select('id,wallet_balance,is_verified')
              .eq('id', currentUser.id)
              .single();

          if (updateError) throw updateError;

          profile = updatedProfile;
          state.currentProfile = {
            ...state.currentProfile,
            ...updatedProfile
          };

          walletDisplay.textContent =
            'PKR ' + money(profile.wallet_balance);

          document.getElementById('smm-link-input').value = '';

          await loadOrderHistory(currentUser.id);

          if (typeof refreshCallback === 'function') {
            refreshCallback();
          }

        } catch (error) {
          console.error('SMM order error:', error);
          showError(error.message || 'Order failed. Please try again.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'PLACE SMM ORDER';
        }
      });

  } catch (error) {
    console.error('SMM loading error:', error);
    walletDisplay.textContent = 'Unable to load';
    catSelect.innerHTML = '<option value="">Load error</option>';
    historyBox.textContent = error.message || 'Unable to load SMM data.';
  }

  async function loadOrderHistory(userId) {
    const box = document.getElementById('smm-orders-history');
    if (!box) return;

    const { data: orders, error } = await sbClient
      .from('smm_orders')
      .select('id,order_id,service_name,link,quantity,charge,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Order history error:', error);
      box.textContent = 'Unable to load order history.';
      return;
    }

    if (!orders?.length) {
      box.textContent = 'No orders found.';
      return;
    }

    box.innerHTML = orders.map(order => {
      const status = String(order.status || 'Pending');
      let statusColor = '#ffbe00';

      if (status.toLowerCase() === 'completed') {
        statusColor = '#00e676';
      } else if (status.toLowerCase() === 'processing') {
        statusColor = '#00d5ff';
      }

      return `
        <div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;">
          <div style="display:flex;justify-content:space-between;gap:8px;">
            <strong style="color:#fff;">${safeText(order.service_name)}</strong>
            <strong style="color:${statusColor};font-size:11px;">
              ${safeText(status)}
            </strong>
          </div>
          <p style="color:#8e9bb0;font-size:11px;margin:7px 0;">
            Order: #${safeText(order.order_id ?? order.id)}
          </p>
          <p style="color:#8e9bb0;font-size:11px;margin:5px 0;word-break:break-all;">
            ${safeText(order.link)}
          </p>
          <p style="color:#8e9bb0;font-size:11px;margin:5px 0;">
            Quantity: ${safeText(order.quantity)}
            | Charge: <strong style="color:#ffbe00;">PKR ${money(order.charge)}</strong>
          </p>
        </div>
      `;
    }).join('');
  }
}
