// Youth management routes
import express from 'express';
import { query, transaction } from '../db/index.js';
import { authenticateToken, requireRole, verifyYouthOwnership } from '../middleware/auth.js';

const router = express.Router();

/**
 * Generate unique 6-character code for youth
 * Excludes ambiguous characters (0/O, 1/I/L)
 */
async function generateUniqueCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    // Check if code exists
    const existingQuery = `
      SELECT 1 FROM youths WHERE code = $1
    `;
    const existing = await query(existingQuery, [code]);

    if (existing.rows.length === 0) {
      return code;
    }
  }

  throw new Error('Could not generate unique code after 100 attempts');
}

/**
 * POST /api/youths/register
 * Register a new youth (parent only)
 *
 * Body: {
 *   name: string
 * }
 */
router.post('/register', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { name } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate unique code
    const code = await generateUniqueCode();

    // Create youth
    const insertQuery = `
      INSERT INTO youths (name, code, parent_user_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, code
    `;
    const result = await query(insertQuery, [name.trim(), code, userId]);
    const youth = result.rows[0];

    res.status(201).json({
      youth: {
        id: youth.id,
        name: youth.name,
        code: youth.code
      },
      message: `Youth registered successfully. Share code ${youth.code} with coaches.`
    });

  } catch (error) {
    console.error('Youth registration error:', error);
    res.status(500).json({ error: 'Failed to register youth' });
  }
});

/**
 * GET /api/youths
 * Get all youths for authenticated parent
 */
router.get('/', authenticateToken, requireRole('parent'), async (req, res) => {
  try {
    const { userId } = req.user;

    const youthsQuery = `
      SELECT
        y.id,
        y.name,
        y.code,
        y.created_at,
        COUNT(DISTINCT tyl.team_id) as team_count,
        COUNT(DISTINCT pa.id) as activity_count,
        COUNT(DISTINCT sa.session_id) as session_count
      FROM youths y
      LEFT JOIN team_youth_links tyl ON tyl.youth_code = y.code
      LEFT JOIN parent_activities pa ON pa.youth_code = y.code
      LEFT JOIN session_attendance sa ON sa.youth_code = y.code
      WHERE y.parent_user_id = $1
      GROUP BY y.id, y.name, y.code, y.created_at
      ORDER BY y.created_at DESC
    `;
    const result = await query(youthsQuery, [userId]);

    res.json({
      youths: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        code: row.code,
        createdAt: row.created_at,
        stats: {
          teamCount: parseInt(row.team_count),
          activityCount: parseInt(row.activity_count),
          sessionCount: parseInt(row.session_count)
        }
      }))
    });

  } catch (error) {
    console.error('Get youths error:', error);
    res.status(500).json({ error: 'Failed to get youths' });
  }
});

/**
 * GET /api/youths/:code
 * Get youth details by code
 * Accessible by parent or linked coaches
 */
router.get('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const { userId, role } = req.user;

    // Get youth details
    const youthQuery = `
      SELECT
        y.id,
        y.name,
        y.code,
        y.parent_user_id,
        y.created_at,
        u.name as parent_name
      FROM youths y
      JOIN users u ON u.id = y.parent_user_id
      WHERE UPPER(y.code) = UPPER($1)
    `;
    const youthResult = await query(youthQuery, [code]);

    if (youthResult.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not found' });
    }

    const youth = youthResult.rows[0];

    // Check access permissions
    let hasAccess = false;

    // Parent has access to their own children
    if (youth.parent_user_id === userId) {
      hasAccess = true;
    }

    // Coach has access if youth is linked to their team
    if (role === 'coach') {
      const linkQuery = `
        SELECT 1
        FROM team_youth_links tyl
        JOIN teams t ON t.id = tyl.team_id
        WHERE t.coach_user_id = $1
          AND UPPER(tyl.youth_code) = UPPER($2)
        LIMIT 1
      `;
      const linkResult = await query(linkQuery, [userId, code]);
      if (linkResult.rows.length > 0) {
        hasAccess = true;
      }
    }

    // Admins always have access
    if (role === 'admin') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this youth' });
    }

    // Get linked teams
    const teamsQuery = `
      SELECT
        t.id,
        t.name,
        t.sport,
        t.level,
        u.name as coach_name
      FROM team_youth_links tyl
      JOIN teams t ON t.id = tyl.team_id
      JOIN users u ON u.id = t.coach_user_id
      WHERE UPPER(tyl.youth_code) = UPPER($1)
      ORDER BY tyl.linked_at DESC
    `;
    const teamsResult = await query(teamsQuery, [code]);

    // Get recent activities
    const recentQuery = `
      WITH recent_events AS (
        -- Coach sessions
        SELECT
          'coach' as source,
          cs.training_date,
          cs.sport::VARCHAR as activity,
          cs.team_name as label
        FROM coach_sessions cs
        JOIN session_attendance sa ON sa.session_id = cs.id
        WHERE UPPER(sa.youth_code) = UPPER($1)

        UNION ALL

        -- Parent activities
        SELECT
          'parent' as source,
          pa.training_date,
          pa.activity,
          pa.activity as label
        FROM parent_activities pa
        WHERE UPPER(pa.youth_code) = UPPER($1)
      )
      SELECT * FROM recent_events
      ORDER BY training_date DESC
      LIMIT 5
    `;
    const recentResult = await query(recentQuery, [code]);

    res.json({
      youth: {
        id: youth.id,
        name: youth.name,
        code: youth.code,
        parentName: youth.parent_name,
        createdAt: youth.created_at
      },
      teams: teamsResult.rows.map(team => ({
        id: team.id,
        name: team.name,
        sport: team.sport,
        level: team.level,
        coachName: team.coach_name
      })),
      recentActivities: recentResult.rows.map(activity => ({
        source: activity.source,
        trainingDate: activity.training_date,
        activity: activity.activity,
        label: activity.label
      }))
    });

  } catch (error) {
    console.error('Get youth error:', error);
    res.status(500).json({ error: 'Failed to get youth details' });
  }
});

/**
 * PUT /api/youths/:code
 * Update youth name (parent only)
 *
 * Body: {
 *   name: string
 * }
 */
router.put('/:code', authenticateToken, verifyYouthOwnership, async (req, res) => {
  try {
    const { code } = req.params;
    const { name } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Update youth
    const updateQuery = `
      UPDATE youths
      SET name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE UPPER(code) = UPPER($2)
      RETURNING id, name, code
    `;
    const result = await query(updateQuery, [name.trim(), code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not found' });
    }

    const youth = result.rows[0];

    res.json({
      youth: {
        id: youth.id,
        name: youth.name,
        code: youth.code
      }
    });

  } catch (error) {
    console.error('Update youth error:', error);
    res.status(500).json({ error: 'Failed to update youth' });
  }
});

/**
 * DELETE /api/youths/:code
 * Delete youth and all associated data (parent only)
 * This will cascade delete all linked data
 */
router.delete('/:code', authenticateToken, verifyYouthOwnership, async (req, res) => {
  try {
    const { code } = req.params;

    // Delete youth (cascades to all related data)
    const deleteQuery = `
      DELETE FROM youths
      WHERE UPPER(code) = UPPER($1)
      RETURNING name
    `;
    const result = await query(deleteQuery, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Youth not found' });
    }

    res.json({
      message: `Youth ${result.rows[0].name} and all associated data deleted successfully`
    });

  } catch (error) {
    console.error('Delete youth error:', error);
    res.status(500).json({ error: 'Failed to delete youth' });
  }
});

/**
 * POST /api/youths/:code/regenerate-code
 * Generate a new code for a youth (parent only)
 * Useful if code has been compromised
 */
router.post('/:code/regenerate-code', authenticateToken, verifyYouthOwnership, async (req, res) => {
  try {
    const { code } = req.params;

    // Use transaction to ensure atomicity
    const result = await transaction(async (client) => {
      // Generate new code
      const newCode = await generateUniqueCode();

      // Update youth code
      const updateYouthQuery = `
        UPDATE youths
        SET code = $1, updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(code) = UPPER($2)
        RETURNING id, name, code
      `;
      const youthResult = await client.query(updateYouthQuery, [newCode, code]);

      if (youthResult.rows.length === 0) {
        throw new Error('Youth not found');
      }

      // Update all references to the old code
      // Note: In production, you might want to notify coaches of the change

      return youthResult.rows[0];
    });

    res.json({
      youth: {
        id: result.id,
        name: result.name,
        code: result.code
      },
      message: `New code generated: ${result.code}. Please share with coaches.`
    });

  } catch (error) {
    console.error('Regenerate code error:', error);
    res.status(500).json({ error: 'Failed to regenerate code' });
  }
});

// TODO: Future endpoint for youth self-logging when that feature is implemented
// router.post('/:code/self-log', authenticateToken, requireRole('youth'), ...)

export default router;