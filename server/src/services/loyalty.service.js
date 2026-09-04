import { User } from '../models/User.js';
import { LoyaltyTransaction } from '../models/LoyaltyTransaction.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { LOYALTY_TX_TYPE } from '../config/constants.js';

/**
 * F20 Loyalty and Reward Points.
 * earnRate   = points earned per 1 currency unit paid.
 * redeemValue = currency-unit discount per 1 point redeemed.
 */

export function pointsForAmount(amount) {
  return Math.floor(amount * env.loyalty.earnRate);
}

export function discountForPoints(points) {
  return Number((points * env.loyalty.redeemValue).toFixed(2));
}

/**
 * Validate a redemption request against the customer's live balance and the
 * bill it is applied to. Returns the discount value (does not mutate yet).
 */
export function validateRedemption({ user, points, maxDiscount }) {
  if (points <= 0) throw ApiError.badRequest('Points to redeem must be positive');
  if (!Number.isInteger(points)) throw ApiError.badRequest('Points must be a whole number');
  if (points > user.loyaltyPoints) {
    throw ApiError.badRequest(`Insufficient points. Balance: ${user.loyaltyPoints}`);
  }
  const discount = discountForPoints(points);
  if (discount > maxDiscount) {
    throw ApiError.badRequest('Redeemed points exceed the payable amount');
  }
  return discount;
}

/** Deduct redeemed points and write a ledger entry. */
export async function redeemPoints({ user, points, payment, description }) {
  user.loyaltyPoints -= points;
  await user.save();
  await LoyaltyTransaction.create({
    customer: user._id,
    type: LOYALTY_TX_TYPE.REDEEM,
    points,
    balanceAfter: user.loyaltyPoints,
    description: description || 'Points redeemed for discount',
    payment: payment?._id,
  });
  return user.loyaltyPoints;
}

/**
 * Reverse the loyalty movements of a refunded payment exactly once, keeping the
 * ledger balanced and the balance non-negative (F20 refund extension):
 *  - claw back the points that were EARNED on this payment;
 *  - restore the points that were REDEEMED against this payment.
 *
 * Returns the magnitudes actually applied so the caller can record them on the
 * refund document. Safe to compute from the payment snapshot (pointsRedeemed)
 * and the earn rate; never lets the balance go below zero.
 */
export async function reverseLoyaltyForPayment({ user, payment, description }) {
  const earnedOnPayment = pointsForAmount(payment.amount);
  // Claw back earned points, but never drive the balance negative.
  const reversed = Math.min(earnedOnPayment, user.loyaltyPoints);
  if (reversed > 0) {
    user.loyaltyPoints -= reversed;
    await user.save();
    await LoyaltyTransaction.create({
      customer: user._id,
      type: LOYALTY_TX_TYPE.REFUND_REVERSE,
      points: reversed,
      balanceAfter: user.loyaltyPoints,
      description: description || 'Points reversed on refund',
      payment: payment._id,
    });
  }

  // Restore points the customer had redeemed against the refunded payment.
  const restored = payment.pointsRedeemed || 0;
  if (restored > 0) {
    user.loyaltyPoints += restored;
    await user.save();
    await LoyaltyTransaction.create({
      customer: user._id,
      type: LOYALTY_TX_TYPE.REFUND_RESTORE,
      points: restored,
      balanceAfter: user.loyaltyPoints,
      description: description || 'Redeemed points restored on refund',
      payment: payment._id,
    });
  }

  return { reversed, restored, balance: user.loyaltyPoints };
}

/** Credit earned points and write a ledger entry. */
export async function earnPoints({ user, amount, payment, description }) {
  const earned = pointsForAmount(amount);
  if (earned <= 0) return { earned: 0, balance: user.loyaltyPoints };
  user.loyaltyPoints += earned;
  await user.save();
  await LoyaltyTransaction.create({
    customer: user._id,
    type: LOYALTY_TX_TYPE.EARN,
    points: earned,
    balanceAfter: user.loyaltyPoints,
    description: description || 'Points earned from payment',
    payment: payment?._id,
  });
  return { earned, balance: user.loyaltyPoints };
}
