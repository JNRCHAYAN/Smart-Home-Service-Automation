import { customerNotifications } from '../repo/repo.js';
import { ok, unauthorized } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Builds a customer's notification feed from the most recent status event of
// each of their service requests (see repo.customerNotifications).
export const listNotifications = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res);
  const notifications = await customerNotifications(req.currentUser._id);
  return ok(res, notifications);
});
