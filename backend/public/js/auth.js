// Redirect straight to the dashboard if already logged in.
if (getToken()) {
  window.location.href = 'dashboard.html';
}

// ---- Tabs ----
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Form').classList.remove('hidden');
  });
});

// Open the Sign Up tab directly when arriving via ?tab=signup (Register button on the homepage)
const requestedTab = new URLSearchParams(window.location.search).get('tab');
if (requestedTab) {
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${requestedTab}"]`);
  if (tabBtn) tabBtn.click();
}

function showMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg ${type}`;
  el.classList.remove('hidden');
}

// ---- Login ----
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        username: document.getElementById('loginUsername').value.trim(),
        password: document.getElementById('loginPassword').value,
        role: document.getElementById('loginRole').value
      }
    });
    saveSession(data.token, data.user);
    window.location.href = 'dashboard.html';
  } catch (err) {
    showMsg('loginMsg', err.message, 'error');
  }
});

// ---- Signup: send OTP ----
let otpVerified = false;

document.getElementById('sendOtpBtn').addEventListener('click', async () => {
  const gmail = document.getElementById('signupGmail').value.trim();
  try {
    const data = await apiRequest('/auth/send-otp', { method: 'POST', body: { gmail } });
    otpVerified = false;
    showMsg('signupMsg', `Demo code sent: ${data.demoOtp} (a real app would email this)`, 'success');
  } catch (err) {
    showMsg('signupMsg', err.message, 'error');
  }
});

// ---- Signup: submit ----
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const gmail = document.getElementById('signupGmail').value.trim();
  const otp = document.getElementById('signupOtp').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  if (password !== confirmPassword) {
    showMsg('signupMsg', 'Passwords do not match.', 'error');
    return;
  }

  try {
    if (!otpVerified) {
      await apiRequest('/auth/verify-otp', { method: 'POST', body: { gmail, otp } });
      otpVerified = true;
    }

    await apiRequest('/auth/signup', {
      method: 'POST',
      body: {
        username: document.getElementById('signupUsername').value.trim(),
        gmail,
        password
      }
    });

    showMsg('signupMsg', 'Signup complete! You can sign in now and pick your role.', 'success');
    document.getElementById('signupForm').reset();
    otpVerified = false;
  } catch (err) {
    showMsg('signupMsg', err.message, 'error');
  }
});

// ---- Reset password: send OTP ----
document.getElementById('resetSendOtpBtn').addEventListener('click', async () => {
  const gmail = document.getElementById('resetGmail').value.trim();
  try {
    const data = await apiRequest('/auth/send-otp', { method: 'POST', body: { gmail } });
    showMsg('resetMsg', `Demo code sent: ${data.demoOtp} (a real app would email this)`, 'success');
  } catch (err) {
    showMsg('resetMsg', err.message, 'error');
  }
});

// ---- Reset password ----
document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: {
        username: document.getElementById('resetUsername').value.trim(),
        gmail: document.getElementById('resetGmail').value.trim(),
        otp: document.getElementById('resetOtp').value.trim(),
        newPassword: document.getElementById('resetPassword').value
      }
    });
    showMsg('resetMsg', 'Password reset successfully. You can sign in now.', 'success');
    document.getElementById('resetForm').reset();
  } catch (err) {
    showMsg('resetMsg', err.message, 'error');
  }
});
