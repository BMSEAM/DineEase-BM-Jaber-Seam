import { ROLES, SEATING_PREFERENCE } from '../config/constants.js';

// Test accounts — passwords are hashed by the User model pre-save hook.
export const users = [
  { name: 'DineEase Admin', email: 'admin@dineease.com', password: 'password123', role: ROLES.ADMIN, phone: '01700000001' },
  { name: 'Wade Waiter', email: 'waiter@dineease.com', password: 'password123', role: ROLES.WAITER, phone: '01700000002' },
  { name: 'Clara Cleaner', email: 'cleaner@dineease.com', password: 'password123', role: ROLES.CLEANER, phone: '01700000003' },
  { name: 'Cathy Customer', email: 'customer@dineease.com', password: 'password123', role: ROLES.CUSTOMER, phone: '01700000004' },
];

export const categories = [
  { name: 'Appetizers', description: 'Start your meal right', displayOrder: 1 },
  { name: 'Main Course', description: 'Hearty mains', displayOrder: 2 },
  { name: 'Beverages', description: 'Drinks and refreshments', displayOrder: 3 },
  { name: 'Desserts', description: 'Sweet endings', displayOrder: 4 },
];

// Stable, license-safe food photography from the Unsplash CDN. Each URL points
// at a fixed photo id (never a random endpoint), so the same dish always shows
// the same image. Photos: Unsplash License (https://unsplash.com/license).
// The FoodImage component degrades to a branded local fallback if any of these
// ever fail to load, so a broken URL never breaks the layout.
const img = (id) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

// menuItems reference categories by name; the seeder resolves the ObjectId.
export const menuItems = [
  { name: 'Chicken Wings', categoryName: 'Appetizers', price: 320, description: 'Spicy glazed wings (6 pcs)', isAvailable: true, imageUrl: img('photo-1608039755401-742074f0548d') },
  { name: 'Vegetable Spring Rolls', categoryName: 'Appetizers', price: 180, description: 'Crispy rolls with sweet chili dip', isAvailable: true, imageUrl: img('photo-1544982503-9f984c14501a') },
  { name: 'Mozzarella Sticks', categoryName: 'Appetizers', price: 260, description: 'Golden fried cheese sticks', isAvailable: true, imageUrl: img('photo-1548340748-6d2b7d7da280') },
  { name: 'Grilled Chicken Platter', categoryName: 'Main Course', price: 540, description: 'Grilled chicken with rice and salad', isAvailable: true, imageUrl: img('photo-1532550907401-a500c9a57435') },
  { name: 'Beef Burger', categoryName: 'Main Course', price: 420, description: 'Double patty beef burger with fries', isAvailable: true, imageUrl: img('photo-1568901346375-23c9450c58cd') },
  { name: 'Prawn Alfredo Pasta', categoryName: 'Main Course', price: 610, description: 'Creamy alfredo with grilled prawns', isAvailable: true, imageUrl: img('photo-1621996346565-e3dbc646d9a9') },
  { name: 'Margherita Pizza', categoryName: 'Main Course', price: 580, description: 'Classic tomato, basil and mozzarella', isAvailable: true, imageUrl: img('photo-1513104890138-7c749659a591') },
  { name: 'Fish and Chips', categoryName: 'Main Course', price: 490, description: 'Battered fish with fries', isAvailable: false, imageUrl: img('photo-1579208030886-b937da0925dc') },
  { name: 'Fresh Lime Soda', categoryName: 'Beverages', price: 120, description: 'Sweet or salted', isAvailable: true, imageUrl: img('photo-1461023058943-07fcbe16d735') },
  { name: 'Iced Coffee', categoryName: 'Beverages', price: 180, description: 'Cold brew over ice', isAvailable: true, imageUrl: img('photo-1544145945-f90425340c7e') },
  { name: 'Mango Smoothie', categoryName: 'Beverages', price: 220, description: 'Seasonal fresh mango', isAvailable: true, imageUrl: img('photo-1526318472351-c75fcf070305') },
  { name: 'Chocolate Lava Cake', categoryName: 'Desserts', price: 280, description: 'Warm cake with molten center', isAvailable: true, imageUrl: img('photo-1624353365286-3f8d62daad51') },
  { name: 'Cheesecake Slice', categoryName: 'Desserts', price: 300, description: 'New York style cheesecake', isAvailable: true, imageUrl: img('photo-1533134242443-d4fd215305ad') },
];

export const tables = [
  { tableNumber: 'T1', capacity: 2, seatingPreference: SEATING_PREFERENCE.WINDOW },
  { tableNumber: 'T2', capacity: 2, seatingPreference: SEATING_PREFERENCE.INDOOR },
  { tableNumber: 'T3', capacity: 4, seatingPreference: SEATING_PREFERENCE.INDOOR },
  { tableNumber: 'T4', capacity: 4, seatingPreference: SEATING_PREFERENCE.OUTDOOR },
  { tableNumber: 'T5', capacity: 6, seatingPreference: SEATING_PREFERENCE.OUTDOOR },
  { tableNumber: 'T6', capacity: 6, seatingPreference: SEATING_PREFERENCE.WINDOW },
  { tableNumber: 'T7', capacity: 8, seatingPreference: SEATING_PREFERENCE.PRIVATE },
  { tableNumber: 'T8', capacity: 10, seatingPreference: SEATING_PREFERENCE.PRIVATE },
];
