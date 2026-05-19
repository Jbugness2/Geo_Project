// Geography Project — Shared Editor Auth
// First visit: prompts you to SET a password.
// After that: password required to unlock editor mode across all pages.
// Unlock persists for the browser session only.

const AUTH_KEY    = 'geo_project_authed';
const PW_HASH_KEY = 'geo_project_pwhash';

// ── SHA-256 via WebCrypto ────────────────────────────────────────────────────
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2,'0')).join('');
}

function isAuthed()    { return sessionStorage.getItem(AUTH_KEY) === '1'; }
function hasPassword() { return !!localStorage.getItem(PW_HASH_KEY); }

// ── Apply lock state to the page ─────────────────────────────────────────────
function applyAuthState(authed) {
  document.body.dataset.editMode = authed ? 'on' : 'off';

  document.querySelectorAll('.edit-only').forEach(el => {
    el.style.display = authed ? '' : 'none';
  });
  document.querySelectorAll('.lock-on-view input, .lock-on-view textarea, .lock-on-view select').forEach(el => {
    el.disabled = !authed;
    el.style.pointerEvents = authed ? '' : 'none';
    el.style.cursor        = authed ? '' : 'default';
  });

  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (authed) {
    btn.textContent    = '🔓 Editor Mode';
    btn.style.background  = 'rgba(126,184,154,0.25)';
    btn.style.color       = '#7eb89a';
    btn.style.borderColor = '#7eb89a';
  } else {
    btn.textContent    = '🔒 Editor Login';
    btn.style.background  = 'rgba(255,255,255,0.08)';
    btn.style.color       = 'rgba(232,213,176,0.7)';
    btn.style.borderColor = 'rgba(255,255,255,0.15)';
  }
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  applyAuthState(false);
}

function removeModal() {
  document.getElementById('auth-modal')?.remove();
}

// ── Login modal ───────────────────────────────────────────────────────────────
function buildLoginModal() {
  removeModal();
  const overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(15,22,18,0.85);
    backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;
    justify-content:center;font-family:'DM Sans',sans-serif;`;
  overlay.innerHTML = `
    <div style="background:#1e3028;border:1.5px solid #3a6050;border-radius:10px;
      padding:36px 40px;max-width:380px;width:90%;box-shadow:0 24px 60px rgba(0,0,0,0.55);position:relative;">
      <button onclick="removeModal()" style="position:absolute;top:14px;right:16px;
        background:none;border:none;color:rgba(232,213,176,0.4);font-size:1.4rem;cursor:pointer;">×</button>
      <div style="font-size:2rem;text-align:center;margin-bottom:10px;">🔐</div>
      <h2 style="font-family:'Playfair Display',serif;color:#e8d5b0;font-size:1.3rem;
        text-align:center;margin-bottom:6px;">Editor Login</h2>
      <p style="color:rgba(232,213,176,0.5);font-size:0.82rem;text-align:center;
        margin-bottom:22px;line-height:1.5;">Enter your password to unlock editing on this page.</p>
      <input type="password" id="auth-pw-input" placeholder="Password…"
        style="width:100%;padding:11px 14px;border:1.5px solid #3a6050;border-radius:5px;
          background:rgba(255,255,255,0.07);color:#e8d5b0;font-family:'DM Sans',sans-serif;
          font-size:0.92rem;outline:none;margin-bottom:8px;box-sizing:border-box;"
        onfocus="this.style.borderColor='#7eb89a'" onblur="this.style.borderColor='#3a6050'"
        onkeydown="if(event.key==='Enter')authSubmit()" />
      <p id="auth-error" style="color:#e07070;font-size:0.8rem;min-height:18px;
        margin-bottom:14px;text-align:center;"></p>
      <button onclick="authSubmit()" style="width:100%;padding:12px;background:#2d4a3e;
        border:1.5px solid #7eb89a;border-radius:5px;color:#e8d5b0;
        font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;"
        onmouseover="this.style.background='#3a6050'" onmouseout="this.style.background='#2d4a3e'">
        Unlock →</button>
      <p style="text-align:center;margin-top:14px;">
        <a href="#" onclick="buildSetPasswordModal();return false;"
          style="color:rgba(126,184,154,0.5);font-size:0.78rem;text-decoration:none;"
          onmouseover="this.style.color='#7eb89a'" onmouseout="this.style.color='rgba(126,184,154,0.5)'">
          Change / reset password</a></p>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('auth-pw-input')?.focus(), 80);
}

// ── Set / change password modal ───────────────────────────────────────────────
function buildSetPasswordModal() {
  removeModal();
  const first = !hasPassword();
  const overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(15,22,18,0.85);
    backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;
    justify-content:center;font-family:'DM Sans',sans-serif;`;
  overlay.innerHTML = `
    <div style="background:#1e3028;border:1.5px solid #3a6050;border-radius:10px;
      padding:36px 40px;max-width:400px;width:90%;box-shadow:0 24px 60px rgba(0,0,0,0.55);position:relative;">
      <button onclick="removeModal()" style="position:absolute;top:14px;right:16px;
        background:none;border:none;color:rgba(232,213,176,0.4);font-size:1.4rem;cursor:pointer;">×</button>
      <div style="font-size:2rem;text-align:center;margin-bottom:10px;">🛡️</div>
      <h2 style="font-family:'Playfair Display',serif;color:#e8d5b0;font-size:1.3rem;
        text-align:center;margin-bottom:6px;">${first ? 'Set Editor Password' : 'Change Password'}</h2>
      <p style="color:rgba(232,213,176,0.5);font-size:0.82rem;text-align:center;
        margin-bottom:22px;line-height:1.5;">
        ${first ? 'Choose a password. You\'ll need it to edit the crossword, quiz, and to-do list across all pages.'
                : 'Verify your current password, then choose a new one.'}</p>
      ${!first ? `<label style="color:rgba(232,213,176,0.55);font-size:0.78rem;display:block;margin-bottom:4px;">Current password</label>
        <input type="password" id="auth-old-pw" placeholder="Current password…"
          style="width:100%;padding:10px 14px;border:1.5px solid #3a6050;border-radius:5px;
            background:rgba(255,255,255,0.07);color:#e8d5b0;font-family:'DM Sans',sans-serif;
            font-size:0.9rem;outline:none;margin-bottom:14px;box-sizing:border-box;"
          onfocus="this.style.borderColor='#7eb89a'" onblur="this.style.borderColor='#3a6050'" />` : ''}
      <label style="color:rgba(232,213,176,0.55);font-size:0.78rem;display:block;margin-bottom:4px;">New password</label>
      <input type="password" id="auth-new-pw" placeholder="New password…"
        style="width:100%;padding:10px 14px;border:1.5px solid #3a6050;border-radius:5px;
          background:rgba(255,255,255,0.07);color:#e8d5b0;font-family:'DM Sans',sans-serif;
          font-size:0.9rem;outline:none;margin-bottom:12px;box-sizing:border-box;"
        onfocus="this.style.borderColor='#7eb89a'" onblur="this.style.borderColor='#3a6050'" />
      <label style="color:rgba(232,213,176,0.55);font-size:0.78rem;display:block;margin-bottom:4px;">Confirm new password</label>
      <input type="password" id="auth-confirm-pw" placeholder="Confirm…"
        style="width:100%;padding:10px 14px;border:1.5px solid #3a6050;border-radius:5px;
          background:rgba(255,255,255,0.07);color:#e8d5b0;font-family:'DM Sans',sans-serif;
          font-size:0.9rem;outline:none;margin-bottom:10px;box-sizing:border-box;"
        onfocus="this.style.borderColor='#7eb89a'" onblur="this.style.borderColor='#3a6050'"
        onkeydown="if(event.key==='Enter')authSetPassword()" />
      <p id="auth-error" style="color:#e07070;font-size:0.8rem;min-height:18px;
        margin-bottom:14px;text-align:center;"></p>
      <button onclick="authSetPassword()" style="width:100%;padding:12px;background:#c4703a;
        border:1.5px solid #e8903a;border-radius:5px;color:white;
        font-family:'DM Sans',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;"
        onmouseover="this.style.background='#a85e2e'" onmouseout="this.style.background='#c4703a'">
        ${first ? 'Set Password & Unlock' : 'Update Password'}</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => (document.getElementById('auth-old-pw') || document.getElementById('auth-new-pw'))?.focus(), 80);
}

// ── Handlers ──────────────────────────────────────────────────────────────────
async function authSubmit() {
  const pw  = document.getElementById('auth-pw-input')?.value || '';
  const err = document.getElementById('auth-error');
  if (!pw) { err.textContent = 'Please enter your password.'; return; }
  if (!hasPassword()) { buildSetPasswordModal(); return; }

  const h = await hashPassword(pw);
  if (h === localStorage.getItem(PW_HASH_KEY)) {
    sessionStorage.setItem(AUTH_KEY, '1');
    removeModal();
    applyAuthState(true);
  } else {
    err.textContent = 'Incorrect password. Try again.';
    document.getElementById('auth-pw-input').value = '';
    document.getElementById('auth-pw-input').focus();
  }
}

async function authSetPassword() {
  const oldPwEl   = document.getElementById('auth-old-pw');
  const newPw     = (document.getElementById('auth-new-pw')?.value || '').trim();
  const confirmPw = (document.getElementById('auth-confirm-pw')?.value || '').trim();
  const err       = document.getElementById('auth-error');

  if (!newPw)              { err.textContent = 'Please enter a new password.'; return; }
  if (newPw.length < 4)   { err.textContent = 'Password must be at least 4 characters.'; return; }
  if (newPw !== confirmPw) { err.textContent = 'Passwords do not match.'; return; }

  if (hasPassword() && oldPwEl) {
    const oldPw = oldPwEl.value || '';
    if (!oldPw) { err.textContent = 'Please enter your current password.'; return; }
    const oldH = await hashPassword(oldPw);
    if (oldH !== localStorage.getItem(PW_HASH_KEY)) {
      err.textContent = 'Current password is incorrect.';
      oldPwEl.value = ''; oldPwEl.focus(); return;
    }
  }

  localStorage.setItem(PW_HASH_KEY, await hashPassword(newPw));
  sessionStorage.setItem(AUTH_KEY, '1');
  removeModal();
  applyAuthState(true);

  // Toast confirmation
  const toast = document.createElement('div');
  toast.textContent = '✅ Password saved. Editor mode is unlocked.';
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;background:#2d4a3e;
    color:#e8d5b0;border:1px solid #7eb89a;border-radius:6px;padding:12px 20px;
    font-family:'DM Sans',sans-serif;font-size:0.88rem;z-index:9999;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Nav button ────────────────────────────────────────────────────────────────
function openAuthModal() {
  if (isAuthed()) {
    if (confirm('Lock editor mode? You\'ll need your password to edit again.')) logout();
  } else {
    hasPassword() ? buildLoginModal() : buildSetPasswordModal();
  }
}

function injectAuthButton() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const btn = document.createElement('button');
  btn.id = 'auth-btn';
  btn.onclick = openAuthModal;
  btn.style.cssText = `float:right;border-radius:4px;padding:5px 14px;
    font-family:'DM Sans',sans-serif;font-size:0.8rem;cursor:pointer;
    transition:all .2s;letter-spacing:.04em;border-width:1.5px;border-style:solid;`;
  nav.appendChild(btn);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectAuthButton();
  applyAuthState(isAuthed());

  // Nudge user to set a password if none exists yet
  if (!hasPassword()) {
    setTimeout(() => {
      const btn = document.getElementById('auth-btn');
      if (btn) {
        btn.textContent    = '⚠️ Set Password';
        btn.style.borderColor = '#c4703a';
        btn.style.color       = '#e8a060';
        btn.style.background  = 'rgba(196,112,58,0.15)';
        btn.title = 'No editor password set yet — click to create one';
      }
    }, 400);
  }
});