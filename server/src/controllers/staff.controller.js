import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

const STAFF_ROLES = [ROLES.WAITER, ROLES.CLEANER, ROLES.ADMIN];

/**
 * F14 Staff Management (admin only). Create/update/disable staff accounts and
 * assign waiter/cleaner roles.
 */

// GET /api/staff?role=
export const listStaff = asyncHandler(async (req, res) => {
  const filter = { role: { $in: STAFF_ROLES } };
  if (req.query.role && STAFF_ROLES.includes(req.query.role)) filter.role = req.query.role;
  const staff = await User.find(filter).sort({ role: 1, name: 1 });
  return sendSuccess(res, { message: 'Staff retrieved', data: staff });
});

// POST /api/staff  { name, email, password, phone, role }
export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!STAFF_ROLES.includes(role)) {
    throw ApiError.badRequest('Role must be waiter, cleaner or admin');
  }
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password, phone, role });
  return sendSuccess(res, { statusCode: 201, message: 'Staff account created', data: user });
});

// PATCH /api/staff/:id  { name, phone, role }
export const updateStaff = asyncHandler(async (req, res) => {
  const { name, phone, role } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Staff member not found');
  if (!STAFF_ROLES.includes(user.role)) {
    throw ApiError.badRequest('This user is not a staff member');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) {
    if (![ROLES.WAITER, ROLES.CLEANER].includes(role)) {
      throw ApiError.badRequest('Staff role can only be set to waiter or cleaner');
    }
    user.role = role;
  }
  await user.save();
  return sendSuccess(res, { message: 'Staff member updated', data: user });
});

// PATCH /api/staff/:id/disable  and  /enable
export const setStaffActive = (active) =>
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw ApiError.notFound('Staff member not found');
    if (!STAFF_ROLES.includes(user.role)) {
      throw ApiError.badRequest('This user is not a staff member');
    }
    if (String(user._id) === String(req.user._id) && !active) {
      throw ApiError.badRequest('You cannot disable your own account');
    }
    user.isActive = active;
    await user.save();
    return sendSuccess(res, {
      message: active ? 'Staff account enabled' : 'Staff account disabled',
      data: user,
    });
  });
