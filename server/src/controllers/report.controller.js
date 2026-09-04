import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { buildReport } from '../services/report.service.js';

/**
 * F19 Sales and Reservation Reports.
 * GET /api/reports?period=daily|weekly|monthly
 */
export const getReport = asyncHandler(async (req, res) => {
  const period = ['daily', 'weekly', 'monthly'].includes(req.query.period)
    ? req.query.period
    : 'daily';
  const report = await buildReport(period);
  return sendSuccess(res, { message: 'Report generated', data: report });
});
