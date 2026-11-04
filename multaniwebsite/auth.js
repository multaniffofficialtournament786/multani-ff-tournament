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
        <p class="arena-subtitle" id="auth-subtitle">${isLogin ? 'Sign in to enter the arena.' : 'Create your account with Gmail.'}</p>

        ${isLogin ? `
          <form id="login-form">
            <div class="arena-input-box"><i class="fa-solid fa-envelope"></i><input type="email" id="log-email" class="arena-field" placeholder="you@example.com" required /></div>
            <div class="arena-input-box">
              <i class="fa-solid fa-lock"></i>
              <input type="password" id="log-pass" class="arena-field" placeholder="Password" required />
              <i class="fa-solid fa-eye" style="cursor:pointer;" onclick="const p=document.getElementById('log-pass'); p.type=p.type==='password'?'text':'password';"></i>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:14px;">
              <span onclick="window.renderForgotPassword()" style="font-size:12px; color:var(--primary); cursor:pointer; font-weight:600;">Forgot Password?</span>
              <span onclick="window.renderVerifyAccount()" style="font-size:12px; color:var(--primary); cursor:pointer; font-weight:600;">Verify Account?</span>
            </div>
            <button type="submit" class="btn btn-primary" style="background:#ff5733; margin-bottom:12px;">LOGIN</button>
          </form>
        ` : `
          <form id="signup-form">
            <div class="arena-input-box"><i class="fa-solid fa-user"></i><input type="text" id="reg-name" class="arena-field" placeholder="Full Name" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-gamepad"></i><input type="text" id="reg-ign" class="arena-field" placeholder="Free Fire IGN" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-id-card"></i><input type="text" id="reg-uid" class="arena-field" placeholder="Free Fire UID (Permanent)" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-phone"></i><input type="text" id="reg-phone" class="arena-field" placeholder="WhatsApp Mobile # (03001234567)" required /></div>
            <div class="arena-input-box"><i class="fa-solid fa-envelope"></i><input type="email" id="reg-email" class="arena-field" placeholder="Gmail address" required /></div>
            <button type="submit" class="btn btn-primary" style="background:#ff5733; margin-bottom:12px;">CREATE ACCOUNT</button>
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
      try {
        const { error } = await sbClient.auth.signInWithPassword({
          email: document.getElementById('log-email').value.trim(),
          password: document.getElementById('log-pass').value
        });
        if (error) throw error;
        await syncAuthAndProfile();
        Sound.playBrandName();
        if (state.currentProfile?.is_verified === false) {
          Toast.show("Account verify karein, phir app ke features use kar sakenge.", "warning");
          window.Router.navigate('home');
        } else {
          Toast.show("Welcome back!", "success");
          window.Router.navigate('home');
        }
      } catch (err) {
        Toast.show(err.message || "Login failed.", "error");
      } finally {
        Loader.hide();
      }
    };
    return;
  }
    document.getElementById('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const name = document.getElementById('reg-name').value.trim();
    const ign = document.getElementById('reg-ign').value.trim();
    const uid = document.getElementById('reg-uid').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();

    if (!email.endsWith('@gmail.com')) {
      Toast.show("Sirf Gmail address use karein.", "error");
      return;
    }
    if (!uid || !name || !ign || !phone) {
      Toast.show("Tamam details fill karein.", "error");
      return;
    }

    Loader.show("Creating account...");
    try {
      const { data: existingProfiles, error: checkError } = await sbClient
        .from('profiles').select('free_fire_uid,email,phone')
        .or(`free_fire_uid.eq.${uid},email.eq.${email},phone.eq.${phone}`);
      if (checkError) throw checkError;

      if (existingProfiles?.length) {
        if (existingProfiles.some(p => p.free_fire_uid === uid)) throw new Error("Ye Free Fire UID pehle se registered hai!");
        if (existingProfiles.some(p => (p.email || '').toLowerCase() === email)) throw new Error("Ye Gmail pehle se registered hai!");
        throw new Error("Ye mobile number pehle se registered hai!");
      }

      const tempBytes = new Uint8Array(32);
      crypto.getRandomValues(tempBytes);
      const temporaryPassword = Array.from(tempBytes, b => b.toString(16).padStart(2, '0')).join('') + 'aA1!';

      const { data: signUpData, error: signUpError } = await sbClient.auth.signUp({ email, password: temporaryPassword });
      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Account create nahi hua. Dobara koshish karein.");

      const { error: profileError } = await sbClient.from('profiles').upsert([{
        id: userId,
        email,
        full_name: name,
        free_fire_name: ign,
        free_fire_uid: uid,
        phone,
        referred_by: null,
        ref_claimed: false,
        wallet_balance: 0,
        is_banned: false,
        is_admin: false,
        is_verified: false
      }], { onConflict: 'id' });
      if (profileError) throw profileError;

      if (!signUpData.session) {
        const { error: loginError } = await sbClient.auth.signInWithPassword({ email, password: temporaryPassword });
        if (loginError) throw new Error("Account ban gaya, lekin app session start nahi hua.");
      }

      await syncAuthAndProfile();
      Sound.playBrandName();
      Toast.show("Account ban gaya! Ab Gmail OTP se verify karein.", "success");
      window.Router.navigate('home');
      setTimeout(() => {
        Toast.show("Kuch bhi use karne se pehle Verify Account complete karein.", "warning");
      }, 500);
    } catch (err) {
      Toast.show(err.message || "Registration failed.", "error");
    } finally {
      Loader.hide();
    }
  };
}

export function renderVerifyAccount() {
  const view = document.getElementById('app-view');
  const currentEmail = state.currentUser?.email || '';
  view.innerHTML = `
    <div class="view-container">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <button class="icon-btn" onclick="window.Router.navigate('home')" style="width:34px;height:34px;"><i class="fa-solid fa-arrow-left"></i></button>
        <h3 style="font-family:var(--font-gaming);font-size:18px;color:var(--accent-gold);">VERIFY ACCOUNT</h3>
      </div>
      <div class="player-hero-card" style="padding:14px;margin-bottom:14px;">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Apne registered Gmail par OTP mangwayein. OTP verify karne ke baad naya password set ho jayega.</p>
        <form id="verify-send-form">
          <div class="form-group"><label class="form-label">Gmail Address</label><input type="email" id="va-email" class="form-input" value="${escapeHTML(currentEmail)}" placeholder="yourname@gmail.com" required /></div>
          <button type="submit" class="btn btn-primary">SEND OTP TO GMAIL</button>
        </form>
        <form id="verify-otp-form" class="hidden" style="margin-top:16px;">
          <div class="form-group"><label class="form-label">OTP Code</label><input type="text" id="va-otp" class="form-input" placeholder="6-digit OTP" inputmode="numeric" required /></div>
          <div class="form-group"><label class="form-label">New Password</label><input type="password" id="va-newpass" class="form-input" minlength="8" required /></div>
          <div class="form-group"><label class="form-label">Confirm Password</label><input type="password" id="va-confpass" class="form-input" minlength="8" required /></div>
          <button type="submit" class="btn btn-primary">VERIFY & SAVE PASSWORD</button>
        </form>
      </div>
    </div>`;

  document.getElementById('verify-send-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('va-email').value.trim().toLowerCase();
    if (!email.endsWith('@gmail.com')) { Toast.show("Sirf Gmail address use karein.", "error"); return; }
    Loader.show("Sending OTP...");
    try {
      const { data, error } = await sbClient.functions.invoke('send-reset-otp', { body: { email } });
      if (error || !data?.success) throw new Error(data?.message || error?.message || "OTP send nahi hua.");
      window.verifyAccountEmail = email;
      document.getElementById('verify-send-form').classList.add('hidden');
      document.getElementById('verify-otp-form').classList.remove('hidden');
      Toast.show("OTP Gmail par bhej diya gaya.", "success");
    } catch (err) {
      Toast.show(err.message || "OTP send nahi hua.", "error");
    } finally { Loader.hide(); }
  };
    document.getElementById('verify-otp-form').onsubmit = async (e) => {
    e.preventDefault();
    const otp = document.getElementById('va-otp').value.trim();
    const newPassword = document.getElementById('va-newpass').value;
    const confirmPassword = document.getElementById('va-confpass').value;

    if (newPassword.length < 8) {
      Toast.show("Password kam az kam 8 characters ka ho.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show("Passwords match nahi karte.", "error");
      return;
    }

    Loader.show("Verifying account...");
    try {
      const email = window.verifyAccountEmail;
      const { data, error } = await sbClient.functions.invoke('verify-reset-otp', {
        body: { email, otp, new_password: newPassword }
      });
      if (error || !data?.success) {
        throw new Error(data?.message || error?.message || "OTP ghalat ya expire ho gaya.");
      }

      if (!state.currentUser || state.currentUser.email?.toLowerCase() !== email) {
        throw new Error("Isi Gmail wale account mein login karein.");
      }

      const { error: profileError } = await sbClient.from('profiles')
        .update({ is_verified: true, updated_at: new Date().toISOString() })
        .eq('id', state.currentUser.id);
      if (profileError) throw profileError;

      await syncAuthAndProfile();
      Toast.show("Account verified aur password save ho gaya!", "success");
      window.Router.navigate('home');
    } catch (err) {
      Toast.show(err.message || "Account verification failed.", "error");
    } finally {
      Loader.hide();
    }
  };
}

window.renderVerifyAccount = renderVerifyAccount;

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
      const { data, error } = await sbClient.functions.invoke("send-reset-otp", { body: { email } });
      if (error || !data || data.success !== true) throw new Error(data?.message || "Failed to send OTP.");
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
      const { data, error } = await sbClient.functions.invoke("verify-reset-otp", {
        body: { email: window.resetEmailTarget, otp: token, new_password: newPassword }
      });
      if (error || !data || data.success !== true) throw new Error(data?.message || "Invalid OTP.");
      Toast.show("Password changed! Please login.", "success");
      window.Router.navigate("login");
    } catch (err) {
      Toast.show(err.message || "Invalid OTP.", "error");
    } finally {
      Loader.hide();
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
            <small style="color:#ff9800; font-size:11px; margin-top:5px; display:block; font-weight:600;">⚠️ UID change krne k liye Admin se Rabta kren</small>
          </div>
          <div class="form-group"><label class="form-label">WhatsApp Mobile #</label><input type="text" id="prof-phone" class="form-input" value="${escapeHTML(p.phone || '')}" required /></div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="prof-email" class="form-input" value="${escapeHTML(p.email || state.currentUser.email)}" readonly style="background:rgba(255,255,255,0.05); color:#888; cursor:not-allowed; border:1px solid rgba(255,255,255,0.1);" />
            <small style="color:#8e9bb0; font-size:11px; margin-top:5px; display:block;">🔒 Email address permanent locked hai.</small>
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
      const { data: refCheck } = await sbClient.from('profiles')
        .select('id, free_fire_uid').eq('free_fire_uid', newRef).maybeSingle();
      if (refCheck) verifiedReferredBy = refCheck.free_fire_uid;
    }

    const { error } = await sbClient.from('profiles').upsert([{
      id: state.currentUser.id,
      full_name: fullName,
      free_fire_name: ign,
      phone,
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
  
