import { getDb } from '../database/database.js';

/**
 * Middleware to populate req.user if a valid session exists.
 * Supports standard Express session (req.session.userId)
 * AND token header (Authorization: Bearer <sessionId> or x-session-token).
 * This ensures bulletproof auth both in standard browsers and inside iframes.
 */
export async function populateUser(req, res, next) {
  try {
    const db = await getDb();
    let userId = req.session ? req.session.userId : null;

    // Also check Bearer token or custom header
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.headers['x-session-token']) {
      token = req.headers['x-session-token'];
    }

    if (!userId && token) {
      // Look up session in DB
      const sessionRow = await db.get(
        'SELECT user_id, expires_at FROM sessions WHERE id = ? AND expires_at > datetime("now")',
        [token]
      );
      if (sessionRow) {
        userId = sessionRow.user_id;
      }
    }

    if (userId) {
      const user = await db.get(
        'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
        [userId]
      );
      if (user) {
        req.user = user;
      } else {
        // User was deleted
        if (req.session) delete req.session.userId;
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Error in populateUser middleware:', error);
    req.user = null;
    next();
  }
}

/**
 * Guard middleware for protected routes.
 * Rejects unauthenticated requests with 401.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.'
    });
  }
  next();
}
