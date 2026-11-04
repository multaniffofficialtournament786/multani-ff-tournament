import { sbClient, state, Toast, Loader, Sound, escapeHTML } from './config.js';

export async function syncAuthAndProfile() {
  try {
    const { data: { user } } = await sbClient.auth.getUser();
    state.currentUser = user;

    if (user) {
      const [profRes, entryRes, notifRes, chatRes] = await Promise.all([
        sbClient.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        sbClient.from('tournament_entries').select('tournament_id').eq('user_id', user.id),
        sbClient.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        sbClient.from('support_messages').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('sender_role', 'admin').eq('is_read', false)
      ]);

      state.currentProfile = profRes.data;
      state.userJoinedTournamentIds = new Set((entryRes.data || []).map(e => e.tournament_id));
      state.unreadNotifCount = notifRes.count || 0;
      state.unreadChatCount = chatRes.count || 0;
    } else {
      state.currentProfile = null;
      state.userJoinedTournamentIds = new Set();
      state.unreadNotifCount = 0;
      state.unreadChatCount = 0;
    }

    updateDrawerUI();
    updateNotificationBadges();
  } catch (e) {
    console.error("Auth sync error:", e);
  }
}

export function updateNotificationBadges() {
  const bellBadge = document.getElementById('header-notif-badge');
  const drawerBadge = document.getElementById('drawer-notif-badge');
  const floatChatBadge = document.getElementById('float-chat-badge');

  if (bellBadge) bellBadge.classList.toggle('hidden', state.unreadNotifCount === 0);

  if (drawerBadge) {
    drawerBadge.classList.toggle('hidden', state.unreadNotifCount === 0);
    drawerBadge.innerText = state.unreadNotifCount > 0 ? state.unreadNotifCount : '';
  }

  if (floatChatBadge) {
    floatChatBadge.classList.toggle('hidden', state.unreadChatCount === 0);
    floatChatBadge.innerText = state.unreadChatCount;
  }
}

export function updateDrawerUI() {
  const dName = document.getElementById('drawer-name');
  const dUid = document.getElementById('drawer-uid');
  const hAvatar = document.getElementById('header-avatar-img');
  const dAvatar = document.getElementById('drawer-avatar');

  const avatarUrl = state.currentProfile?.avatar_url ||
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';

  if (hAvatar) hAvatar.src = avatarUrl;
  if (dAvatar) dAvatar.src = avatarUrl;

  if (state.currentUser && state.currentProfile) {
    if (dName) dName.innerText = state.currentProfile.free_fire_name || state.currentProfile.full_name || 'Soldier';
    if (dUid) dUid.innerHTML = `<i class="fa-solid fa-gamepad"></i> UID: ${state.currentProfile.free_fire_uid || '--'}`;
  } else {
    if (dName) dName.innerText = 'Guest Gamer';
    if (dUid) dUid.innerHTML = `<i class="fa-solid fa-user"></i> Login / Register`;
  }
}

// ==========================================
// LOGIN / REGISTRATION / GMAIL VERIFICATION
// ==========================================

export function renderAuth(mode = 'login') {
  const view = document.getElementById('app-view');

  if (mode === 'verify') {
    renderRegistrationVerification('', true);
    return;
  }

  const isLogin = mode === 'login';

  view.innerHTML = `
    <div class="view-container">
      <div class="arena-login-wrap">
        <h2 class="arena-title">MULTANI FF ARENA</h2>

        <p class="arena-subtitle">
          ${isLogin ? 'Sign in to enter the arena.' : 'Create an account to join tournaments.'}
        </p>

        ${isLogin ? `
          <form id="login-form">
            <div class="arena-input-box">
              <i class="fa-solid fa-envelope"></i>
              <input type="email" id="log-email" class="arena-field"
                placeholder="you@example.com" required />
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="log-pass" class="arena-field"
                placeholder="Password" required />
              <i class="fa-solid fa-eye" id="toggle-log-pass" style="cursor:pointer;"></i>
            </div>

            <div style="text-align:right; margin-bottom:12px;">
              <span id="btn-forgot-pass"
                style="font-size:12px;color:var(--primary);cursor:pointer;font-weight:600;">
                Forgot Password?
              </span>
            </div>

            <div style="text-align:right; margin-bottom:14px;">
              <span id="btn-goto-verify"
                style="font-size:12px;color:#00e676;cursor:pointer;font-weight:600;">
                Verify Account?
              </span>
            </div>

            <button type="submit" class="btn btn-primary"
              style="background:#ff5733;margin-bottom:12px;">
              LOGIN
            </button>
          </form>
        ` : `
          <form id="signup-form">
            <div class="arena-input-box">
              <i class="fa-solid fa-user"></i>
              <input type="text" id="reg-name" class="arena-field"
                placeholder="Full Name" maxlength="100" required />
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-gamepad"></i>
              <input type="text" id="reg-ign" class="arena-field"
                placeholder="Free Fire IGN" maxlength="50" required />
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-id-card"></i>
              <input type="text" id="reg-uid" class="arena-field"
                placeholder="Free Fire UID (Permanent)" maxlength="30" required />
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-phone"></i>
              <input type="tel" id="reg-phone" class="arena-field"
                placeholder="WhatsApp Mobile Number" maxlength="25" required />
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-envelope"></i>
              <input type="email" id="reg-email" class="arena-field"
                placeholder="Gmail Address" required />
            </div>

            <button type="submit" class="btn btn-primary"
              style="background:#ff5733;margin-bottom:12px;">
              SEND GMAIL OTP
            </button>
          </form>
        `}

        <div style="text-align:center;font-size:13px;color:var(--text-muted);margin-top:16px;">
          ${isLogin
            ? `Don't have an account? <span id="link-goto-register" style="color:var(--primary);font-weight:bold;cursor:pointer;">Sign Up</span>`
            : `Already have an account? <span id="link-goto-login" style="color:var(--primary);font-weight:bold;cursor:pointer;">Login</span>`}
        </div>
      </div>
    </div>
  `;

  if (isLogin) {
    const togglePass = document.getElementById('toggle-log-pass');
    if (togglePass) {
      togglePass.onclick = () => {
        const p = document.getElementById('log-pass');
        p.type = p.type === 'password' ? 'text' : 'password';
      };
    }

    const forgotBtn = document.getElementById('btn-forgot-pass');
    if (forgotBtn) forgotBtn.onclick = () => window.renderForgotPassword();

    const verifyBtn = document.getElementById('btn-goto-verify');
    if (verifyBtn) verifyBtn.onclick = () => renderAuth('verify');

    const regLink = document.getElementById('link-goto-register');
    if (regLink) regLink.onclick = () => window.Router.navigate('register');

    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      Loader.show("Signing in...");

      try {
        const { error } = await sbClient.auth.signInWithPassword({
          email: document.getElementById('log-email').value.trim(),
          password: document.getElementById('log-pass').value
        });

        if (error) throw error;

        Sound.playBrandName();
        Toast.show("Welcome back!", "success");

        await syncAuthAndProfile();
        window.Router.navigate('home');

      } catch (err) {
        Toast.show(err.message || "Login failed.", "error");
      } finally {
        Loader.hide();
      }
    };

  } else {
    const logLink = document.getElementById('link-goto-login');
    if (logLink) logLink.onclick = () => window.Router.navigate('login');

    document.getElementById('signup-form').onsubmit = async (e) => {
      e.preventDefault();

      const full_name = document.getElementById('reg-name').value.trim();
      const free_fire_name = document.getElementById('reg-ign').value.trim();
      const free_fire_uid = document.getElementById('reg-uid').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();

      if (!full_name || !free_fire_name || !free_fire_uid || !phone || !email) {
        Toast.show("Tamam details fill karein.", "error");
        return;
      }

      Loader.show("Sending Gmail OTP...");

      try {
        const { data, error } = await sbClient.functions.invoke(
          "register-verify-account",
          {
            body: {
              action: "send_otp",
              email,
              full_name,
              free_fire_name,
              free_fire_uid,
              phone
            }
          }
        );

        if (error || !data?.success) {
          throw new Error(data?.error || data?.message || error?.message || "OTP send nahi hua.");
        }

        Toast.show("Gmail par OTP bhej diya gaya hai.", "success");
        renderRegistrationVerification(email, false);

      } catch (err) {
        Toast.show(err.message || "Registration OTP failed.", "error");
      } finally {
        Loader.hide();
      }
    };
  }
}

// ==========================================
// NEW PLAYER GMAIL OTP VERIFICATION
// ==========================================

function renderRegistrationVerification(email = '', showEmailInput = false) {
  const view = document.getElementById('app-view');

  view.innerHTML = `
    <div class="view-container">
      <div class="arena-login-wrap">
        <h2 class="arena-title">VERIFY ACCOUNT</h2>
        <p class="arena-subtitle">
          Gmail OTP enter karein aur apna naya password banayein.
        </p>

        <form id="registration-verify-form">
          <div class="arena-input-box">
            <i class="fa-solid fa-envelope"></i>
            <input type="email" id="verify-email" class="arena-field"
              placeholder="Registered Gmail"
              value="${escapeHTML(email)}"
              ${showEmailInput ? '' : 'readonly'}
              required />
          </div>

          <div class="arena-input-box">
            <i class="fa-solid fa-key"></i>
            <input type="text" id="verify-otp" class="arena-field"
              placeholder="6 Digit Gmail OTP"
              inputmode="numeric" maxlength="6" required />
          </div>

          <div class="arena-input-box">
            <i class="fa-solid fa-lock"></i>
            <input type="password" id="verify-password" class="arena-field"
              placeholder="New Password (minimum 8 characters)"
              minlength="8" required />
          </div>

          <div class="arena-input-box">
            <i class="fa-solid fa-lock"></i>
            <input type="password" id="verify-confirm-password" class="arena-field"
              placeholder="Confirm New Password"
              minlength="8" required />
          </div>

          <button type="submit" class="btn btn-primary"
            style="background:linear-gradient(135deg,#00e676,#00b0ff);color:#000;">
            VERIFY & CREATE ACCOUNT
          </button>
        </form>

        <p style="text-align:center;margin-top:16px;font-size:13px;">
          <span id="link-back-register" style="color:var(--primary);cursor:pointer;">Back to Registration</span>
          &nbsp; | &nbsp;
          <span id="link-back-login" style="color:var(--primary);cursor:pointer;">Login</span>
        </p>
      </div>
    </div>
  `;

  document.getElementById('link-back-register').onclick = () => window.Router.navigate('register');
  document.getElementById('link-back-login').onclick = () => window.Router.navigate('login');

  document.getElementById('registration-verify-form').onsubmit = async (e) => {
    e.preventDefault();

    const targetEmail = document.getElementById('verify-email').value.trim().toLowerCase();
    const otp = document.getElementById('verify-otp').value.trim();
    const password = document.getElementById('verify-password').value;
    const confirmPassword = document.getElementById('verify-confirm-password').value;

    if (password !== confirmPassword) {
      Toast.show("Dono passwords match nahi karte!", "error");
      return;
    }

    if (password.length < 8) {
      Toast.show("Password kam az kam 8 characters ka hona chahiye.", "error");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      Toast.show("6 digit OTP enter karein.", "error");
      return;
    }

    Loader.show("Verifying Gmail and creating account...");

    try {
      const { data, error } = await sbClient.functions.invoke(
        "register-verify-account",
        {
          body: {
            action: "verify_otp",
            email: targetEmail,
            otp,
            new_password: password
          }
        }
      );

      if (error || !data?.success) {
        throw new Error(data?.error || data?.message || error?.message || "Verification failed.");
      }

      Toast.show("Gmail verified! Ab naye password se Login karein.", "success");
      window.Router.navigate('login');

    } catch (err) {
      Toast.show(err.message || "Verification failed.", "error");
    } finally {
      Loader.hide();
    }
  };
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

export function renderForgotPassword() {
  const view = document.getElementById('app-view');

  view.innerHTML = `
    <div class="view-container">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <button class="icon-btn" id="btn-back-to-login" style="width:34px;height:34px;">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h3 style="font-family:var(--font-gaming);font-size:18px;color:var(--accent-gold);">
          RESET PASSWORD
        </h3>
      </div>

      <form id="forgot-email-form">
        <div class="player-hero-card" style="margin-bottom:14px;padding:14px;">
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
            Enter your registered Gmail address to receive the password reset OTP code.
          </p>
          <div class="form-group">
            <label class="form-label">Gmail Address</label>
            <input type="email" id="fg-email" class="form-input"
              placeholder="e.g. yourname@gmail.com" required />
          </div>
          <button type="submit" class="btn btn-primary">SEND OTP TO GMAIL</button>
        </div>
      </form>

      <form id="forgot-verify-form" class="hidden">
        <div class="player-hero-card" style="margin-bottom:14px;padding:14px;">
          <p style="font-size:12px;color:var(--success);margin-bottom:10px;">
            <i class="fa-solid fa-circle-check"></i> OTP sent to Gmail!
          </p>

          <div class="form-group">
            <label class="form-label">OTP Code</label>
            <input type="text" id="fg-otp" class="form-input"
              placeholder="Enter 6-digit OTP" required />
          </div>

          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="fg-newpass" class="form-input"
              placeholder="At least 8 chars" minlength="8" required />
          </div>

          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" id="fg-confpass" class="form-input"
              placeholder="Re-enter password" minlength="8" required />
          </div>

          <button type="submit" class="btn btn-primary"
            style="background:linear-gradient(135deg,#00e676,#00b0ff);color:#000;">
            UPDATE PASSWORD
          </button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('btn-back-to-login').onclick = () => window.Router.navigate('login');

  document.getElementById('forgot-email-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('fg-email').value.trim();

    Loader.show("Sending OTP...");

    try {
      const { data, error } = await sbClient.functions.invoke(
        "send-reset-otp",
        { body: { email: email } }
      );

      if (error || !data || data.success !== true) {
        throw new Error(data?.message || "Failed to send OTP.");
      }

      window.resetEmailTarget = email;
      Toast.show("OTP sent to your Gmail!", "success");

      document.getElementById('forgot-email-form').classList.add('hidden');
      document.getElementById('forgot-verify-form').classList.remove('hidden');

    } catch (err) {
      Toast.show(err.message || "Failed to send OTP.", "error");
    } finally {
      Loader.hide();
    }
  };

  document.getElementById('forgot-verify-form').onsubmit = async (e) => {
    e.preventDefault();

    const token = document.getElementById('fg-otp').value.trim();
    const newPassword = document.getElementById('fg-newpass').value;
    const confPassword = document.getElementById('fg-confpass').value;

    if (newPassword !== confPassword) {
      Toast.show("Passwords do not match!", "error");
      return;
    }

    Loader.show("Updating password...");

    try {
      const { data, error } = await sbClient.functions.invoke(
        "verify-reset-otp",
        {
          body: {
            email: window.resetEmailTarget,
            otp: token,
            new_password: newPassword
          }
        }
      );

      if (error || !data || data.success !== true) {
        throw new Error(data?.message || "Invalid OTP.");
      }

      Toast.show("Password changed! Please login.", "success");
      window.Router.navigate("login");

    } catch (err) {
      Toast.show(err.message || "Invalid OTP.", "error");
    } finally {
      Loader.hide();
    }
  };
}

// ==========================================
// PLAYER PROFILE
// ==========================================

export function renderProfile() {
  if (!state.currentUser) {
    window.Router.navigate('login');
    return;
  }

  const p = state.currentProfile || {};
  const avatarSrc = p.avatar_url ||
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';

  const hasReferrer = !!p.referred_by;

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="player-hero-card" style="text-align:center;position:relative;">
        <div style="position:relative;width:84px;height:84px;margin:0 auto 12px auto;">
          <img id="profile-display-avatar" src="${avatarSrc}"
            style="width:100%;height:100%;border-radius:50%;border:3px solid var(--primary);object-fit:cover;" />

          <label for="avatar-file-input"
            style="position:absolute;bottom:0;right:0;background:var(--primary);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <i class="fa-solid fa-camera" style="font-size:12px;"></i>
          </label>

          <input type="file" id="avatar-file-input" accept="image/*" style="display:none;" />
        </div>

        <h2 style="font-family:var(--font-gaming);font-size:22px;margin-bottom:2px;">
          ${escapeHTML(p.free_fire_name || p.full_name || 'Soldier')}
        </h2>

        <span class="uid-tag">
          <i class="fa-solid fa-gamepad"></i> UID: ${escapeHTML(p.free_fire_uid || '--')}
        </span>
      </div>

      <div class="player-hero-card">
        <h3 style="font-family:var(--font-gaming);font-size:16px;color:var(--accent-gold);text-transform:uppercase;margin-bottom:14px;">
          <i class="fa-solid fa-user-pen"></i> Edit Profile Details
        </h3>

        <form id="edit-profile-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="prof-fullname" class="form-input"
              value="${escapeHTML(p.full_name || '')}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Free Fire IGN</label>
            <input type="text" id="prof-ign" class="form-input"
              value="${escapeHTML(p.free_fire_name || '')}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Free Fire UID</label>
            <input type="text" id="prof-uid" class="form-input"
              value="${escapeHTML(p.free_fire_uid || '')}" readonly
              style="background:rgba(255,255,255,0.05);color:#888;cursor:not-allowed;border:1px solid rgba(255,255,255,0.1);" />

            <small style="color:#ff9800;font-size:11px;margin-top:5px;display:block;font-weight:600;">
              UID change krne k liye Admin se Rabta kren
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">WhatsApp Mobile #</label>
            <input type="text" id="prof-phone" class="form-input"
              value="${escapeHTML(p.phone || '')}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="prof-email" class="form-input"
              value="${escapeHTML(p.email || state.currentUser.email)}" readonly
              style="background:rgba(255,255,255,0.05);color:#888;cursor:not-allowed;border:1px solid rgba(255,255,255,0.1);" />

            <small style="color:#8e9bb0;font-size:11px;margin-top:5px;display:block;">
              Email address permanent locked hai.
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Referral Code (UID)</label>
            <input type="text" id="prof-ref" class="form-input"
              value="${escapeHTML(p.referred_by || '')}"
              ${hasReferrer ? 'style="opacity:0.6;cursor:not-allowed;" readonly' : 'placeholder="Enter friend UID"'} />
          </div>

          <button type="submit" id="btn-save-profile" class="btn btn-primary"
            style="margin-top:8px;">
            <i class="fa-solid fa-check"></i> SAVE CHANGES
          </button>
        </form>
      </div>
    </div>
  `;

  const avatarInput = document.getElementById('avatar-file-input');
  if (avatarInput) {
    avatarInput.onchange = (e) => uploadAvatarPhoto(e.target);
  }

  document.getElementById('edit-profile-form').onsubmit = saveUserProfile;
}

// ==========================================
// AVATAR UPLOAD
// ==========================================

export async function uploadAvatarPhoto(input) {
  const file = input.files[0];
  if (!file || !state.currentUser) return;

  if (!file.type.startsWith('image/')) {
    Toast.show("Sirf image files upload karein.", "error");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    Toast.show("Image size 2MB se kam hona chahiye.", "error");
    return;
  }

  Loader.show("Uploading photo...");

  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `${state.currentUser.id}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await sbClient.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sbClient.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await sbClient
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', state.currentUser.id);

    if (updateError) throw updateError;

    const displayAvatar = document.getElementById('profile-display-avatar');
    if (displayAvatar) displayAvatar.src = publicUrl;

    Toast.show("Photo updated!", "success");
    await syncAuthAndProfile();

  } catch (err) {
    console.error(err);
    Toast.show("Failed to upload photo.", "error");
  } finally {
    Loader.hide();
  }
}

// ==========================================
// SAVE PLAYER PROFILE
// ==========================================

export async function saveUserProfile(e) {
  e.preventDefault();

  if (!state.currentUser) return;

  const fullName = document.getElementById('prof-fullname').value.trim();
  const ign = document.getElementById('prof-ign').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();

  const refInputEl = document.getElementById('prof-ref');
  const newRef = refInputEl ? refInputEl.value.trim() : '';

  Loader.show("Saving profile...");

  try {
    let verifiedReferredBy = state.currentProfile?.referred_by || null;

    if (!state.currentProfile?.referred_by && newRef) {
      const { data: refCheck, error: refError } = await sbClient
        .from('profiles')
        .select('id, free_fire_uid')
        .eq('free_fire_uid', newRef)
        .maybeSingle();

      if (refError) throw refError;

      if (refCheck && refCheck.id !== state.currentUser.id) {
        verifiedReferredBy = refCheck.free_fire_uid;
      } else {
        throw new Error("Referral UID valid nahi hai ya aap apni UID use kar rahe hain.");
      }
    }

    const { error } = await sbClient
      .from('profiles')
      .update({
        full_name: fullName,
        free_fire_name: ign,
        phone: phone,
        referred_by: verifiedReferredBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', state.currentUser.id);

    if (error) throw error;

    Toast.show("Profile updated successfully!", "success");

    await syncAuthAndProfile();
    renderProfile();

  } catch (err) {
    console.error(err);
    Toast.show(err.message || "Failed to update profile.", "error");
  } finally {
    Loader.hide();
  }
}

window.renderForgotPassword = renderForgotPassword;
window.renderAuth = renderAuth;
window.uploadAvatarPhoto = uploadAvatarPhoto;
