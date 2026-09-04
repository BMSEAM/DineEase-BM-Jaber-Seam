import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Favourite } from '../models/Favourite.js';
import { MenuItem } from '../models/MenuItem.js';

/**
 * F06 Favourite Menu Items. Add / remove / list a customer's favourites.
 */

// GET /api/favourites
export const listFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ customer: req.user._id })
    .populate({ path: 'menuItem', populate: { path: 'category', select: 'name' } })
    .sort({ createdAt: -1 });
  // Filter out any dangling favourites whose menu item was deleted.
  const data = favourites.filter((f) => f.menuItem);
  return sendSuccess(res, { message: 'Favourites retrieved', data });
});

// POST /api/favourites  { menuItem }
export const addFavourite = asyncHandler(async (req, res) => {
  const { menuItem } = req.body;
  const item = await MenuItem.findById(menuItem);
  if (!item) throw ApiError.notFound('Menu item not found');

  try {
    const fav = await Favourite.create({ customer: req.user._id, menuItem });
    return sendSuccess(res, { statusCode: 201, message: 'Added to favourites', data: fav });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Already in your favourites');
    throw err;
  }
});

// DELETE /api/favourites/:menuItemId
export const removeFavourite = asyncHandler(async (req, res) => {
  const removed = await Favourite.findOneAndDelete({
    customer: req.user._id,
    menuItem: req.params.menuItemId,
  });
  if (!removed) throw ApiError.notFound('Favourite not found');
  return sendSuccess(res, { message: 'Removed from favourites', data: { id: removed._id } });
});
