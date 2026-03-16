// Authentication routes for Youth Training Hub
import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Register a new parent or coach
 *
 * Body: {
 *   email: string,
 *   password: string,
 *   name: string,
 *   role: 'parent' | 'coach'
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['parent', 'coach'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either parent or coach' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const existingQuery = `
      SELECT id FROM users WHERE LOWER(email) = LOWER($1)
    `;
    const existing = await query(existingQuery, [email]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const insertQuery = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role
    `;
    const result = await query(insertQuery, [email, passwordHash, name, role]);
    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 *
 * Body: {
 *   email: string,
 *   password: string
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const userQuery = `
      SELECT id, email, password_hash, name, role
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `;
    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Log failed attempt
      const attemptQuery = `
        INSERT INTO code_attempts (user_id, success, attempted_at)
        VALUES ($1, false, CURRENT_TIMESTAMP)
      `;
      await query(attemptQuery, [user.id]);

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Get additional info based on role
    let additionalInfo = {};

    if (user.role === 'parent') {
      // Get registered youths for parent
      const youthsQuery = `
        SELECT id, name, code
        FROM youths
        WHERE parent_user_id = $1
        ORDER BY created_at DESC
      `;
      const youthsResult = await query(youthsQuery, [user.id]);
      additionalInfo.youths = youthsResult.rows;
    } else if (user.role === 'coach') {
      // Get teams for coach
      const teamsQuery = `
        SELECT id, name, sport, level
        FROM teams
        WHERE coach_user_id = $1
        ORDER BY created_at DESC
      `;
      const teamsResult = await query(teamsQuery, [user.id]);
      additionalInfo.teams = teamsResult.rows;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...additionalInfo
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user details
    const userQuery = `
      SELECT id, email, name, role
      FROM users
      WHERE id = $1
    `;
    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get additional info based on role
    let additionalInfo = {};

    if (user.role === 'parent') {
      // Get registered youths for parent
      const youthsQuery = `
        SELECT id, name, code
        FROM youths
        WHERE parent_user_id = $1
        ORDER BY created_at DESC
      `;
      const youthsResult = await query(youthsQuery, [userId]);
      additionalInfo.youths = youthsResult.rows;
    } else if (user.role === 'coach') {
      // Get teams for coach
      const teamsQuery = `
        SELECT
          t.id,
          t.name,
          t.sport,
          t.level,
          COUNT(DISTINCT tyl.youth_code) as player_count
        FROM teams t
        LEFT JOIN team_youth_links tyl ON tyl.team_id = t.id
        WHERE t.coach_user_id = $1
        GROUP BY t.id, t.name, t.sport, t.level
        ORDER BY t.created_at DESC
      `;
      const teamsResult = await query(teamsQuery, [userId]);
      additionalInfo.teams = teamsResult.rows;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...additionalInfo
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client should remove token)
 */
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // This endpoint exists for future session management if needed
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/change-password
 * Change user password
 *
 * Body: {
 *   currentPassword: string,
 *   newPassword: string
 * }
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get current password hash
    const userQuery = `
      SELECT password_hash
      FROM users
      WHERE id = $1
    `;
    const result = await query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const updateQuery = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await query(updateQuery, [newPasswordHash, userId]);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;