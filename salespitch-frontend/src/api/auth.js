import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export function checkUser(username) {
  return client.post('/check_user', { username });
}
export function loginUser(username, password) {
  return client.post('/token', { username, password });
}
export function registerUser(username, password) {
  return client.post('/register', { username, password });
}