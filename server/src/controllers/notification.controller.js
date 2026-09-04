import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Notification } from '../models/Notification.js';

/**
 * F11 In-site Notification System. Each user reads only their own notifications.
 */

// GET /api/notifications?unread=true
export const listNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(100),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    message: 'Notifications retrieved',
    data: notifications,
    meta: { unreadCount },
  });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return sendSuccess(res, { message: 'Marked as read', data: notification });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );
  return sendSuccess(res, { message: 'All marked as read', data: { updated: result.modifiedCount } });
});
