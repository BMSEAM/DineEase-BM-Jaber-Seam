import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Favourite } from '../models/Favourite.js';
import { MenuItem } from '../models/MenuItem.js';

// GET /api/favourites (protected)
export const getFavourites = asyncHandler(async (req, res) => {
  const favourites = await Favourite.find({ user: req.user._id })
    .populate({
      path: 'menuItem',
      populate: { path: 'category', select: 'name' }
    })
    .sort({ createdAt: -1 });

  // Filter out any null menuItems (if a menu item was deleted)
  const validFavourites = favourites.filter(fav => fav.menuItem != null);

  return sendSuccess(res, {
    message: 'Favourites retrieved',
    data: validFavourites
  });
});

// POST /api/favourites (protected)
export const addFavourite = asyncHandler(async (req, res) => {
  const { menuItem } = req.body;
  if (!menuItem) throw ApiError.badRequest('Menu item ID is required');

  const itemExists = await MenuItem.findById(menuItem);
  if (!itemExists) throw ApiError.notFound('Menu item not found');

  const existing = await Favourite.findOne({ user: req.user._id, menuItem });
  if (existing) throw ApiError.badRequest('Already in favourites');

  const fav = await Favourite.create({ user: req.user._id, menuItem });

  return sendSuccess(res, {
    message: 'Added to favourites',
    data: fav,
    statusCode: 201
  });
});

// DELETE /api/favourites/:menuItemId (protected)
export const removeFavourite = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;

  const fav = await Favourite.findOneAndDelete({ user: req.user._id, menuItem: menuItemId });
  if (!fav) throw ApiError.notFound('Favourite not found');

  return sendSuccess(res, {
    message: 'Removed from favourites',
    data: fav
  });
});
