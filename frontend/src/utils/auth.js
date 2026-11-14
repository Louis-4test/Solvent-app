export const USER_UPDATED_EVENT = 'solvent:user-updated';

const notifyUserUpdated = (user) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new window.CustomEvent(USER_UPDATED_EVENT, { detail: user }));
  }
};

export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  const raw = localStorage.getItem('user');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => Boolean(getToken());

export const saveAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  notifyUserUpdated(user);
};

export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  notifyUserUpdated(user);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  notifyUserUpdated(null);
};