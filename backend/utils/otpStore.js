// In-memory demo OTP store. key: lowercased gmail -> { otp, expiresAt }
// Shared between /auth (public signup/reset) and /users (Librarian/Admin adding a member),
// since both flows verify the same Gmail-OTP step the console program used.
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function setOtp(gmail) {
  const otp = generateOtp();
  otpStore.set(gmail.toLowerCase(), { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  return otp;
}

function verifyOtp(gmail, otp) {
  const record = otpStore.get((gmail || '').toLowerCase());
  if (!record || record.expiresAt < Date.now()) {
    return { ok: false, error: 'Verification code expired or not requested. Please send a new code.' };
  }
  if (record.otp !== otp) {
    return { ok: false, error: 'Incorrect verification code.' };
  }
  otpStore.delete(gmail.toLowerCase());
  return { ok: true };
}

module.exports = { otpStore, generateOtp, setOtp, verifyOtp };
