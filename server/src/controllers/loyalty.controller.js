import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { LoyaltyTransaction } from '../models/LoyaltyTransaction.js';
import { User } from '../models/User.js';

export const getLoyaltyInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  const history = await LoyaltyTransaction.find({ user: user._id }).sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: 'Loyalty information retrieved',
    data: {
      points: user.loyaltyPoints,
      history
    }
  });
});

// For simulated earns, redeems and refunds (usually triggered by Order/Payment controllers)
// But for demonstration, we'll provide some explicit endpoints if needed by F20 tests, or just keep them internal.
// Wait, the client only uses `loyaltyApi.get()`!
// See F05/F16 for actual earning/redeeming logic when payments are made.
