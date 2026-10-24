import { sbClient, state } from './config.js';
import { loadDashboardStats } from './dashboard.js';

export function togglePasswordVisibility() {
  const passInput = document.getElementById('adm-pass');
  const eyeIcon = document.getElementById('eye-icon');
  if (passInput.type === 'password') {
    passInput.type = 'text';
    eyeIcon.className = 'fa-solid fa-eye-slash';
  } else {
    passInput.type = 'password';
    eyeIcon.className = 'fa-solid fa-eye';
  }
}

export async function checkAdminAuth() {
  const authScreen = document.getElementById('admin-auth-screen');
  const authMsg = document.getElementById('admin-auth-msg');

  try {
    const { data: { session }, error: sessionError } = await sbClient.auth.getSession();
    if (sessionError || !session) {
      authScreen.classList.remove('hidden');
      return;
    }

    const { data: profile, error } = await sbClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile || !profile.is_admin) {
      authScreen.classList.remove('hidden');
      authMsg.innerText = "Access denied: Account is not authorized as an Administrator.";
      authMsg.classList.remove('hidden');
      await sbClient.auth.signOut();
      return;
    }

    state.currentAdmin = profile;
    window.currentAdminUser = profile;
    authScreen.classList.add('hidden');
    document.getElementById('admin-user-name').innerText = profile.free_fire_name || profile.full_name || 'Master Admin';
    if (profile.avatar_url) {
      document.getElementById('admin-user-avatar').src = profile.avatar_url;
    }
    loadDashboardStats();
  } catch (err) {
    authScreen.classList.remove('hidden');
  }
}

export async function handleAdminLogin(e) {
  if (e) e.preventDefault();
  const email = document.getElementById('adm-email').value.trim();
  const password = document.getElementById('adm-pass').value;
  const btn = document.getElementById('btn-adm-login');
  const msg = document.getElementById('admin-auth-msg');

  btn.disabled = true;
  msg.classList.add('hidden');

  try {
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: prof, error: pErr } = await sbClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (pErr || !prof || !prof.is_admin) {
      await sbClient.auth.signOut();
      throw new Error("Unauthorized: This account lacks master admin privileges.");
    }

    state.currentAdmin = prof;
    window.currentAdminUser = prof;
    document.getElementById('admin-auth-screen').classList.add('hidden');
    document.getElementById('admin-user-name').innerText = prof.free_fire_name || prof.full_name || 'Master Admin';
    if (prof.avatar_url) {
      document.getElementById('admin-user-avatar').src = prof.avatar_url;
    }
    loadDashboardStats();
  } catch (err) {
    msg.innerText = err.message || "Failed to authenticate.";
    msg.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
}

export async function adminSignOut() {
  await sbClient.auth.signOut();
  state.currentAdmin = null;
  window.currentAdminUser = null;
  document.getElementById('admin-auth-screen').classList.remove('hidden');
}
