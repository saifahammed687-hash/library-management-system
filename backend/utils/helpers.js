require('dotenv').config();

const CONFIG = {
  LOAN_DAYS: parseInt(process.env.LOAN_DAYS || '15', 10),
  WARNING_DAYS_BEFORE_DUE: parseInt(process.env.WARNING_DAYS_BEFORE_DUE || '3', 10),
  MAX_BOOKS_PER_USER: parseInt(process.env.MAX_BOOKS_PER_USER || '5', 10),
  MAX_RENEWALS: parseInt(process.env.MAX_RENEWALS || '1', 10)
};

// Roles - mirrors the enum in the original C program.
const ROLES = {
  NONE: 0,
  STUDENT: 1,
  LIBRARIAN: 2,
  ADMIN: 3,
  TEACHER: 4
};

const ROLE_NAMES = {
  0: 'Not assigned',
  1: 'Student',
  2: 'Librarian',
  3: 'Admin',
  4: 'Teacher'
};

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns number of days from `first` to `second` (second - first)
function daysBetween(first, second) {
  const a = new Date(first + 'T00:00:00');
  const b = new Date(second + 'T00:00:00');
  const diffMs = b - a;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function compareDates(first, second) {
  const diff = daysBetween(second, first); // first - second
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

function isValidGmail(gmail) {
  const re = /^[a-zA-Z0-9._+-]+@gmail\.com$/i;
  return re.test(gmail);
}

function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
}

function isFutureDate(dateStr) {
  return compareDates(dateStr, todayStr()) > 0;
}

module.exports = {
  CONFIG,
  ROLES,
  ROLE_NAMES,
  todayStr,
  addDays,
  daysBetween,
  compareDates,
  isFutureDate,
  isValidGmail,
  isStrongPassword
};
