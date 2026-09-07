import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

async function seedMemoryDatabase() {
  const { User, MenuCategory, MenuItem, RestaurantTable } = await import('../models/index.js');
  const { users, categories, menuItems, tables } = await import('../seed/seedData.js');

  await User.create(users);
  const createdCategories = await MenuCategory.insertMany(categories);
  const categoryByName = new Map(createdCategories.map((category) => [category.name, category._id]));

  await MenuItem.insertMany(
    menuItems.map(({ categoryName, ...item }) => ({
      ...item,
      category: categoryByName.get(categoryName),
    }))
  );
  await RestaurantTable.insertMany(tables);
}

/**
 * Connect to MongoDB. Called from server.js at boot.
 * The connection URI is read from the environment — never hard-coded.
 * Falls back to mongodb-memory-server if the configured URI is unreachable.
 */
export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: !env.isProd,
      serverSelectionTimeoutMS: 3000, // fail fast if unreachable
    });
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[db] Could not connect to ${uri}: ${err.message}`);
    // eslint-disable-next-line no-console
    console.log('[db] Starting in-memory MongoDB (mongodb-memory-server)...');

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri('dineease');

    const conn = await mongoose.connect(memUri, {
      autoIndex: true,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] In-memory MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    // eslint-disable-next-line no-console
    console.log('[db] ⚠ Data will NOT persist after server restart.');

    await seedMemoryDatabase();
    return conn;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
