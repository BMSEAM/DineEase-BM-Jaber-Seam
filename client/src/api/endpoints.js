import { api, unwrap } from './client.js';

/** Grouped API calls mapped to the DineEase feature set. */

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  logout: () => unwrap(api.post('/auth/logout')),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (body) => unwrap(api.patch('/auth/me', body)),
  changePassword: (body) => unwrap(api.patch('/auth/password', body)),
};

export const menuApi = {
  list: (params) => unwrap(api.get('/menu-items', { params })), // F01/F02
  get: (id) => unwrap(api.get(`/menu-items/${id}`)),
  categories: () => unwrap(api.get('/categories')),
  // F12 admin
  create: (body) => unwrap(api.post('/menu-items', body)),
  update: (id, body) => unwrap(api.patch(`/menu-items/${id}`, body)),
  setAvailability: (id, isAvailable) =>
    unwrap(api.patch(`/menu-items/${id}/availability`, { isAvailable })),
  remove: (id) => unwrap(api.delete(`/menu-items/${id}`)),
  createCategory: (body) => unwrap(api.post('/categories', body)),
  updateCategory: (id, body) => unwrap(api.patch(`/categories/${id}`, body)),
  removeCategory: (id) => unwrap(api.delete(`/categories/${id}`)),
};

export const tableApi = {
  available: (params) => unwrap(api.get('/tables/available', { params })), // F08
  list: () => unwrap(api.get('/tables')), // F13
  create: (body) => unwrap(api.post('/tables', body)),
  update: (id, body) => unwrap(api.patch(`/tables/${id}`, body)),
  disable: (id) => unwrap(api.patch(`/tables/${id}/disable`)),
  enable: (id) => unwrap(api.patch(`/tables/${id}/enable`)),
};

export const reservationApi = {
  create: (body) => unwrap(api.post('/reservations', body)), // F03/F05
  mine: (params) => unwrap(api.get('/reservations/my', { params })), // F04
  get: (id) => unwrap(api.get(`/reservations/${id}`)),
  cancel: (id) => unwrap(api.patch(`/reservations/${id}/cancel`)),
  // F09 staff
  list: (params) => unwrap(api.get('/reservations', { params })),
  approve: (id) => unwrap(api.patch(`/reservations/${id}/approve`)),
  reject: (id, reason) => unwrap(api.patch(`/reservations/${id}/reject`, { reason })),
};

export const orderApi = {
  create: (body) => unwrap(api.post('/orders', body)), // F05
  mine: (params) => unwrap(api.get('/orders/my', { params })), // F10
  get: (id) => unwrap(api.get(`/orders/${id}`)),
  list: (params) => unwrap(api.get('/orders', { params })),
  updateStatus: (id, status) => unwrap(api.patch(`/orders/${id}/status`, { status })),
};

export const favouriteApi = {
  list: () => unwrap(api.get('/favourites')), // F06
  add: (menuItem) => unwrap(api.post('/favourites', { menuItem })),
  remove: (menuItemId) => unwrap(api.delete(`/favourites/${menuItemId}`)),
};

export const reviewApi = {
  list: () => unwrap(api.get('/reviews')), // F07
  mine: () => unwrap(api.get('/reviews/my')),
  create: (body) => unwrap(api.post('/reviews', body)),
  update: (id, body) => unwrap(api.patch(`/reviews/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/reviews/${id}`)),
};

export const notificationApi = {
  list: (params) => unwrap(api.get('/notifications', { params })), // F11
  markRead: (id) => unwrap(api.patch(`/notifications/${id}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/read-all')),
};

export const cleaningApi = {
  completeDining: (reservationId) =>
    unwrap(api.patch(`/cleaning/reservations/${reservationId}/complete`)), // F15
  tasks: (params) => unwrap(api.get('/cleaning/tasks', { params })),
  create: (body) => unwrap(api.post('/cleaning/tasks', body)),
  start: (id) => unwrap(api.patch(`/cleaning/tasks/${id}/start`)),
  ready: (id) => unwrap(api.patch(`/cleaning/tasks/${id}/ready`)),
};

export const staffApi = {
  list: (params) => unwrap(api.get('/staff', { params })), // F14
  create: (body) => unwrap(api.post('/staff', body)),
  update: (id, body) => unwrap(api.patch(`/staff/${id}`, body)),
  disable: (id) => unwrap(api.patch(`/staff/${id}/disable`)),
  enable: (id) => unwrap(api.patch(`/staff/${id}/enable`)),
};

export const paymentApi = {
  pay: (body) => unwrap(api.post('/payments', body)), // F16
  mine: () => unwrap(api.get('/payments/my')),
};

export const invoiceApi = {
  mine: () => unwrap(api.get('/invoices/my')), // F17
  get: (id) => unwrap(api.get(`/invoices/${id}`)),
};

// F16 refund extension (simulated). Customers request; admins process/reject.
export const refundApi = {
  request: (body) => unwrap(api.post('/refunds', body)),
  mine: () => unwrap(api.get('/refunds/my')),
  list: (params) => unwrap(api.get('/refunds', { params })),
  process: (id, body) => unwrap(api.post(`/refunds/${id}/process`, body)),
  reject: (id, body) => unwrap(api.post(`/refunds/${id}/reject`, body)),
};

export const loyaltyApi = {
  get: () => unwrap(api.get('/loyalty')), // F20
};

export const adminApi = {
  dashboard: () => unwrap(api.get('/admin/dashboard')), // F18
  reports: (period) => unwrap(api.get('/admin/reports', { params: { period } })), // F19
};
