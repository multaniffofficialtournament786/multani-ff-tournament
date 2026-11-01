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
      state.userJoinedTournamentIds.clear();
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
  const avatarUrl = state.currentProfile?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';

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

export function renderAuth(mode = 'login') {
  const isLogin = (mode === 'login');
  const view = document.getElementById('app-view');

  view.innerHTML = `
    <div class="view-container">
      <div class="arena-login-wrap">
        <h2 class="arena-title">MULTANI FF ARENA</h2>
        <p class="arena-subtitle" id="auth-subtitle">${isLogin ? 'Sign in to enter the arena.' : 'Create an account to join tournaments.'}</p>

        ${isLogin ? `
          <form id="login-form">
            <div class="arena-input-box">
              <i class="fa-solid fa-envelope"></i>
              <input type="email" id="log-email" class="arena-field" placeholder="you@example.com" required />
            </div>
            <div class="arena-input-box">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="log-pass" class="arena-field" placeholder="••••••••" required />
              <i class="fa-solid fa-eye" style="cursor:pointer;" onclick="const p=document.getElementById('log-pass'); p.type=p.type==='password'?'text':'password';"></i>
            </div>
            <div style="text-align:right; margin-bottom:14px;">
              <span onclick="window.renderForgotPassword()" style="font-size:12px; color:var(--primary); cursor:pointer; font-weight:600;">Forgot Password?</span>
            </div>
            <button type="submit" class="btn btn-primary" style="background:#ff5733; margin-bottom:12px;">LOGIN</button>
          </form>
        ` : `
          <form id="signup-form">
            <div class="arena-input-box"><i class="fa-solid fa-user"></i><input type="text" id="reg-name" class="arena-field" placeholder="Full Name" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-gamepad"></i><input type="text" id="reg-ign" class="arena-field" placeholder="Free Fire IGN (e.g. MULTANI・HAMZA★)" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-id-card"></i><input type="text" id="reg-uid" class="arena-field" placeholder="Free Fire UID (Permanent)" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-phone"></i><input type="text" id="reg-phone" class="arena-field" placeholder="WhatsApp Mobile # (03001234567)" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-envelope"></i><input type="email" id="reg-email" class="arena-field" placeholder="you@example.com" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-lock"></i><input type="password" id="reg-pass" class="arena-field" placeholder="Password (min 6 chars)" minlength="6" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-users"></i><input type="text" id="reg-ref" class="arena-field" placeholder="Referral Code UID (Optional)" /></div>
            <button type="submit" class="btn btn-primary" style="background:#ff5733; margin-bottom:12px;">REGISTER</button>
          </form>

          <!-- GMAIL OTP VERIFICATION FORM -->
          <form id="signup-otp-form" class="hidden">
            <div style="background: rgba(0, 240, 255, 0.08); border: 1px solid var(--accent-cyan); border-radius: 10px; padding: 12px; margin-bottom: 14px; text-align: center;">
              <i class="fa-solid fa-envelope-circle-check" style="color: var(--accent-cyan); font-size: 24px; margin-bottom: 6px;"></i>
              <p style="font-size: 13px; color: #fff; margin-bottom: 4px;">Gmail par Confirmation Code bhej diya gaya hai!</p>
              <span id="target-gmail-text" style="font-size: 12px; color: var(--accent-gold); font-weight: bold;"></span>
            </div>

            <div class="arena-input-box">
              <i class="fa-solid fa-key"></i>
              <input type="text" id="signup-otp-code" class="arena-field" placeholder="Enter 6-digit confirmation code" required />
            </div>

            <button type="submit" class="btn btn-primary" style="background: #00e676; color: #000; font-weight: 800; margin-bottom: 10px;">
              VERIFY & CREATE ACCOUNT
            </button>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <span id="btn-resend-signup-otp" style="font-size: 12px; color: var(--accent-cyan); cursor: pointer; text-decoration: underline;">Resend Code (3 left)</span>
              <span id="btn-cancel-signup-otp" style="font-size: 12px; color: var(--danger); cursor: pointer;">Change Details</span>
            </div>
          </form>
        `}

        <div style="text-align:center; font-size:13px; color:var(--text-muted); margin-top:16px;">
          ${isLogin ? `Don't have an account? <span onclick="window.Router.navigate('register')" style="color:var(--primary); font-weight:bold; cursor:pointer;">Sign Up</span>` : `Already have an account? <span onclick="window.Router.navigate('login')" style="color:var(--primary); font-weight:bold; cursor:pointer;">Login</span>`}
        </div>
      </div>
    </div>
  `;

  if (isLogin) {
    document.getElementById('login-form').onsubmit = async (e) => {
      e.preventDefault();
      Loader.show("Signing in...");
      const { error } = await sbClient.auth.signInWithPassword({
        email: document.getElementById('log-email').value,
        password: document.getElementById('log-pass').value
      });
      Loader.hide();

      if (error) {
        Toast.show(error.message, "error");
      } else {
        Sound.playBrandName();
        Toast.show("Welcome back!", "success");
        await syncAuthAndProfile();
        window.Router.navigate('home');
      }
    };
  } else {
    let pendingRegistration = null;

    const signupForm = document.getElementById('signup-form');
    const otpForm = document.getElementById('signup-otp-form');
    const targetGmailText = document.getElementById('target-gmail-text');
    const btnResend = document.getElementById('btn-resend-signup-otp');

    // Helper functions for daily 3 resend limit
    const getTodayDateStr = () => new Date().toISOString().split('T')[0];

    const getResendCount = (email) => {
      try {
        const key = `resend_otp_${email}_${getTodayDateStr()}`;
        return parseInt(localStorage.getItem(key) || '0', 10);
      } catch (err) {
        return 0;
      }
    };

    const incrementResendCount = (email) => {
      try {
        const key = `resend_otp_${email}_${getTodayDateStr()}`;
        const current = getResendCount(email);
        localStorage.setItem(key, String(current + 1));
        return current + 1;
      } catch (err) {
        return 1;
      }
    };

    const updateResendButtonUI = (email) => {
      if (!btnResend) return;
      const count = getResendCount(email);
      const remaining = Math.max(0, 3 - count);
      if (remaining > 0) {
        btnResend.innerText = `Resend Code (${remaining} left)`;
        btnResend.style.opacity = '1';
        btnResend.style.pointerEvents = 'auto';
      } else {
        btnResend.innerText = 'Limit Reached (Try tomorrow)';
        btnResend.style.opacity = '0.5';
        btnResend.style.pointerEvents = 'none';
      }
    };

    signupForm.onsubmit = async (e) => {
      e.preventDefault();
      Loader.show("Validating details...");
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-pass').value;
      const name = document.getElementById('reg-name').value.trim();
      const ign = document.getElementById('reg-ign').value.trim();
      const uid = document.getElementById('reg-uid').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const refInput = document.getElementById('reg-ref').value.trim();

      if (!uid) {
        Loader.hide();
        Toast.show("Free Fire UID enter karein!", "error");
        return;
      }

      try {
        const { data: existingProfiles, error: checkError } = await sbClient
          .from('profiles')
          .select('free_fire_uid, email, phone')
          .or(`free_fire_uid.eq.${uid},email.eq.${email},phone.eq.${phone}`);

        if (checkError) throw checkError;

        if (existingProfiles && existingProfiles.length > 0) {
          Loader.hide();
          const match = existingProfiles.find(p => p.free_fire_uid === uid);
          if (match) {
            Toast.show("Ye Free Fire UID pehle se registered hai! Har account ke liye alag UID honi chahiye.", "error");
            return;
          }
          const emailMatch = existingProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
          if (emailMatch) {
            Toast.show("Ye Email pehle se registered hai!", "error");
            return;
          }
          Toast.show("Ye Mobile Number pehle se registered hai!", "error");
          return;
        }

        let validReferrerUid = null;
        if (refInput) {
          if (refInput === uid) {
            Loader.hide();
            Toast.show("Khud ki UID referral code mein use nahi kar sakte!", "error");
            return;
          }
          const { data: refCheck } = await sbClient.from('profiles').select('id, free_fire_uid').eq('free_fire_uid', refInput).maybeSingle();
          if (refCheck) validReferrerUid = refCheck.free_fire_uid;
        }

        Loader.show("Gmail par code send ho raha hai...");

        const { data, error } = await sbClient.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        pendingRegistration = {
          email,
          password,
          name,
          ign,
          uid,
          phone,
          referred_by: validReferrerUid
        };

        Loader.hide();
        Toast.show("Confirmation code aapke Gmail par bhej diya gaya hai!", "success");

        if (targetGmailText) targetGmailText.innerText = email;
        const subTitle = document.getElementById('auth-subtitle');
        if (subTitle) subTitle.innerText = "Gmail Confirmation Code verify karein.";

        updateResendButtonUI(email);

        signupForm.classList.add('hidden');
        otpForm.classList.remove('hidden');

      } catch (err) {
        Loader.hide();
        Toast.show(err.message || "Registration failed.", "error");
      }
    };

    otpForm.onsubmit = async (e) => {
      e.preventDefault();
      if (!pendingRegistration) {
        Toast.show("Kuch galat hua. Dubara register karein.", "error");
        return;
      }

      const token = document.getElementById('signup-otp-code').value.trim();
      if (!token) {
        Toast.show("Please enter confirmation code!", "error");
        return;
      }

      Loader.show("Code verify ho raha hai...");

      try {
        const { data: verifyData, error: verifyError } = await sbClient.auth.verifyOtp({
          email: pendingRegistration.email,
          token: token,
          type: 'signup'
        });

        if (verifyError) throw verifyError;

        const userId = verifyData.user?.id || (await sbClient.auth.getUser()).data.user?.id;

        if (!userId) {
          throw new Error("Verification to ho gayi lekin user session create nahi hua.");
        }

        await sbClient.from('profiles').upsert([{
          id: userId,
          email: pendingRegistration.email,
          full_name: pendingRegistration.name,
          free_fire_name: pendingRegistration.ign,
          free_fire_uid: pendingRegistration.uid,
          phone: pendingRegistration.phone,
          referred_by: pendingRegistration.referred_by,
          ref_claimed: false,
          wallet_balance: 0,
          is_banned: false,
          is_admin: false
        }]);

        Loader.hide();
        Sound.playBrandName();
        Toast.show("Account verify ho gaya aur ban gaya!", "success");
        await syncAuthAndProfile();
        window.Router.navigate('home');

      } catch (err) {
        Loader.hide();
        Toast.show(err.message || "Ghalat ya expired code!", "error");
      }
    };

    // Resend handler with strict 3-per-day limit
    if (btnResend) {
      btnResend.onclick = async () => {
        if (!pendingRegistration?.email) return;

        const currentCount = getResendCount(pendingRegistration.email);
        if (currentCount >= 3) {
          Toast.show("Aaj ki 3 attempts poori ho chuki hain! Kal dubara try karein.", "error");
          updateResendButtonUI(pendingRegistration.email);
          return;
        }

        Loader.show("Code dobara bhej rahe hain...");
        try {
          const { error } = await sbClient.auth.resend({
            type: 'signup',
            email: pendingRegistration.email
          });
          Loader.hide();

          if (error) throw error;

          const updated = incrementResendCount(pendingRegistration.email);
          updateResendButtonUI(pendingRegistration.email);

          Toast.show(`Naya code bhej diya gaya! (${3 - updated} attempts baqi hain)`, "success");
        } catch (err) {
          Loader.hide();
          Toast.show(err.message || "Code send failed.", "error");
        }
      };
    }

    const btnCancel = document.getElementById('btn-cancel-signup-otp');
    if (btnCancel) {
      btnCancel.onclick = () => {
        otpForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        const subTitle = document.getElementById('auth-subtitle');
        if (subTitle) subTitle.innerText = "Create an account to join tournaments.";
      };
    }
  }
}

export function renderForgotPassword() {
  const view = document.getElementById('app-view');
  view.innerHTML = `
    <div class="view-container">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
        <button class="icon-btn" onclick="window.Router.navigate('login')" style="width:34px; height:34px;"><i class="fa-solid fa-arrow-left"></i></button>
        <h3 style="font-family:var(--font-gaming); font-size:18px; color:var(--accent-gold);">RESET PASSWORD</h3>
      </div>

      <form id="forgot-email-form">
        <div class="player-hero-card" style="margin-bottom:14px; padding:14px;">
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">Enter your registered Gmail address to receive the password reset OTP code.</p>
          <div class="form-group">
            <label class="form-label">Gmail Address</label>
            <input type="email" id="fg-email" class="form-input" placeholder="e.g. yourname@gmail.com" required />
          </div>
          <button type="submit" class="btn btn-primary">SEND OTP TO GMAIL</button>
        </div>
      </form>

      <form id="forgot-verify-form" class="hidden">
        <div class="player-hero-card" style="margin-bottom:14px; padding:14px;">
          <p style="font-size:12px; color:var(--success); margin-bottom:10px;"><i class="fa-solid fa-circle-check"></i> OTP sent to Gmail!</p>
          <div class="form-group"><label class="form-label">OTP Code</label><input type="text" id="fg-otp" class="form-input" placeholder="Enter 6-digit OTP" required /></div>
          <div class="form-group"><label class="form-label">New Password</label><input type="password" id="fg-newpass" class="form-input" placeholder="At least 8 chars" minlength="8" required /></div>
          <div class="form-group"><label class="form-label">Confirm Password</label><input type="password" id="fg-confpass" class="form-input" placeholder="Re-enter password" minlength="8" required /></div>
          <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg, #00e676, #00b0ff); color:#000;">UPDATE PASSWORD</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('forgot-email-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('fg-email').value.trim();
    Loader.show("Sending OTP...");
    try {
      const { data, error } = await sbClient.functions.invoke("send-reset-otp", { body: { email: email } });
      Loader.hide();
      if (error || !data || data.success !== true) throw new Error(data?.message || "Failed to send OTP.");
      window.resetEmailTarget = email;
      Toast.show("OTP sent to your Gmail!", "success");
      document.getElementById('forgot-email-form').classList.add('hidden');
      document.getElementById('forgot-verify-form').classList.remove('hidden');
    } catch (err) {
      Loader.hide();
      Toast.show(err.message || "Failed to send OTP.", "error");
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
      const { data, error } = await sbClient.functions.invoke("verify-reset-otp", { body: { email: window.resetEmailTarget, otp: token, new_password: newPassword } });
      Loader.hide();
      if (error || !data || data.success !== true) throw new Error(data?.message || "Invalid OTP.");
      Toast.show("Password changed! Please login.", "success");
      window.Router.navigate("login");
    } catch (err) {
      Loader.hide();
      Toast.show(err.message || "Invalid OTP.", "error");
    }
  };
}

export function renderProfile() {
  if (!state.currentUser) { 
    window.Router.navigate('login'); 
    return; 
  }
  
  const p = state.currentProfile || {};
  const avatarSrc = p.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80';
  const hasReferrer = !!p.referred_by;

  document.getElementById('app-view').innerHTML = `
    <div class="view-container">
      <div class="player-hero-card" style="text-align:center; position:relative;">
        <div style="position:relative; width:84px; height:84px; margin:0 auto 12px auto;">
          <img id="profile-display-avatar" src="${avatarSrc}" style="width:100%; height:100%; border-radius:50%; border:3px solid var(--primary); object-fit:cover;" />
          <label for="avatar-file-input" style="position:absolute; bottom:0; right:0; background:var(--primary); color:#fff; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">
            <i class="fa-solid fa-camera" style="font-size:12px;"></i>
          </label>
          <input type="file" id="avatar-file-input" accept="image/*" style="display:none;" onchange="window.uploadAvatarPhoto(this)" />
        </div>
        <h2 style="font-family:var(--font-gaming); font-size:22px; margin-bottom:2px;">${escapeHTML(p.free_fire_name || p.full_name || 'Soldier')}</h2>
        <span class="uid-tag"><i class="fa-solid fa-gamepad"></i> UID: ${escapeHTML(p.free_fire_uid || '--')}</span>
      </div>

      <div class="player-hero-card">
        <h3 style="font-family:var(--font-gaming); font-size:16px; color:var(--accent-gold); text-transform:uppercase; margin-bottom:14px;">
          <i class="fa-solid fa-user-pen"></i> Edit Profile Details
        </h3>

        <form id="edit-profile-form">
          <div class="form-group"><label class="form-label">Full Name</label><input type="text" id="prof-fullname" class="form-input" value="${escapeHTML(p.full_name || '')}" required /></div>
          <div class="form-group"><label class="form-label">Free Fire IGN</label><input type="text" id="prof-ign" class="form-input" value="${escapeHTML(p.free_fire_name || '')}" required /></div>
          
          <div class="form-group">
            <label class="form-label">Free Fire UID</label>
            <input type="text" id="prof-uid" class="form-input" value="${escapeHTML(p.free_fire_uid || '')}" readonly style="background:rgba(255,255,255,0.05); color:#888; cursor:not-allowed; border:1px solid rgba(255,255,255,0.1);" />
            <small style="color:#ff9800; font-size:11px; margin-top:5px; display:block; font-weight:600;">
              ⚠️ UID change krne k liye Admin se Rabta kren
            </small>
          </div>

          <div class="form-group"><label class="form-label">WhatsApp Mobile #</label><input type="text" id="prof-phone" class="form-input" value="${escapeHTML(p.phone || '')}" required /></div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="prof-email" class="form-input" value="${escapeHTML(p.email || state.currentUser.email)}" readonly style="background:rgba(255,255,255,0.05); color:#888; cursor:not-allowed; border:1px solid rgba(255,255,255,0.1);" />
            <small style="color:#8e9bb0; font-size:11px; margin-top:5px; display:block;">
              🔒 Email address permanent locked hai.
            </small>
          </div>

          <div class="form-group">
            <label class="form-label">Referral Code (UID)</label>
            <input type="text" id="prof-ref" class="form-input" value="${escapeHTML(p.referred_by || '')}" ${hasReferrer ? 'style="opacity:0.6; cursor:not-allowed;" readonly' : 'placeholder="Enter friend UID"'} />
          </div>
          <button type="submit" id="btn-save-profile" class="btn btn-primary" style="margin-top:8px;"><i class="fa-solid fa-check"></i> SAVE CHANGES</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('edit-profile-form').onsubmit = saveUserProfile;
}

export async function uploadAvatarPhoto(input) {
  const file = input.files[0];
  if (!file || !state.currentUser) return;

  Loader.show("Uploading photo...");
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${state.currentUser.id}_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await sbClient.storage.from('deposit-screenshots').upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = sbClient.storage.from('deposit-screenshots').getPublicUrl(filePath);
    await sbClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', state.currentUser.id);

    document.getElementById('profile-display-avatar').src = publicUrl;
    Toast.show("Photo updated!", "success");
    await syncAuthAndProfile();
  } catch (err) {
    Toast.show("Failed to upload photo.", "error");
  } finally {
    Loader.hide();
  }
}

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
      const { data: refCheck } = await sbClient.from('profiles').select('id, free_fire_uid').eq('free_fire_uid', newRef).maybeSingle();
      if (refCheck) verifiedReferredBy = refCheck.free_fire_uid;
    }

    const { error } = await sbClient.from('profiles').upsert([{
      id: state.currentUser.id,
      full_name: fullName,
      free_fire_name: ign,
      phone: phone,
      referred_by: verifiedReferredBy,
      updated_at: new Date().toISOString()
    }], { onConflict: 'id' });

    if (error) throw error;

    Toast.show("Profile updated successfully!", "success");
    await syncAuthAndProfile();
    renderProfile();
  } catch (err) {
    Toast.show("Failed to update profile.", "error");
  } finally {
    Loader.hide();
  }
}
