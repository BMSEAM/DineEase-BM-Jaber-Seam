import { MenuItem } from '../models/MenuItem.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS_FLOW } from '../config/constants.js';

/**
 * Validate a list of { menuItem, quantity } lines against the live menu,
 * snapshotting name/price and computing line totals + subtotal.
 * Rejects unavailable items, unknown ids and non-positive quantities.
 */
export async function buildOrderItems(lines = []) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw ApiError.badRequest('At least one order item is required');
  }

  const ids = lines.map((l) => l.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: ids } });
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  const items = [];
  let subtotal = 0;

  for (const line of lines) {
    const item = byId.get(String(line.menuItem));
    if (!item) throw ApiError.badRequest(`Menu item ${line.menuItem} does not exist`);
    if (!item.isAvailable) throw ApiError.badRequest(`"${item.name}" is currently unavailable`);

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.badRequest(`Invalid quantity for "${item.name}"`);
    }

    const lineTotal = item.price * quantity;
    subtotal += lineTotal;
    items.push({
      menuItem: item._id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      lineTotal,
    });
  }

  return { items, subtotal: Number(subtotal.toFixed(2)) };
}

/**
 * Guard order-status transitions (F10). Returns true if `to` is a legal next
 * state from `from`, per ORDER_STATUS_FLOW.
 */
export function canTransition(from, to) {
  const allowed = ORDER_STATUS_FLOW[from] || [];
  return allowed.includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw ApiError.badRequest(`Cannot change order status from "${from}" to "${to}"`);
  }
}
