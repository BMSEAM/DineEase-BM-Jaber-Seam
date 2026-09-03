import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

/**
 * Builds and returns the configured Express application (no listening here —
 * server.js and tests own that). Follows the request pipeline:
 * cors -> body parsing -> logging -> /api routes -> 404 -> error handler.
 */
export function createApp() {
  const app = express();

  // In development, accept any localhost origin so an alternate Vite port
  // (5174, 5175, …) never triggers a CORS "Network Error". Production locks
  // to CLIENT_URL only.
  const corsOrigin = env.isProd
    ? env.clientUrl
    : (origin, cb) => {
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return cb(null, true);
        }
        return cb(null, false);
      };

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isTest) app.use(morgan('dev'));

  app.get('/', (req, res) =>
    res.json({ success: true, message: 'DineEase API', data: { docs: '/api/health' } })
  );

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
