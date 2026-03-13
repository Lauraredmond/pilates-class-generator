// Authentication middleware for Youth Training Hub
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generate JWT token for user
 * @param {Object} user User object with id, email, role
 * @returns {string} JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 * @param {string} token JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header (Bearer token)
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to authorize timeline access
 * Ensures only the parent or linked coaches can view a youth's timeline
 */
export async function authorizeTimelineAccess(req, res, next) {
  try {
    const { youthCode } = req.params;
    const { userId, role } = req.user;

    // Get youth details
    const youthQuery = `
      SELECT id, parent_user_id
      FROM youths
      WHERE UPPER(code) = UPPER($1)
    `;
    const youthResult = await query(youthQuery, [youthCode]);

    if (youthResult.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not found' });
    }

    const youth = youthResult.rows[0];

    // Check if user is the parent
    if (youth.parent_user_id === userId) {
      return next();
    }

    // Check if user is a coach with linked access
    if (role === 'coach') {
      const linkQuery = `
        SELECT 1
        FROM team_youth_links tyl
        JOIN teams t ON t.id = tyl.team_id
        WHERE t.coach_user_id = $1
          AND UPPER(tyl.youth_code) = UPPER($2)
        LIMIT 1
      `;
      const linkResult = await query(linkQuery, [userId, youthCode]);

      if (linkResult.rows.length > 0) {
        return next();
      }
    }

    // Admin can access all timelines
    if (role === 'admin') {
      return next();
    }

    return res.status(403).json({ error: 'Unauthorized to view this timeline' });
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
}

/**
 * Middleware to require specific role(s)
 * @param {string[]} roles Array of allowed roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Middleware to verify user owns a resource (parent owns youth)
 */
export async function verifyYouthOwnership(req, res, next) {
  try {
    const { youthCode } = req.params;
    const { userId, role } = req.user;

    // Admins can access all
    if (role === 'admin') {
      return next();
    }

    // Only parents can modify youth records
    if (role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can modify youth records' });
    }

    const ownershipQuery = `
      SELECT 1
      FROM youths
      WHERE UPPER(code) = UPPER($1)
        AND parent_user_id = $2
    `;
    const result = await query(ownershipQuery, [youthCode, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to modify this youth' });
    }

    next();
  } catch (error) {
    console.error('Ownership verification error:', error);
    return res.status(500).json({ error: 'Failed to verify ownership' });
  }
}

/**
 * Middleware to verify coach owns a team
 */
export async function verifyTeamOwnership(req, res, next) {
  try {
    const { teamId } = req.params;
    const { userId, role } = req.user;

    // Admins can access all
    if (role === 'admin') {
      return next();
    }

    // Only coaches can modify teams
    if (role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can modify teams' });
    }

    const ownershipQuery = `
      SELECT 1
      FROM teams
      WHERE id = $1
        AND coach_user_id = $2
    `;
    const result = await query(ownershipQuery, [teamId, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to modify this team' });
    }

    next();
  } catch (error) {
    console.error('Team ownership verification error:', error);
    return res.status(500).json({ error: 'Failed to verify team ownership' });
  }
}