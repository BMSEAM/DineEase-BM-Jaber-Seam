import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { MenuItem } from '../models/MenuItem.js';
import { MenuCategory } from '../models/MenuCategory.js';

/**
 * F01 Restaurant Menu + F02 Search and Filter.
 * GET /api/menu-items?search=&category=&minPrice=&maxPrice=&available=&sort=&page=&limit=
 * Public endpoint — customers browse without authenticating.
 */
export const listMenuItems = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, available, sort } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 12;

  const filter = {};
  // Escape regex metacharacters so raw user input (e.g. "[") is treated as a
  // literal search term instead of an invalid pattern that would throw a 500.
  if (search) {
    const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.name = { $regex: safe, $options: 'i' };
  }
  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const sortMap = {
    price: { price: 1 },
    '-price': { price: -1 },
    name: { name: 1 },
    '-name': { name: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || { name: 1 };

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category', 'name')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit),
    MenuItem.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: 'Menu items retrieved',
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/menu-items/:id  (public)
export const getMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id).populate('category', 'name');
  if (!item) throw ApiError.notFound('Menu item not found');
  return sendSuccess(res, { message: 'Menu item retrieved', data: item });
});

// GET /api/categories  (public)
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
  return sendSuccess(res, { message: 'Categories retrieved', data: categories });
});
