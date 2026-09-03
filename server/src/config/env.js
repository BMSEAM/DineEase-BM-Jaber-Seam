import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, validated access to environment variables.
 * Fail fast at boot if a required secret is missing.
 */
const required = ['MONGO_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const toNumber = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  loyalty: {
    earnRate: toNumber(process.env.LOYALTY_EARN_RATE, 0.05),
    redeemValue: toNumber(process.env.LOYALTY_REDEEM_VALUE, 1),
  },
  vatRate: toNumber(process.env.VAT_RATE, 0.05),
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
