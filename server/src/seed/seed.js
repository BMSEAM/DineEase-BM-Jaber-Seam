import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  MenuCategory,
  MenuItem,
  RestaurantTable,
  Reservation,
  Order,
  Payment,
  Invoice,
  Review,
  Favourite,
  Notification,
  CleaningTask,
  LoyaltyTransaction,
  BookingSlot,
  Refund,
} from '../models/index.js';
import { users, categories, menuItems, tables } from './seedData.js';

/**
 * Idempotent seeder: wipes the domain collections and repopulates test
 * accounts, categories, menu items and tables. Run with: npm run seed
 */
async function seed() {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('[seed] Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    MenuCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    RestaurantTable.deleteMany({}),
    Reservation.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Invoice.deleteMany({}),
    Review.deleteMany({}),
    Favourite.deleteMany({}),
    Notification.deleteMany({}),
    CleaningTask.deleteMany({}),
    LoyaltyTransaction.deleteMany({}),
    // Clear ALL dependent collections so a reseed never leaves orphan documents
    // (e.g. a BookingSlot referencing a deleted reservation) — makes the seeder
    // genuinely idempotent when run repeatedly.
    BookingSlot.deleteMany({}),
    Refund.deleteMany({}),
  ]);

  // Users — create() runs the password-hashing hook per document.
  // eslint-disable-next-line no-console
  console.log('[seed] Creating users...');
  await User.create(users);

  // eslint-disable-next-line no-console
  console.log('[seed] Creating categories...');
  const createdCategories = await MenuCategory.insertMany(categories);
  const categoryByName = new Map(createdCategories.map((c) => [c.name, c._id]));

  // eslint-disable-next-line no-console
  console.log('[seed] Creating menu items...');
  const items = menuItems.map(({ categoryName, ...rest }) => ({
    ...rest,
    category: categoryByName.get(categoryName),
  }));
  await MenuItem.insertMany(items);

  // Non-destructive image backfill: for any known seeded dish still missing an
  // image (e.g. records created before images were added), fill it in without
  // touching user-edited images or other fields. Safe to run repeatedly.
  console.log('[seed] Backfilling missing menu images...');
  let backfilled = 0;
  for (const seedItem of menuItems) {
    if (!seedItem.imageUrl) continue;
    const result = await MenuItem.updateOne(
      { name: seedItem.name, $or: [{ imageUrl: '' }, { imageUrl: { $exists: false } }] },
      { $set: { imageUrl: seedItem.imageUrl } }
    );
    backfilled += result.modifiedCount || 0;
  }
  console.log(`[seed] Backfilled ${backfilled} image(s).`);

  // eslint-disable-next-line no-console
  console.log('[seed] Creating tables...');
  const createdTables = await RestaurantTable.insertMany(tables);

  // Deterministic demo fixture: one COMPLETED reservation for the seeded
  // customer so the review flow (F07) is immediately demonstrable — the customer
  // has an eligible past visit and can leave exactly one review. We intentionally
  // do NOT seed any fake reviews or ratings; the review itself is left to the user.
  console.log('[seed] Creating a completed reservation fixture (for review demo)...');
  const customer = await User.findOne({ email: 'customer@dineease.com' });
  const demoTable = createdTables[0];
  if (customer && demoTable) {
    const start = new Date();
    start.setDate(start.getDate() - 1); // yesterday
    start.setHours(19, 0, 0, 0);
    const end = new Date(start.getTime() + 90 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    await Reservation.create({
      customer: customer._id,
      table: demoTable._id,
      date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
      startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
      startAt: start,
      endAt: end,
      guests: 2,
      seatingPreference: demoTable.seatingPreference,
      status: 'completed',
    });
  }

  // Demo cleaning tasks so the cleaner queue is immediately populated — one
  // table task and two non-table (floor/window) tasks that show the broadened
  // housekeeping scope.
  console.log('[seed] Creating demo cleaning tasks...');
  const adminUser = await User.findOne({ email: 'admin@dineease.com' });
  if (adminUser) {
    await CleaningTask.create([
      { area: 'table', table: createdTables[1]._id, raisedBy: adminUser._id, status: 'pending' },
      { area: 'floor', location: 'Main dining hall', description: 'Post-lunch mopping', raisedBy: adminUser._id, status: 'pending' },
      { area: 'window', location: 'Front windows', raisedBy: adminUser._id, status: 'pending' },
    ]);
    // Reflect the table task on the table's status.
    await RestaurantTable.findByIdAndUpdate(createdTables[1]._id, { status: 'cleaning_pending' });
  }

  // eslint-disable-next-line no-console
  console.log('\n[seed] Done. Test accounts (password: password123):');
  users.forEach((u) => console.log(`  - ${u.role.padEnd(9)} ${u.email}`));

  await disconnectDB();
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Failed:', err);
  process.exit(1);
});
