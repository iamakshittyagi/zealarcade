import api from './axios';

// Register a new user
export const registerUser = async ({ username, email, password }) => {
  const res = await api.post('/auth/register', { username, email, password });
  return res.data;  // { message, token, user }
};

// Login an existing user
export const loginUser = async ({ username, password }) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
};

// Get the currently-logged-in user (JWT auto-attached by interceptor)
export const fetchMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;  // { user }
};
export const adminLoginUser = async ({ username, password }) => {
  const res = await api.post('/auth/admin-login', { username, password });
  return res.data;  // { token, user }
};
