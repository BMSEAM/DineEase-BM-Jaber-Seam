import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { LoyaltyTransaction } from '../models/LoyaltyTransaction.js';
import { env } from '../config/env.js';

/**
 * F20 — balance, transaction history and redemption rules for the current user.
 * GET /api/loyalty
 */
export const getLoyalty = asyncHandler(async (req, res) => {
  const transactions = await LoyaltyTransaction.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  return sendSuccess(res, {
    message: 'Loyalty details retrieved',
    data: {
      balance: req.user.loyaltyPoints,
      transactions,
      rules: {
        earnRate: env.loyalty.earnRate,
        redeemValue: env.loyalty.redeemValue,
      },
    },
  });
});
