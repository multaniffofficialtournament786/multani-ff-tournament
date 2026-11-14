import { sbClient, state } from './config.js';

// MULTANI FF OFFICIAL - SMM SERVICES MODULE
// Provider submission uses smmd-submit-order-v2

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

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT CATEGORY</label>
            <input type="hidden" id="smm-cat-input" required>
            <div id="smm-cat-dropdown-btn" style="${fieldStyle}cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
              <span id="smm-cat-selected-text" style="color:#8e9bb0;display:flex;align-items:center;gap:8px;">-- Choose Category --</span>
              <i class="fa-solid fa-chevron-down" style="font-size:11px;color:#8e9bb0;"></i>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:11px;color:#8e9bb0;font-weight:700;margin-bottom:6px;letter-spacing:0.5px;">SELECT SERVICE</label>
            <input type="hidden" id="smm-srv-input" required>
            <div id="smm-srv-dropdown-btn" style="${fieldStyle}cursor:pointer;display:flex;align-items:center;justify-content:space-between;opacity:0.6;pointer-events:none;">
              <span id="smm-srv-selected-text" style="color:#8e9bb0;display:flex;align-items:center;gap:8px;">Choose category first</span>
              <i class="fa-solid fa-chevron-down" style="font-size:11px;color:#8e9bb0;"></i>
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

    <div id="smm-custom-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
      <div style="background:#0e1118;border:1px solid #262f40;border-radius:16px;width:100%;max-width:380px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.6);">
        <div style="padding:14px 16px;border-bottom:1px solid #262f40;display:flex;align-items:center;justify-content:space-between;background:#151922;">
          <h3 id="smm-modal-title" style="font-family:Rajdhani,sans-serif;font-size:16px;color:#00f0ff;margin:0;">SELECT</h3>
          <button id="smm-modal-close" style="background:transparent;border:0;color:#8e9bb0;font-size:16px;cursor:pointer;padding:4px;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="smm-modal-body" style="padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
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

function getServiceIcon(text) {
  const t = String(text || '').toLowerCase();

  if (t.includes('youtube') || t.includes('yt'))
    return '<i class="fa-brands fa-youtube" style="color:#ff0000;font-size:16px;"></i>';

  if (t.includes('tiktok') || t.includes('tik tok'))
    return '<i class="fa-brands fa-tiktok" style="color:#00f0ff;font-size:16px;"></i>';

  if (t.includes('whatsapp') || t.includes('wa'))
    return '<i class="fa-brands fa-whatsapp" style="color:#25d366;font-size:16px;"></i>';

  if (t.includes('instagram') || t.includes('insta'))
    return '<i class="fa-brands fa-instagram" style="color:#e1306c;font-size:16px;"></i>';

  if (t.includes('facebook') || t.includes('fb'))
    return '<i class="fa-brands fa-facebook" style="color:#1877f2;font-size:16px;"></i>';

  if (t.includes('telegram') || t.includes('tg'))
    return '<i class="fa-brands fa-telegram" style="color:#229ed9;font-size:16px;"></i>';

  return '<i class="fa-solid fa-fire" style="color:#ffbe00;font-size:16px;"></i>';
}

async function loadSMMData(user, refreshCallback) {
  const walletDisplay = document.getElementById('smm-wallet-display');
  const catInput = document.getElementById('smm-cat-input');
  const srvInput = document.getElementById('smm-srv-input');
  const catBtn = document.getElementById('smm-cat-dropdown-btn');
  const srvBtn = document.getElementById('smm-srv-dropdown-btn');
  const catText = document.getElementById('smm-cat-selected-text');
  const srvText = document.getElementById('smm-srv-selected-text');
  const historyBox = document.getElementById('smm-orders-history');
  const modal = document.getElementById('smm-custom-modal');
  const modalTitle = document.getElementById('smm-modal-title');
  const modalBody = document.getElementById('smm-modal-body');
  const modalClose = document.getElementById('smm-modal-close');

  if (!walletDisplay || !catBtn || !srvBtn) return;

  let currentUser = state.currentUser || user || null;
  let profile = null;
  let allServices = [];
  let selectedService = null;
  let selectedCategory = '';

  const showError = message => alert(message);

  modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  try {
    const { data: authData, error: authError } =
      await sbClient.auth.getUser();

    if (authError) throw authError;

    currentUser = authData.user;

    if (!currentUser) {
      walletDisplay.textContent = 'Login Required';
      historyBox.textContent = 'Please login to view your orders.';
      catText.textContent = 'Login required';
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
        .select('id,category,name,rate,min,max,provider_id,provider_service_id,is_active')
        .eq('is_active', true)
        .order('category')
        .order('name');

    if (servicesError) throw servicesError;

    allServices = services || [];

    const categories = [
      ...new Set(allServices.map(s => s.category).filter(Boolean))
    ];

    if (!allServices.length) {
      catText.textContent = 'No services available';
      return;
    }

    catBtn.addEventListener('click', () => {
      modalTitle.textContent = 'SELECT CATEGORY';

      modalBody.innerHTML = categories.map(cat => {
        const isSelected = selectedCategory === cat;
        const iconHtml = getServiceIcon(cat);

        return `
          <div class="modal-cat-item" data-category="${safeText(cat)}" style="
            background:${isSelected ? 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,114,255,0.15))' : '#06070a'};
            border:1px solid ${isSelected ? '#00f0ff' : '#262f40'};
            padding:12px;border-radius:10px;cursor:pointer;
            display:flex;align-items:center;gap:12px;transition:all 0.2s ease;
          ">
            <div style="background:#151922;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;">
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

      modal.style.display = 'flex';

      modalBody.querySelectorAll('.modal-cat-item').forEach(item => {
        item.addEventListener('click', () => {
          selectedCategory = item.getAttribute('data-category');
          catInput.value = selectedCategory;

          catText.innerHTML =
            `${getServiceIcon(selectedCategory)} <span style="color:#fff;">${safeText(selectedCategory)}</span>`;

          selectedService = null;
          srvInput.value = '';
          srvText.innerHTML = '-- Choose Service --';

          srvBtn.style.opacity = '1';
          srvBtn.style.pointerEvents = 'auto';

          document.getElementById('smm-info-box').style.display = 'none';

          calculateTotal();
          modal.style.display = 'none';
        });
      });
    });

    srvBtn.addEventListener('click', () => {
      const filtered = allServices.filter(
        s => s.category === selectedCategory
      );

      if (!filtered.length) return;

      modalTitle.textContent = 'SELECT SERVICE';

      modalBody.innerHTML = filtered.map(service => {
        const isSelected =
          selectedService &&
          String(selectedService.id) === String(service.id);

        const iconHtml = getServiceIcon(service.name);

        return `
          <div class="modal-srv-item" data-id="${service.id}" style="
            background:${isSelected ? 'linear-gradient(135deg, rgba(255,190,0,0.15), rgba(255,100,0,0.15))' : '#06070a'};
            border:1px solid ${isSelected ? '#ffbe00' : '#262f40'};
            padding:12px;border-radius:10px;cursor:pointer;
            display:flex;align-items:flex-start;gap:12px;transition:all 0.2s ease;
          ">
            <div style="background:#151922;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px solid #262f40;flex-shrink:0;margin-top:2px;">
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

      modal.style.display = 'flex';

      modalBody.querySelectorAll('.modal-srv-item').forEach(item => {
        item.addEventListener('click', () => {
          const srvId = item.getAttribute('data-id');

          selectedService =
            allServices.find(s => String(s.id) === String(srvId)) || null;

          srvInput.value = selectedService
            ? selectedService.id
            : '';

          if (selectedService) {
            srvText.innerHTML =
              `${getServiceIcon(selectedService.name)} <span style="color:#fff;">${safeText(selectedService.name)}</span>`;

            document.getElementById('smm-info-rate').textContent =
              money(selectedService.rate) + ' PKR';

            document.getElementById('smm-info-min').textContent =
              selectedService.min;

            document.getElementById('smm-info-max').textContent =
              selectedService.max;

            document.getElementById('smm-info-box').style.display = 'block';

            const qtyInput =
              document.getElementById('smm-qty-input');

            qtyInput.min = selectedService.min;
            qtyInput.max = selectedService.max;
            qtyInput.value = selectedService.min;
          }

          calculateTotal();
          modal.style.display = 'none';
        });
      });
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

        const link =
          document.getElementById('smm-link-input').value.trim();

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

          if (!data?.success || !data.order_id) {
            throw new Error('Order could not be placed.');
          }

          let providerMessage = '';

          const isApiService =
            selectedService.provider_id &&
            selectedService.provider_service_id;

          if (isApiService) {
            btn.textContent = 'SENDING TO PROVIDER...';

            try {
              const { data: submitResult, error: submitError } =
                await sbClient.functions.invoke('smmd-submit-order-v2', {
                  body: {
                    order_id: data.order_id,
                    service_id: selectedService.id
                  }
                });

              if (submitError || !submitResult?.success) {
                console.error(
                  'Provider submission issue:',
                  submitError || submitResult
                );

                providerMessage =
                  '\nProvider submission confirm nahi hui. Order dobara place na karein; admin se contact karein.';
              } else {
                providerMessage =
                  '\nProvider Order ID: ' +
                  (submitResult.provider_order_id || 'Submitted');
              }

            } catch (providerError) {
              console.error('Provider connection error:', providerError);

              providerMessage =
                '\nProvider submission confirm nahi hui. Order dobara place na karein; admin se contact karein.';
            }

          } else {
            providerMessage = '\nOrder Type: Manual Service';
          }

          alert(
            `Order created successfully!\nOrder ID: ${data.order_id}\nCharge: PKR ${money(data.charge)}${providerMessage}`
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

          showError(
            error.message || 'Order failed. Please try again.'
          );

        } finally {
          btn.disabled = false;
          btn.textContent = 'PLACE SMM ORDER';
        }
      });

  } catch (error) {
    console.error('SMM loading error:', error);

    walletDisplay.textContent = 'Unable to load';
    catText.textContent = 'Load error';

    historyBox.textContent =
      error.message || 'Unable to load SMM data.';
  }

  async function loadOrderHistory(userId) {
    const box = document.getElementById('smm-orders-history');

    if (!box) return;

    let { data: orders, error } = await sbClient
      .from('smm_orders')
      .select('id,order_id,service_name,link,quantity,charge,status,created_at,provider_order_id,provider_id')
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

    const activeApiOrders = orders.filter(order => {
      const status = String(order.status || '').toLowerCase();

      return order.provider_order_id &&
        !['completed', 'cancelled', 'partial', 'failed'].includes(status);
    });

    if (activeApiOrders.length) {
      await Promise.allSettled(
        activeApiOrders.map(order =>
          sbClient.functions.invoke('smmd-order-status', {
            body: {
              order_id: order.id
            }
          })
        )
      );

      const { data: refreshedOrders, error: refreshError } =
        await sbClient
          .from('smm_orders')
          .select('id,order_id,service_name,link,quantity,charge,status,created_at,provider_order_id,provider_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

      if (!refreshError && refreshedOrders) {
        orders = refreshedOrders;
      }
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
      } else if (
        status.toLowerCase() === 'failed' ||
        status.toLowerCase() === 'cancelled'
      ) {
        statusColor = '#ff5252';
        statusBg = 'rgba(255,82,82,0.1)';
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
