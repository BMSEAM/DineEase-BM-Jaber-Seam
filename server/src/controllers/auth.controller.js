import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken, cookieOptions } from '../utils/token.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

function issueToken(res, user) {
  const token = signToken({ id: user._id, role: user.role });
  res.cookie('token', token, cookieOptions);
  return token;
}

// POST /api/auth/register  (public — customers only)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  // Force the customer role regardless of any role sent in the body.
  const user = await User.create({ name, email, password, phone, role: ROLES.CUSTOMER });
  const token = issueToken(res, user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user, token },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password is select:false — request it explicitly for comparison.
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');

  const match = await user.comparePassword(password);
  if (!match) throw ApiError.unauthorized('Invalid email or password');

  const token = issueToken(res, user);
  return sendSuccess(res, {
    message: 'Login successful',
    data: { user, token },
  });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  return sendSuccess(res, { message: 'Logout successful' });
});

// GET /api/auth/me  (protected)
export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: 'Current user', data: { user: req.user } });
});

// PATCH /api/auth/me  (protected)
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  return sendSuccess(res, { message: 'Profile updated', data: { user: req.user } });
});

// PATCH /api/auth/password  (protected)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.badRequest('Current password is incorrect');
  user.password = newPassword;
  await user.save();
  return sendSuccess(res, { message: 'Password changed successfully' });
});
