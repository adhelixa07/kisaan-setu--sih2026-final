import { getCurrentUser, clearSession } from './api.js';

/**
 * Call at the top of any protected page. Redirects to login if no session,
 * or to the correct role's dashboard if the logged-in user's role doesn't match.
 * @param {'buyer'|'seller'|'admin'|null} requiredRole - pass null to allow any authenticated role
 */
function guardPage(requiredRole = null) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = user.role === 'seller' ? '/seller/dashboard.html' : '/buyer/dashboard.html';
    return null;
  }
  return user;
}

/** Redirects an already-logged-in user away from auth pages straight to their dashboard. */
function redirectIfAuthenticated() {
  const user = getCurrentUser();
  if (user) {
    window.location.href = user.role === 'seller' ? '/seller/dashboard.html' : '/buyer/dashboard.html';
  }
}

function wireLogoutButtons() {
  document.querySelectorAll('[data-action="logout"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = '/index.html';
    });
  });
}

document.addEventListener('DOMContentLoaded', wireLogoutButtons);

export { guardPage, redirectIfAuthenticated };