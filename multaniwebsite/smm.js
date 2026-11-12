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

        <form id="app-smm-form" style="display:flex;flex-direction:column;gap:14px;">

          <!-- VIP CATEGORY SELECTOR -->
          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT CATEGORY</label>
            <input type="hidden" id="smm-cat-input" required>
            <div id="smm-cat-cards-container" style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding-right:2px;">
              <div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#8e9bb0;text-align:center;font-size:12px;">Loading categories...</div>
            </div>
          </div>

          <!-- VIP SERVICE SELECTOR -->
          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT SERVICE</label>
            <input type="hidden" id="smm-srv-input" required>
            <div id="smm-srv-cards-container" style="display:flex;flex-direction:column;gap:8px;max-height:240px;overflow-y:auto;padding-right:2px;">
              <div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#8e9bb0;text-align:center;font-size:12px;">Choose category first</div>
            </div>
          </div>

          <div id="smm-info-box" style="display:none;background:#151922;border:1px solid #00f0ff44;padding:12px;border-radius:10px;font-size:12px;color:#8e9bb0;">
            <p style="margin:0 0 4px;">Rate per 1000: <strong id="smm-info-rate" style="color:#00f0ff;"></strong></p>
            <p style="margin:0 0 4px;">Minimum: <strong id="smm-info-min" style="color:#fff;"></strong></p>
            <p style="margin:0;">Maximum: <strong id="smm-info-max" style="color:#fff;"></strong></p>
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">TARGET LINK / PROFILE URL</label>
            <input id="smm-link-input" type="url" required maxlength="2000"
              placeholder="https://..."
              style="${fieldStyle}">
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">QUANTITY</label>
            <input id="smm-qty-input" type="number" min="1" required
              placeholder="100"
              style="${fieldStyle}">
          </div>

          <div style="background:#151922;padding:14px;border-radius:10px;display:flex;justify-content:space-between;border:1px solid #262f40;">
            <span style="color:#8e9bb0;">TOTAL CHARGE</span>
            <strong id="smm-total-charge" style="color:#ffbe00;">PKR 0.00</strong>
          </div>

          <button id="smm-submit-btn" type="submit"
            style="background:linear-gradient(135deg,#00f0ff,#0072ff);color:#000;border:0;padding:14px;border-radius:10px;font-weight:800;cursor:pointer;">
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

// Helper to assign proper icons based on category/service text
function getServiceIcon(text) {
  const t = String(text || '').toLowerCase();
  if (t.includes('youtube') || t.includes('yt')) return '<i class="fa-brands fa-youtube" style="color:#ff0000;font-size:16px;"></i>';
  if (t.includes('tiktok') || t.includes('tik tok')) return '<i class="fa-brands fa-tiktok" style="color:#00f0ff;font-size:16px;"></i>';
  if (t.includes('whatsapp') || t.includes('wa')) return '<i class="fa-brands fa-whatsapp" style="color:#25d366;font-size:16px;"></i>';
  if (t.includes('instagram') || t.includes('insta')) return '<i class="fa-brands fa-instagram" style="color:#e1306c;font-size:16px;"></i>';
  if (t.includes('facebook') || t.includes('fb')) return '<i class="fa-brands fa-facebook" style="color:#1877f2;font-size:16px;"></i>';
  if (t.includes('telegram')) return '<i class="fa-brands fa-telegram" style="color:#229ed9;font-size:16px;"></i>';
  return '<i class="fa-solid fa-fire" style="color:#ffbe00;font-size:16px;"></i>';
}

async function loadSMMData(user, refreshCallback) {
  const walletDisplay = document.getElementById('smm-wallet-display');
  const catInput = document.getElementById('smm-cat-input');
  const srvInput = document.getElementById('smm-srv-input');
  const catContainer = document.getElementById('smm-cat-cards-container');
  const srvContainer = document.getElementById('smm-srv-cards-container');
  const historyBox = document.getElementById('smm-orders-history');

  if (!walletDisplay || !catContainer || !srvContainer) return;

  let currentUser = state.currentUser || user || null;
  let profile = null;
  let allServices = [];
  let selectedService = null;
  let selectedCategory = '';

  const showError = message => alert(message);

  try {
    const { data: authData, error: authError } =
      await sbClient.auth.getUser();

    if (authError) throw authError;

    currentUser = authData.user;

    if (!currentUser) {
      walletDisplay.textContent = 'Login Required';
      historyBox.textContent = 'Please login to view your orders.';
      catContainer.innerHTML = '<div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#ff4444;text-align:center;font-size:12px;">Login required</div>';
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

    if (!allServices.length) {
      catContainer.innerHTML =
        '<div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#8e9bb0;text-align:center;font-size:12px;">No services available</div>';
      return;
    }

    // Render Category VIP Cards
    renderCategoryCards();

    function renderCategoryCards() {
      catContainer.innerHTML = categories.map(cat => {
        const isSelected = selectedCategory === cat;
        const iconHtml = getServiceIcon(cat);
        return `
          <div class="smm-cat-card" data-category="${safeText(cat)}" style="
            background:${isSelected ? 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,114,255,0.15))' : '#06070a'};
            border:1px solid ${isSelected ? '#00f0ff' : '#262f40'};
            padding:12px 14px;border-radius:10px;cursor:pointer;
            display:flex;align-items:center;gap:12px;transition:all 0.2s ease;
          ">
            <div style="background:#151922;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;">
              ${iconHtml}
            </div>
            <div style="flex-grow:1;font-size:13px;font-weight:600;color:${isSelected ? '#00f0ff' : '#fff'};">
              ${safeText(cat)}
            </div>
            <div style="width:16px;height:16px;border-radius:50%;border:1px solid ${isSelected ? '#00f0ff' : '#262f40'};display:flex;align-items:center;justify-content:center;">
              ${isSelected ? '<div style="width:8px;height:8px;border-radius:50%;background:#00f0ff;"></div>' : ''}
            </div>
          </div>
        `;
      }).join('');

      // Add click events to category cards
      catContainer.querySelectorAll('.smm-cat-card').forEach(card => {
        card.addEventListener('click', () => {
          selectedCategory = card.getAttribute('data-category');
          catInput.value = selectedCategory;
          selectedService = null;
          srvInput.value = '';

          document.getElementById('smm-info-box').style.display = 'none';
          calculateTotal();
          renderCategoryCards();
          renderServiceCards();
        });
      });
    }

    function renderServiceCards() {
      const filtered = allServices.filter(s => s.category === selectedCategory);

      if (!filtered.length) {
        srvContainer.innerHTML = '<div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#8e9bb0;text-align:center;font-size:12px;">Choose category first</div>';
        return;
      }

      srvContainer.innerHTML = filtered.map(service => {
        const isSelected = selectedService && String(selectedService.id) === String(service.id);
        const iconHtml = getServiceIcon(service.name);
        return `
          <div class="smm-srv-card" data-id="${service.id}" style="
            background:${isSelected ? 'linear-gradient(135deg, rgba(255,190,0,0.15), rgba(255,100,0,0.15))' : '#06070a'};
            border:1px solid ${isSelected ? '#ffbe00' : '#262f40'};
            padding:12px 14px;border-radius:10px;cursor:pointer;
            display:flex;align-items:flex-start;gap:12px;transition:all 0.2s ease;
          ">
            <div style="background:#151922;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;margin-top:2px;">
              ${iconHtml}
            </div>
            <div style="flex-grow:1;display:flex;flex-direction:column;gap:4px;">
              <div style="font-size:13px;font-weight:600;color:${isSelected ? '#ffbe00' : '#fff'};">
                ${safeText(service.name)}
              </div>
              <div style="font-size:11px;color:#8e9bb0;">
                Rate: <strong style="color:#ffbe00;">PKR ${money(service.rate)}</strong> / 1000 | Min: ${service.min} - Max: ${service.max}
              </div>
            </div>
            <div style="width:16px;height:16px;border-radius:50%;border:1px solid ${isSelected ? '#ffbe00' : '#262f40'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:4px;">
              ${isSelected ? '<div style="width:8px;height:8px;border-radius:50%;background:#ffbe00;"></div>' : ''}
            </div>
          </div>
        `;
      }).join('');

      // Add click events to service cards
      srvContainer.querySelectorAll('.smm-srv-card').forEach(card => {
        card.addEventListener('click', () => {
          const srvId = card.getAttribute('data-id');
          selectedService = allServices.find(s => String(s.id) === String(srvId)) || null;
          srvInput.value = selectedService ? selectedService.id : '';

          const infoBox = document.getElementById('smm-info-box');

          if (!selectedService) {
            infoBox.style.display = 'none';
            calculateTotal();
            renderServiceCards();
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
          renderServiceCards();
        });
      });
    }

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
    catContainer.innerHTML = '<div style="background:#06070a;border:1px solid #262f40;padding:12px;border-radius:10px;color:#ff4444;text-align:center;font-size:12px;">Load error</div>';
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
      let statusBg = 'rgba(255,190,0,0.1)';

      if (status.toLowerCase() === 'completed') {
        statusColor = '#00e676';
        statusBg = 'rgba(0,230,118,0.1)';
      } else if (status.toLowerCase() === 'processing') {
        statusColor = '#00d5ff';
        statusBg = 'rgba(0,213,255,0.1)';
      }

      const iconHtml = getServiceIcon(order.service_name);

      return `
        <div style="background:#06070a;border:1px solid #262f40;padding:14px;border-radius:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="background:#151922;width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;">
                ${iconHtml}
              </div>
              <strong style="color:#fff;font-size:13px;">${safeText(order.service_name)}</strong>
            </div>
            <span style="color:${statusColor};background:${statusBg};border:1px solid ${statusColor}44;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;">
              ${safeText(status)}
            </span>
          </div>

          <div style="background:#151922;padding:8px 10px;border-radius:8px;border:1px solid #262f40;display:flex;flex-direction:column;gap:4px;">
            <div style="color:#8e9bb0;font-size:11px;display:flex;justify-content:space-between;">
              <span>Order ID: <strong style="color:#fff;">#${safeText(order.order_id ?? order.id)}</strong></span>
              <span>Qty: <strong style="color:#00f0ff;">${safeText(order.quantity)}</strong></span>
            </div>
            <div style="color:#8e9bb0;font-size:11px;word-break:break-all;">
              Link: <span style="color:#fff;">${safeText(order.link)}</span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#8e9bb0;padding-top:2px;">
            <span>${new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
            <span>Charge: <strong style="color:#ffbe00;">PKR ${money(order.charge)}</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }
}
