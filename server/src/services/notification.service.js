import { Notification } from '../models/Notification.js';

/**
 * Small helper so feature controllers can raise in-site notifications (F11)
 * without duplicating creation logic. Notifications never block the main flow —
 * failures are swallowed and logged.
 */
export async function notify({ user, type, title, message, link = '' }) {
  try {
    return await Notification.create({ user, type, title, message, link });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[notify] failed to create notification:', err.message);
    return null;
  }
}

export async function notifyMany(items = []) {
  return Promise.all(items.map(notify));
}
