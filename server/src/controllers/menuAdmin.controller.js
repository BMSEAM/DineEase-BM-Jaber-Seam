import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { MenuItem } from '../models/MenuItem.js';
import { MenuCategory } from '../models/MenuCategory.js';

/**
 * F12 Menu Management (admin only). CRUD for menu items and categories,
 * availability toggling and category management.
 */

// POST /api/menu-items
export const createMenuItem = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findById(req.body.category);
  if (!category) throw ApiError.badRequest('Selected category does not exist');

  const item = await MenuItem.create(req.body);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Menu item created',
    data: await item.populate('category', 'name'),
  });
});

// PATCH /api/menu-items/:id
export const updateMenuItem = asyncHandler(async (req, res) => {
  if (req.body.category) {
    const category = await MenuCategory.findById(req.body.category);
    if (!category) throw ApiError.badRequest('Selected category does not exist');
  }

  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('category', 'name');
  if (!item) throw ApiError.notFound('Menu item not found');

  return sendSuccess(res, { message: 'Menu item updated', data: item });
});

// PATCH /api/menu-items/:id/availability  { isAvailable }
export const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw ApiError.notFound('Menu item not found');
  item.isAvailable =
    typeof req.body.isAvailable === 'boolean' ? req.body.isAvailable : !item.isAvailable;
  await item.save();
  return sendSuccess(res, { message: 'Availability updated', data: item });
});

// DELETE /api/menu-items/:id
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) throw ApiError.notFound('Menu item not found');
  return sendSuccess(res, { message: 'Menu item deleted', data: { id: item._id } });
});

// ---- Categories ----

// POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = await MenuCategory.create(req.body);
    return sendSuccess(res, { statusCode: 201, message: 'Category created', data: category });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict('A category with that name already exists');
    throw err;
  }
});

// PATCH /api/categories/:id  — rename / reorder / activate-deactivate
export const updateCategory = asyncHandler(async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) throw ApiError.notFound('Category not found');
    return sendSuccess(res, { message: 'Category updated', data: category });
  } catch (err) {
    if (err && err.code === 11000) throw ApiError.conflict('A category with that name already exists');
    throw err;
  }
});

// DELETE /api/categories/:id  — blocked if items still reference it.
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await MenuItem.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    throw ApiError.conflict(`Cannot delete: ${inUse} menu item(s) use this category`);
  }
  const category = await MenuCategory.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  return sendSuccess(res, { message: 'Category deleted', data: { id: category._id } });
});
